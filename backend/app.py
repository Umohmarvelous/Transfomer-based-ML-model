from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
import pandas as pd
import json
import os
from werkzeug.utils import secure_filename
import logging
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest, RandomForestRegressor
import requests
from requests.exceptions import ConnectionError
from dotenv import load_dotenv
from sklearn.linear_model import LinearRegression

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Configure CORS to allow requests from any localhost port
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",
    os.getenv('FRONTEND_URL', 'http://localhost:3000')
]}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the model and tokenizer with error handling
MODEL_NAME = os.getenv('MODEL_NAME', 'bert-base-uncased')
tokenizer = None
model = None

def initialize_model():
    global tokenizer, model
    try:
        logger.info("Attempting to download model from Hugging Face...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModel.from_pretrained(MODEL_NAME)
        logger.info("Model successfully loaded")
    except ConnectionError as e:
        logger.error(f"Connection error while downloading model: {str(e)}")
        logger.info("Using fallback simple tokenization...")
        # Fallback to simple tokenization
        tokenizer = None
        model = None
    except Exception as e:
        logger.error(f"Error initializing model: {str(e)}")
        tokenizer = None
        model = None

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.getenv('UPLOAD_FOLDER', 'uploads'))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'csv,json,xls,xlsx').split(','))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_embeddings(text):
    if tokenizer is None or model is None:
        # Fallback to simple tokenization and random embeddings
        words = text.lower().split()
        # Create a simple random embedding of size 768 (same as BERT)
        embedding = np.random.randn(1, 768)
        return embedding.tolist()
    
    try:
        # Tokenize and get model outputs
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get the [CLS] token embeddings
        embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        return embeddings.tolist()
    except Exception as e:
        logger.error(f"Error getting embeddings: {str(e)}")
        # Fallback to random embeddings
        embedding = np.random.randn(1, 768)
        return embedding.tolist()

def process_data(df, preprocessing_steps):
    """Process the data according to specified preprocessing steps"""
    try:
        # Make a copy of the DataFrame to avoid modifying the original
        df_processed = df.copy()
        
        # Handle missing values
        if preprocessing_steps.get('handle_missing'):
            strategy = preprocessing_steps['handle_missing'].get('strategy', 'mean')
            if strategy == 'mean':
                df_processed = df_processed.fillna(df_processed.mean())
            elif strategy == 'median':
                df_processed = df_processed.fillna(df_processed.median())
            elif strategy == 'mode':
                df_processed = df_processed.fillna(df_processed.mode().iloc[0])
            elif strategy == 'drop':
                df_processed = df_processed.dropna()
        
        # Handle outliers
        if preprocessing_steps.get('handle_outliers'):
            method = preprocessing_steps['handle_outliers'].get('method', 'zscore')
            threshold = preprocessing_steps['handle_outliers'].get('threshold', 3)
            
            numeric_columns = df_processed.select_dtypes(include=[np.number]).columns
            
            if method == 'zscore':
                for col in numeric_columns:
                    z_scores = np.abs((df_processed[col] - df_processed[col].mean()) / df_processed[col].std())
                    df_processed = df_processed[z_scores < threshold]
            elif method == 'iqr':
                for col in numeric_columns:
                    Q1 = df_processed[col].quantile(0.25)
                    Q3 = df_processed[col].quantile(0.75)
                    IQR = Q3 - Q1
                    df_processed = df_processed[
                        (df_processed[col] >= Q1 - 1.5 * IQR) & 
                        (df_processed[col] <= Q3 + 1.5 * IQR)
                    ]
        
        # Normalize/Scale data
        if preprocessing_steps.get('normalize'):
            method = preprocessing_steps['normalize'].get('method', 'minmax')
            numeric_columns = df_processed.select_dtypes(include=[np.number]).columns
            
            if method == 'minmax':
                for col in numeric_columns:
                    df_processed[col] = (df_processed[col] - df_processed[col].min()) / (df_processed[col].max() - df_processed[col].min())
            elif method == 'standard':
                for col in numeric_columns:
                    df_processed[col] = (df_processed[col] - df_processed[col].mean()) / df_processed[col].std()
        
        # Encode categorical variables
        if preprocessing_steps.get('encode_categorical'):
            method = preprocessing_steps['encode_categorical'].get('method', 'onehot')
            categorical_columns = df_processed.select_dtypes(include=['object']).columns
            
            if method == 'onehot':
                df_processed = pd.get_dummies(df_processed, columns=categorical_columns)
            elif method == 'label':
                for col in categorical_columns:
                    df_processed[col] = df_processed[col].astype('category').cat.codes
        
        # Convert to dictionary format for JSON serialization
        result = df_processed.to_dict(orient='records')
        return result
        
    except Exception as e:
        logger.error(f"Error in process_data: {str(e)}")
        raise Exception(f"Error processing data: {str(e)}")

@app.route('/api/ingest-data', methods=['POST'])
def ingest_data():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        data_type = request.form.get('dataType', 'csv')
        preprocessing_steps = json.loads(request.form.get('preprocessing', '{}'))

        # Save the file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        saved_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        file.save(filepath)

        # Read the file based on its type
        try:
            if data_type == 'csv':
                df = pd.read_csv(filepath)
            elif data_type == 'json':
                # Read JSON file with proper handling
                with open(filepath, 'r') as f:
                    json_data = json.load(f)
                
                # Convert JSON data to DataFrame
                if isinstance(json_data, list):
                    # If JSON is a list of objects
                    df = pd.DataFrame(json_data)
                elif isinstance(json_data, dict):
                    # If JSON is a single object
                    df = pd.DataFrame([json_data])
                else:
                    return jsonify({'error': 'Invalid JSON format. Expected a list of objects or a single object.'}), 400
                
                # Ensure all required columns are present
                if df.empty:
                    return jsonify({'error': 'No data found in JSON file.'}), 400
                
                # Log the DataFrame structure
                logger.info(f"DataFrame columns: {df.columns.tolist()}")
                logger.info(f"DataFrame shape: {df.shape}")
                
            elif data_type in ['xls', 'xlsx']:
                df = pd.read_excel(filepath)
            else:
                return jsonify({'error': 'Unsupported file type'}), 400
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return jsonify({'error': f'Invalid JSON format: {str(e)}'}), 400
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return jsonify({'error': f'Error reading file: {str(e)}'}), 400

        # Process the data
        try:
            processed_data = process_data(df, preprocessing_steps)
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            return jsonify({'error': f'Error processing data: {str(e)}'}), 500

        # Save processed data
        processed_filename = f"processed_{saved_filename}"
        processed_filepath = os.path.join(app.config['UPLOAD_FOLDER'], processed_filename)
        
        try:
            # Convert processed data back to DataFrame with proper index
            df_processed = pd.DataFrame(processed_data)
            
            if data_type == 'csv':
                df_processed.to_csv(processed_filepath, index=False)
            elif data_type == 'json':
                df_processed.to_json(processed_filepath, orient='records')
            elif data_type in ['xls', 'xlsx']:
                df_processed.to_excel(processed_filepath, index=False)
        except Exception as e:
            logger.error(f"Error saving processed file: {str(e)}")
            return jsonify({'error': f'Error saving processed file: {str(e)}'}), 500

        # Return summary statistics
        summary = {
            'original_rows': len(df),
            'processed_rows': len(df_processed),
            'columns': list(df_processed.columns),
            'numeric_columns': list(df_processed.select_dtypes(include=[np.number]).columns),
            'categorical_columns': list(df_processed.select_dtypes(include=['object']).columns),
            'missing_values': df_processed.isnull().sum().to_dict(),
            'file_path': processed_filepath
        }

        return jsonify({
            'message': 'Data processed successfully',
            'summary': summary
        })

    except Exception as e:
        logger.error(f"Error in data ingestion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Get embeddings
        embeddings = get_embeddings(text)
        
        # Calculate some basic statistics
        embedding_array = np.array(embeddings)
        mean_embedding = np.mean(embedding_array, axis=0).tolist()
        std_embedding = np.std(embedding_array, axis=0).tolist()
        
        return jsonify({
            'embeddings': embeddings,
            'statistics': {
                'mean': mean_embedding,
                'std': std_embedding
            }
        })
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

def analyze_timeseries(data):
    """Analyze time series data for bottlenecks and anomalies"""
    try:
        # Validate input data
        if not isinstance(data, list):
            raise ValueError("Input data must be a list of objects")
        
        # Validate each item in the data
        for item in data:
            if not isinstance(item, dict):
                raise ValueError("Each item must be a dictionary")
            if 'timestamp' not in item:
                raise ValueError("Each item must have a 'timestamp' field")
            if 'step' not in item:
                raise ValueError("Each item must have a 'step' field")
            if 'delay' not in item:
                raise ValueError("Each item must have a 'delay' field")
            
            # Convert delay to float if it's a string
            if isinstance(item['delay'], str):
                try:
                    item['delay'] = float(item['delay'])
                except ValueError:
                    raise ValueError(f"Delay value '{item['delay']}' cannot be converted to a number")
        
        # Convert timestamps to datetime objects
        for item in data:
            try:
                item['timestamp'] = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
            except ValueError as e:
                raise ValueError(f"Invalid timestamp format: {item['timestamp']}. Expected ISO format (YYYY-MM-DDTHH:mm:ss)")
        
        # Sort by timestamp
        data.sort(key=lambda x: x['timestamp'])
        
        # Calculate delays between steps
        delays = []
        for i in range(1, len(data)):
            delay = (data[i]['timestamp'] - data[i-1]['timestamp']).total_seconds() / 3600  # Convert to hours
            delays.append(delay)
        
        # Calculate bottleneck impact scores
        bottlenecks = []
        for i, step in enumerate(data):
            if i == 0:
                continue
            impact = float(step['delay']) / max(delays) if max(delays) > 0 else 0
            bottlenecks.append({
                'step': step['step'],
                'impact': impact,
                'delay': float(step['delay'])
            })
        
        # Sort bottlenecks by impact
        bottlenecks.sort(key=lambda x: x['impact'], reverse=True)
        
        # Detect anomalies using Isolation Forest
        delay_values = np.array([float(item['delay']) for item in data]).reshape(-1, 1)
        scaler = StandardScaler()
        delay_values_scaled = scaler.fit_transform(delay_values)
        
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        anomalies = iso_forest.fit_predict(delay_values_scaled)
        
        # Identify anomalous steps
        anomalous_steps = []
        for i, (is_anomaly, step) in enumerate(zip(anomalies, data)):
            if is_anomaly == -1:  # -1 indicates anomaly
                anomalous_steps.append({
                    'step': step['step'],
                    'description': f"Unusual delay pattern detected: {step['delay']} hours"
                })
        
        # Generate recommendations
        recommendations = []
        
        # Bottleneck recommendations
        if bottlenecks:
            top_bottleneck = bottlenecks[0]
            recommendations.append({
                'title': 'Bottleneck Optimization',
                'description': f"Consider optimizing {top_bottleneck['step']} as it has the highest impact on process delays."
            })
        
        # Anomaly recommendations
        if anomalous_steps:
            recommendations.append({
                'title': 'Process Anomaly',
                'description': f"Investigate unusual delays in {', '.join(step['step'] for step in anomalous_steps)}."
            })
        
        # Sequential optimization recommendations
        if len(bottlenecks) >= 2:
            recommendations.append({
                'title': 'Process Reordering',
                'description': f"Consider reordering steps to reduce dependencies between {bottlenecks[0]['step']} and {bottlenecks[1]['step']}."
            })
        
        return {
            'bottlenecks': bottlenecks,
            'anomalies': anomalous_steps,
            'recommendations': recommendations
        }
        
    except Exception as e:
        logger.error(f"Error in time series analysis: {str(e)}")
        raise ValueError(str(e))
 
@app.route('/api/analyze-timeseries', methods=['POST'])
def analyze_timeseries_endpoint():
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return jsonify({'error': 'No data provided'}), 400
        
        results = analyze_timeseries(data['data'])
        return jsonify(results)
    
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
# Initialize the model when the server starts
initialize_model()

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Allow external connections 
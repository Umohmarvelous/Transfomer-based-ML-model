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
from sklearn.ensemble import IsolationForest
import requests
from requests.exceptions import ConnectionError
from dotenv import load_dotenv

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

# Store process model state (in a real application, this would be in a database)
process_model_state = {
    "steps": [
        {"id": 1, "text": "Raw Material Supply"},
        {"id": 2, "text": "Manufacturing"},
        {"id": 3, "text": "Quality Control"},
        {"id": 4, "text": "Distribution"},
        {"id": 5, "text": "Retail"}
    ]
}

def get_embeddings(text):
    if tokenizer is None or model is None:
        # Fallback to simple tokenization and random embeddings
        words = text.lower().split()
        # Create a simple random embedding of size 768 (same as BERT)
        embedding = np.random.randn(1, 768)
        return embedding.tolist()
    
    try:
        # Tokenize and get model outputs
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
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

@app.route('/api/process-model', methods=['GET'])
def get_process_model():
    return jsonify(process_model_state)

@app.route('/api/process-model', methods=['POST'])
def update_process_model():
    try:
        data = request.get_json()
        if not data or 'steps' not in data:
            return jsonify({'error': 'Invalid process model data'}), 400
        
        process_model_state['steps'] = data['steps']
        return jsonify({'message': 'Process model updated successfully'})
    
    except Exception as e:
        logger.error(f"Error updating process model: {str(e)}")
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

def analyze_supply_chain_data(df):
    """Analyze supply chain data for insights and recommendations"""
    try:
        # Convert DataFrame to string representation for logging
        logger.info(f"Received DataFrame with columns: {df.columns.tolist()}")
        logger.info(f"DataFrame shape: {df.shape}")

        # Ensure we have a DataFrame
        if not isinstance(df, pd.DataFrame):
            logger.error("Input is not a DataFrame")
            return {
                'error': 'Invalid data format. Please ensure your data is properly formatted.'
            }

        # Check if DataFrame is empty
        if df.empty:
            logger.error("Empty DataFrame received")
            return {
                'error': 'No data found in the file. Please check your data.'
            }

        # Try to identify timestamp column
        timestamp_col = None
        for col in df.columns:
            if 'time' in col.lower() or 'date' in col.lower():
                timestamp_col = col
                break

        if timestamp_col is None:
            logger.error("No timestamp column found")
            return {
                'error': 'No timestamp column found. Please ensure your data includes a timestamp or date column.'
            }

        # Try to identify product column
        product_col = None
        for col in df.columns:
            if 'product' in col.lower() or 'item' in col.lower() or 'sku' in col.lower():
                product_col = col
                break

        if product_col is None:
            logger.error("No product column found")
            return {
                'error': 'No product column found. Please ensure your data includes a product identifier column.'
            }

        # Try to identify quantity column
        quantity_col = None
        for col in df.columns:
            if 'quantity' in col.lower() or 'amount' in col.lower() or 'qty' in col.lower():
                quantity_col = col
                break

        if quantity_col is None:
            logger.error("No quantity column found")
            return {
                'error': 'No quantity column found. Please ensure your data includes a quantity column.'
            }

        # Convert timestamp to datetime if it's not already
        try:
            df[timestamp_col] = pd.to_datetime(df[timestamp_col])
        except Exception as e:
            logger.error(f"Error converting timestamp: {str(e)}")
            return {
                'error': 'Error processing timestamp data. Please ensure your timestamp column is in a valid format.'
            }

        # Calculate key metrics - using optimized operations
        metrics = {
            'total_products': df[product_col].nunique(),  # Faster than len(unique())
            'total_locations': df['location'].nunique() if 'location' in df.columns else 0,
            'date_range': {
                'start': df[timestamp_col].min().strftime('%Y-%m-%d'),
                'end': df[timestamp_col].max().strftime('%Y-%m-%d')
            }
        }

        # Calculate demand patterns - using optimized groupby
        try:
            # Sample data if too large (e.g., more than 100,000 rows)
            sample_size = min(100000, len(df))
            if len(df) > sample_size:
                df_sample = df.sample(n=sample_size, random_state=42)
            else:
                df_sample = df

            # Optimize groupby operations
            daily_demand = (df_sample.groupby([df_sample[timestamp_col].dt.date, product_col])
                          [quantity_col].sum().reset_index())
            demand_volatility = daily_demand.groupby(product_col)[quantity_col].std()
        except Exception as e:
            logger.error(f"Error calculating demand patterns: {str(e)}")
            demand_volatility = pd.Series()

        # Identify potential bottlenecks - using optimized operations
        try:
            if 'location' in df.columns:
                # Use value_counts() for faster counting
                location_volume = df.groupby('location')[quantity_col].sum()
                mean_volume = location_volume.mean()
                std_volume = location_volume.std()
                bottleneck_locations = location_volume[location_volume > mean_volume + std_volume]
            else:
                bottleneck_locations = pd.Series()
        except Exception as e:
            logger.error(f"Error identifying bottlenecks: {str(e)}")
            bottleneck_locations = pd.Series()

        # Detect anomalies using Isolation Forest - with optimized parameters
        try:
            # Sample data if too large
            sample_size = min(50000, len(df))
            if len(df) > sample_size:
                df_anomaly = df.sample(n=sample_size, random_state=42)
            else:
                df_anomaly = df

            scaler = StandardScaler()
            quantity_scaled = scaler.fit_transform(df_anomaly[[quantity_col]])
            
            # Use optimized parameters for Isolation Forest
            iso_forest = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100,  # Reduced from default
                max_samples='auto',
                n_jobs=-1  # Use all available cores
            )
            anomalies = iso_forest.fit_predict(quantity_scaled)
            anomaly_count = sum(anomalies == -1)
            
            # Scale anomaly count to original dataset size
            if len(df) > sample_size:
                anomaly_count = int(anomaly_count * (len(df) / sample_size))
        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            anomaly_count = 0

        # Generate recommendations
        recommendations = []
        
        # Demand forecasting recommendations
        if not demand_volatility.empty and demand_volatility.max() > demand_volatility.mean() * 2:
            recommendations.append({
                'type': 'demand_forecasting',
                'description': 'High demand volatility detected. Consider implementing more sophisticated demand forecasting methods.',
                'priority': 'high'
            })

        # Inventory management recommendations
        if not bottleneck_locations.empty:
            recommendations.append({
                'type': 'inventory_management',
                'description': f'Potential bottlenecks detected in locations: {", ".join(bottleneck_locations.index)}',
                'priority': 'medium'
            })

        # Supply chain resilience recommendations
        if anomaly_count > len(df) * 0.05:  # If more than 5% are anomalies
            recommendations.append({
                'type': 'resilience',
                'description': 'Significant anomalies detected. Review supply chain processes for potential improvements.',
                'priority': 'high'
            })

        # If no specific recommendations were generated, add a general one
        if not recommendations:
            recommendations.append({
                'type': 'general',
                'description': 'No significant issues detected. Continue monitoring supply chain metrics.',
                'priority': 'low'
            })

        return {
            'metrics': metrics,
            'demand_analysis': {
                'volatility': demand_volatility.to_dict() if not demand_volatility.empty else {},
                'bottlenecks': bottleneck_locations.to_dict() if not bottleneck_locations.empty else {}
            },
            'anomalies': {
                'count': int(anomaly_count),
                'percentage': float(anomaly_count / len(df) * 100) if len(df) > 0 else 0
            },
            'recommendations': recommendations
        }

    except Exception as e:
        logger.error(f"Error in supply chain analysis: {str(e)}")
        return {
            'error': f'Error analyzing data: {str(e)}'
        }

@app.route('/api/analyze-supply-chain', methods=['POST'])
def analyze_supply_chain():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save the file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        saved_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
        file.save(filepath)

        # Read the file
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath)
            elif filename.endswith('.json'):
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
                
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(filepath)
            else:
                return jsonify({'error': 'Unsupported file type'}), 400
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return jsonify({'error': f'Invalid JSON format: {str(e)}'}), 400
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return jsonify({'error': f'Error reading file: {str(e)}'}), 400

        # Analyze the data
        try:
            analysis_results = analyze_supply_chain_data(df)
            return jsonify(analysis_results)
        except Exception as e:
            logger.error(f"Error analyzing data: {str(e)}")
            return jsonify({'error': f'Error analyzing data: {str(e)}'}), 500

    except Exception as e:
        logger.error(f"Error in supply chain analysis endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add this new endpoint for real-time monitoring
@app.route('/api/monitor-supply-chain', methods=['POST'])
def monitor_supply_chain():
    try:
        data = request.get_json()
        if not data or 'metrics' not in data:
            return jsonify({'error': 'No metrics provided'}), 400

        # Process real-time metrics
        metrics = data['metrics']
        
        # Calculate key performance indicators
        kpis = {
            'inventory_turnover': calculate_inventory_turnover(metrics),
            'order_fulfillment_rate': calculate_order_fulfillment_rate(metrics),
            'supply_chain_velocity': calculate_supply_chain_velocity(metrics)
        }

        # Generate real-time recommendations
        recommendations = generate_realtime_recommendations(kpis)

        return jsonify({
            'kpis': kpis,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in real-time monitoring: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_inventory_turnover(metrics):
    """Calculate inventory turnover ratio"""
    try:
        cost_of_goods = metrics.get('cost_of_goods', 0)
        average_inventory = metrics.get('average_inventory', 1)
        return cost_of_goods / average_inventory if average_inventory != 0 else 0
    except Exception as e:
        logger.error(f"Error calculating inventory turnover: {str(e)}")
        return 0

def calculate_order_fulfillment_rate(metrics):
    """Calculate order fulfillment rate"""
    try:
        fulfilled_orders = metrics.get('fulfilled_orders', 0)
        total_orders = metrics.get('total_orders', 1)
        return (fulfilled_orders / total_orders) * 100 if total_orders != 0 else 0
    except Exception as e:
        logger.error(f"Error calculating order fulfillment rate: {str(e)}")
        return 0

def calculate_supply_chain_velocity(metrics):
    """Calculate supply chain velocity"""
    try:
        total_lead_time = metrics.get('total_lead_time', 0)
        total_orders = metrics.get('total_orders', 1)
        return total_lead_time / total_orders if total_orders != 0 else 0
    except Exception as e:
        logger.error(f"Error calculating supply chain velocity: {str(e)}")
        return 0

def generate_realtime_recommendations(kpis):
    """Generate real-time recommendations based on KPIs"""
    recommendations = []
    
    # Inventory turnover recommendations
    if kpis['inventory_turnover'] < 4:  # Assuming 4 is a good threshold
        recommendations.append({
            'type': 'inventory',
            'description': 'Low inventory turnover detected. Consider reducing inventory levels or increasing sales.',
            'priority': 'medium'
        })

    # Order fulfillment recommendations
    if kpis['order_fulfillment_rate'] < 95:  # Assuming 95% is a good threshold
        recommendations.append({
            'type': 'fulfillment',
            'description': 'Order fulfillment rate below target. Review order processing and fulfillment processes.',
            'priority': 'high'
        })

    # Supply chain velocity recommendations
    if kpis['supply_chain_velocity'] > 7:  # Assuming 7 days is a good threshold
        recommendations.append({
            'type': 'velocity',
            'description': 'High supply chain lead time detected. Review and optimize supply chain processes.',
            'priority': 'high'
        })

    return recommendations

# Initialize the model when the server starts
initialize_model()

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Allow external connections 
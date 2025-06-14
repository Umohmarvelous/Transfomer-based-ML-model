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
from datetime import datetime

app = Flask(__name__)
# Configure CORS to allow requests from any localhost port
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"]}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the model and tokenizer
MODEL_NAME = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'json', 'xls', 'xlsx'}

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
    # Tokenize and get model outputs
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Get the [CLS] token embeddings
    embeddings = outputs.last_hidden_state[:, 0, :].numpy()
    return embeddings.tolist()

def process_data(df, preprocessing_steps):
    """Process the data according to selected preprocessing steps"""
    try:
        if preprocessing_steps.get('cleanMissing'):
            # Handle missing values
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            categorical_cols = df.select_dtypes(include=['object']).columns
            
            # Fill numeric columns with mean
            for col in numeric_cols:
                df[col] = df[col].fillna(df[col].mean())
            
            # Fill categorical columns with mode
            for col in categorical_cols:
                df[col] = df[col].fillna(df[col].mode().iloc[0] if not df[col].mode().empty else "Unknown")

        if preprocessing_steps.get('normalize'):
            # Normalize numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            for col in numeric_cols:
                if df[col].std() != 0:  # Avoid division by zero
                    df[col] = (df[col] - df[col].mean()) / df[col].std()

        if preprocessing_steps.get('removeDuplicates'):
            # Remove duplicate rows
            df = df.drop_duplicates()

        return df
    except Exception as e:
        logger.error(f"Error in data processing: {str(e)}")
        raise

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
                df = pd.read_json(filepath)
            elif data_type in ['xls', 'xlsx']:
                df = pd.read_excel(filepath)
            else:
                return jsonify({'error': 'Unsupported file type'}), 400
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return jsonify({'error': f'Error reading file: {str(e)}'}), 400

        # Process the data
        try:
            processed_df = process_data(df, preprocessing_steps)
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            return jsonify({'error': f'Error processing data: {str(e)}'}), 500

        # Save processed data
        processed_filename = f"processed_{saved_filename}"
        processed_filepath = os.path.join(app.config['UPLOAD_FOLDER'], processed_filename)
        
        try:
            if data_type == 'csv':
                processed_df.to_csv(processed_filepath, index=False)
            elif data_type == 'json':
                processed_df.to_json(processed_filepath, orient='records')
            elif data_type in ['xls', 'xlsx']:
                processed_df.to_excel(processed_filepath, index=False)
        except Exception as e:
            logger.error(f"Error saving processed file: {str(e)}")
            return jsonify({'error': f'Error saving processed file: {str(e)}'}), 500

        # Return summary statistics
        summary = {
            'original_rows': len(df),
            'processed_rows': len(processed_df),
            'columns': list(processed_df.columns),
            'numeric_columns': list(processed_df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': list(processed_df.select_dtypes(include=['object']).columns),
            'missing_values': processed_df.isnull().sum().to_dict(),
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

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Allow external connections 
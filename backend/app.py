from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

app = Flask(__name__)
# Configure CORS to allow requests from any localhost port
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"]}})

# Initialize the model and tokenizer
MODEL_NAME = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

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
        print(f"Error processing request: {str(e)}")  # Add logging
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
        print(f"Error updating process model: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Allow external connections 
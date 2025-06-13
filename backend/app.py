from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

app = Flask(__name__)
# Configure CORS to allow requests from the frontend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# Initialize the model and tokenizer
MODEL_NAME = "bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

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

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')  # Allow external connections 
# Text Analysis with BERT

This project is a full-stack application that uses BERT (Bidirectional Encoder Representations from Transformers) to analyze text and generate embeddings. It consists of a Flask backend and a React frontend.


 ![Image Alt](https://github.com/Umohmarvelous/Transfomer-based-ML-model/blob/56799c0b00bc052635b3f577cab7551419388578/tranformer-ML-model.png)

## Features

- Text analysis using BERT model
- Generation of text embeddings
- Statistical analysis of embeddings
- Modern web interface

## Project Structure

```
.
├── backend/           # Flask backend
│   └── app.py        # Main backend application
├── frontend/         # React frontend
│   ├── public/       # Static files
│   └── src/          # React source code
└── requirements.txt  # Python dependencies
```

## Setup and Installation

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```bash
   cd backend
   python app.py
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will run on http://localhost:3000

## API Endpoints

- `POST /api/analyze`: Analyzes text and returns embeddings
  - Request body: `{ "text": "your text here" }`
  - Response: `{ "embeddings": [...], "statistics": { "mean": [...], "std": [...] } }`

## Technologies Used

- Backend:
  - Flask
  - Transformers (BERT)
  - PyTorch
  - NumPy

- Frontend:
  - React
  - Node.js
  - npm

## License

MIT 

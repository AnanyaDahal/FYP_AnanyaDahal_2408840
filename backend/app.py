from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import pandas as pd

app = Flask(__name__)
CORS(app)  # <-- This allows your React frontend to call the API

# Load your model, scaler, and features
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "cleaned", "rf_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml", "cleaned", "scaler.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "ml", "cleaned", "features.pkl")


clf = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
features = joblib.load(FEATURES_PATH)

# Dummy feature extraction function (replace with your working one)
def extract_features(url):
    # This must match your detection_engine.py logic
    return pd.DataFrame([{f: 0 for f in features}])

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    url = data.get("url", "")
    if url == "":
        return jsonify({"error": "No URL provided"}), 400
    
    # Extract features & predict
    df_features = extract_features(url)
    X_scaled = scaler.transform(df_features)
    prob = clf.predict_proba(X_scaled)[0][1]
    prediction = "Phishing/Malicious" if prob >= 0.7 else "Legitimate"

    return jsonify({"url": url, "prediction": prediction, "probability": round(prob, 4)})

@app.route("/", methods=["GET"])
def home():
    return "<h2>Phishing Detection API is running. Use /predict endpoint to classify URLs.</h2>"

if __name__ == "__main__":
    app.run(debug=True)

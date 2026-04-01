import sys
import json
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "email_model")  # folder where those files are

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)

def predict_email(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    probs = torch.nn.functional.softmax(outputs.logits, dim=1)
    phishing_prob = probs[0][1].item()

    label = "Safe"
    if phishing_prob >= 0.7:
        label = "Phishing"
    elif phishing_prob >= 0.4:
        label = "Suspicious"

    return label, phishing_prob

if __name__ == "__main__":
    # Accept email text either via argv[1] or via stdin (safer for large/complex input)
    if len(sys.argv) > 1:
        email_text = sys.argv[1]
    else:
        email_text = sys.stdin.read()

    email_text = email_text.strip()

    label, prob = predict_email(email_text)

    print(json.dumps({
        "status": label,
        "riskScore": round(prob * 100, 2)
    }))
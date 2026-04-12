import sys
import json
import os
import re
import warnings
import logging

# --- SUPPRESS WARNINGS (Critical for JSON communication) ---
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
warnings.filterwarnings("ignore")
logging.getLogger("transformers").setLevel(logging.ERROR)

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from URL_Detection_engine import classify_url

def print_log(data):
    """Helper to ensure clean JSON output"""
    print(json.dumps(data), flush=True)

def print_progress(message):
    print_log({"type": "progress", "message": message})

# --- PATH SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "email_model")

# --- LOAD MODEL ---
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR, local_files_only=True)
    model.eval()
except Exception as e:
    print_log({"type": "error", "message": f"Model load failed: {str(e)}"})
    sys.exit(1)

SUSPICIOUS_KEYWORDS = ["urgent", "verify", "click here", "password", "bank", "login", "account", "suspended"]

def extract_urls(text):
    return re.findall(r'(https?://\S+|www\.\S+)', text)

def rule_based_analysis(email_text):
    score = 0.0
    reasons = []
    text_lower = email_text.lower()
    found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in text_lower]
    if found_keywords:
        score += min(len(found_keywords) * 1.5, 4.0)
        reasons.append(f"Suspicious keywords: {', '.join(found_keywords)}")
    return score, reasons

def ml_analysis(email_text):
    try:
        inputs = tokenizer(email_text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        return probs[0][1].item()
    except:
        return 0.5

def classify_email(email_text):
    reasons = []
    total_score = 0.0

    print_progress("Running Rule-based Analysis...")
    rule_score, rule_reasons = rule_based_analysis(email_text)
    total_score += min(rule_score / 5.0, 1.0) * 0.3
    reasons.extend(rule_reasons)

    print_progress("Running ML Analysis...")
    ml_prob = ml_analysis(email_text)
    total_score += ml_prob * 0.4
    if ml_prob > 0.7: reasons.append(f"High ML phishing score: {ml_prob:.2f}")

    urls = extract_urls(email_text)
    url_details = []
    phishing_links = 0

    if urls:
        print_progress(f"Checking {len(urls)} URLs...")
        for url in urls:
            try:
                label, score, url_reasons = classify_url(url)
                if label == "Malicious": phishing_links += 1
                url_details.append({
                    "url": url,
                    "status": label,
                    "riskScore": round(score * 100, 2),
                    "reasons": url_reasons
                })
            except:
                continue

    if phishing_links > 0:
        total_score += 0.3
        reasons.append(f"{phishing_links} malicious links detected")

    final_label = "Safe"
    if total_score >= 0.7: final_label = "Phishing"
    elif total_score >= 0.4: final_label = "Suspicious"

    return {
        "status": final_label,
        "riskScore": round(total_score * 100, 2),
        "linkAnalysis": url_details,
        "reasons": reasons
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read().strip()
        if not input_data:
            print_log({"type": "error", "message": "Empty input"})
            sys.exit(1)
            
        result = classify_email(input_data)
        print_log({"type": "done", "payload": result})
    except Exception as e:
        print_log({"type": "error", "message": str(e)})
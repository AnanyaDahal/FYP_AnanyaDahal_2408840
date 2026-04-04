import sys
import json
import os
import re
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Import your URL Engine
from URL_Detection_engine import classify_url

# --- LIVE PROGRESS HELPER ---
def print_progress(message):
    # flush=True is CRITICAL to send data instantly to Node.js
    print(json.dumps({"type": "progress", "message": message}), flush=True)

# --- PATH SETUP ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "email_model")

# --- LOAD MODEL ---
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_DIR,
        local_files_only=True
    )
    model.eval()
except Exception as e:
    print(json.dumps({
        "type": "error",
        "message": f"Model load failed: {str(e)}"
    }), flush=True)
    sys.exit(1)

# --- CONFIG ---
SUSPICIOUS_KEYWORDS = [
    "urgent", "verify", "click here", "password",
    "bank", "login", "account", "suspended",
    "security alert", "update now"
]

# --- URL EXTRACTION ---
def extract_urls(text):
    return re.findall(r'(https?://\S+|www\.\S+)', text)

# --- RULE-BASED ---
def rule_based_analysis(email_text):
    score = 0.0
    reasons = []
    text_lower = email_text.lower()

    found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in text_lower]
    if found_keywords:
        score += min(len(found_keywords) * 1.5, 4.0)
        reasons.append(f"Suspicious keywords: {', '.join(found_keywords)}")

    if email_text.isupper():
        score += 1.5
        reasons.append("Email is fully capitalized")

    if len(email_text) < 30:
        score += 1.0
        reasons.append("Very short email")

    return score, reasons

# --- ML ---
def ml_analysis(email_text):
    try:
        inputs = tokenizer(
            email_text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128
        )
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)
        return probs[0][1].item()
    except:
        return 0.5

# --- MAIN ENGINE ---
def classify_email(email_text):
    reasons = []
    total_score = 0.0

    print_progress("Running Rule-based Analysis...")
    rule_score, rule_reasons = rule_based_analysis(email_text)
    total_score += min(rule_score / 5.0, 1.0) * 0.3
    reasons.extend(rule_reasons)

    print_progress("Running Machine Learning Sequence Classification...")
    ml_prob = ml_analysis(email_text)
    total_score += ml_prob * 0.4

    if ml_prob > 0.8:
        reasons.append(f"High phishing probability detected ({ml_prob:.2f})")
    elif ml_prob > 0.6:
        reasons.append(f"Moderate phishing indicators ({ml_prob:.2f})")
    elif ml_prob > 0.4:
        reasons.append(f"Slight suspicious pattern ({ml_prob:.2f})")

    urls = extract_urls(email_text)
    phishing_links = 0
    url_details = []

    if len(urls) > 0:
        print_progress(f"Extracting and verifying {len(urls)} embedded URLs...")

    for url in urls:
        try:
            label, score, url_reasons = classify_url(url)
            if label == "Malicious":
                phishing_links += 1

            url_details.append({
                "url": url,
                "status": label,
                "riskScore": round(score * 100, 2),
                "reasons": url_reasons
            })
        except Exception as e:
            url_details.append({
                "url": url, "status": "Error", "riskScore": 0, "reasons": [str(e)]
            })

    if phishing_links > 0:
        total_score += min(phishing_links * 0.3, 0.6)
        reasons.append(f"{phishing_links} malicious link(s) detected")

    print_progress("Finalizing risk score and verdicts...")
    if total_score >= 0.70:
        final_label = "Phishing"
    elif total_score >= 0.40:
        final_label = "Suspicious"
    else:
        final_label = "Safe"

    return {
        "status": final_label,
        "riskScore": round(total_score * 100, 2),
        "totalLinks": len(urls),
        "linkAnalysis": url_details,
        "reasons": reasons,
        "mlProbability": round(ml_prob * 100, 2)
    }

# --- CLI ENTRY POINT ---
if __name__ == "__main__":
    try:
        # 1. Read input passed from Node.js
        email_text = sys.stdin.read().strip()

        if not email_text:
            print(json.dumps({"type": "error", "message": "No email input provided"}), flush=True)
            sys.exit(1)

        print_progress("Warming up detection engine...")
        
        # 2. Run analysis
        result = classify_email(email_text)
        
        # 3. Send final payload back to Node.js
        print(json.dumps({
            "type": "done",
            "payload": result
        }), flush=True)

    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}), flush=True)
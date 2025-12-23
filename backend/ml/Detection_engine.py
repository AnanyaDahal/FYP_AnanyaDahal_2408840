import os
import re
import math
import pandas as pd
import numpy as np
import joblib
import tldextract
import requests
import difflib
from urllib.parse import urlparse
from dotenv import load_dotenv

# -----------------------------
# 1. SETUP & CONFIGURATION
# -----------------------------
load_dotenv()
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")

# Paths (Ensure these files exist in your Datasets_for_fyp folder)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Datasets_for_fyp")
RF_MODEL_PATH = os.path.join(DATASET_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(DATASET_DIR, "scaler.pkl")
FEATURES_LIST_PATH = os.path.join(DATASET_DIR, "features.pkl")

# Load Models
try:
    clf_rf = joblib.load(RF_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    trained_features = joblib.load(FEATURES_LIST_PATH)
    print("ML Components Loaded Successfully.")
except Exception as e:
    print(f"Error loading models: {e}")
    exit()

# Reference Lists
WHITELIST = ["google.com", "microsoft.com", "apple.com", "amazon.com", "paypal.com", "facebook.com"]
SUSPICIOUS_KEYWORDS = ["secure", "account", "update", "login", "verify", "banking", "free", "lucky"]

# -----------------------------
# 2. FEATURE ENGINEERING HELPERS
# -----------------------------
def calculate_entropy(text):
    if not text: return 0
    probs = [float(text.count(c)) / len(text) for c in set(text)]
    return -sum(p * math.log(p, 2) for p in probs)

def extract_ip(url):
    try:
        hostname = urlparse(url).hostname
        import socket
        return socket.gethostbyname(hostname)
    except:
        return None

# -----------------------------
# 3. ANALYSIS ENGINES
# -----------------------------

def get_rule_score(url):
    """Refined rule-based scoring to reduce false positives on large URLs."""
    score = 0
    parsed = urlparse(url)
    ext = tldextract.extract(url)
    url_len = len(url)
    
    # Use ratios instead of counts
    if url_len > 0:
        if (url.count('.') / url_len) > 0.05: score += 1
        if (url.count('-') / url_len) > 0.05: score += 1

    # Suspicious keywords specifically in the path or subdomain
    path_query = (parsed.path + parsed.query).lower()
    score += sum(1.5 for kw in SUSPICIOUS_KEYWORDS if kw in path_query)
    
    # Brand impersonation in subdomain
    for brand in WHITELIST:
        brand_name = brand.split('.')[0]
        if brand_name in ext.subdomain and brand_name not in ext.domain:
            score += 3  # High suspicious flag
            
    return score

def check_threat_intel(url):
    """Integrated API checks."""
    is_malicious = False
    
    # VirusTotal
    try:
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        resp = requests.post("https://www.virustotal.com/api/v3/urls", headers=headers, data={"url": url}, timeout=5)
        if resp.status_code == 200:
            stats = resp.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            if stats.get("malicious", 0) > 0: is_malicious = True
    except: pass

    # AbuseIPDB
    ip = extract_ip(url)
    if ip and not is_malicious:
        try:
            headers = {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"}
            resp = requests.get(f"https://api.abuseipdb.com/api/v2/check?ipAddress={ip}", headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json().get("data", {}).get("abuseConfidenceScore", 0) > 50:
                is_malicious = True
        except: pass
            
    return is_malicious

def extract_ml_features(url):
    """Matches the exact feature set your Random Forest expects."""
    ext = tldextract.extract(url)
    data = {
        "url_length": len(url),
        "count_dots": url.count('.'),
        "count_hyphens": url.count('-'),
        "count_slash": url.count('/'),
        "digit_count": sum(c.isdigit() for c in url),
        "domain_length": len(ext.domain),
        "subdomain_length": len(ext.subdomain),
        "entropy": calculate_entropy(ext.domain),
        "has_ip": 1 if re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", url) else 0
    }
    # Ensure DataFrame columns match the 'trained_features' list exactly
    df = pd.DataFrame([data])
    # Reindex to handle missing or extra columns based on your specific pkl file
    df = df.reindex(columns=trained_features, fill_value=0)
    return df

# -----------------------------
# 4. MAIN CLASSIFIER
# -----------------------------
def classify_url(url):
    # Step 1: Whitelist Check
    ext = tldextract.extract(url)
    root_domain = f"{ext.domain}.{ext.suffix}"
    if root_domain in WHITELIST:
        return "Safe", 0.0

    # Step 2: Threat Intel (Highest Authority)
    if check_threat_intel(url):
        return "Malicious", 1.0

    # Step 3: ML Prediction
    df_features = extract_ml_features(url)
    X_scaled = scaler.transform(df_features)
    ml_prob = clf_rf.predict_proba(X_scaled)[0][1]

    # Step 4: Rule Score
    rule_score = get_rule_score(url)
    rule_weight = min(rule_score / 10, 1.0) # Normalize to 0-1

    # Step 5: Weighted Final Score
    # ML is 70% of the decision, Rules are 30%
    final_score = (ml_prob * 0.7) + (rule_weight * 0.3)

    if final_score >= 0.75:
        return "Malicious", final_score
    elif final_score >= 0.4:
        return "Suspicious", final_score
    else:
        return "Safe", final_score

# -----------------------------
# 5. EXECUTION
# -----------------------------
if __name__ == "__main__":
    test_url = input("Enter URL: ")
    label, score = classify_url(test_url)
    print(f"\nResult: {label} (Score: {score:.2f})")
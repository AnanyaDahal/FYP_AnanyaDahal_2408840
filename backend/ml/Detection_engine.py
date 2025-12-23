import os
import re
import math
import time
import pandas as pd
import joblib
import tldextract
import requests
import difflib
import logging
import hashlib
from urllib.parse import urlparse
from dotenv import load_dotenv

# --- 1. SETUP ---
load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")

# Resource Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Datasets_for_fyp")
RF_MODEL_PATH = os.path.join(DATASET_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(DATASET_DIR, "scaler.pkl")
FEATURES_LIST_PATH = os.path.join(DATASET_DIR, "features.pkl")

# Load ML components
try:
    clf_rf = joblib.load(RF_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    trained_features = joblib.load(FEATURES_LIST_PATH)
    print(" Advanced Risk Engine Online.")
except Exception as e:
    print(f"Error loading models: {e}")
    exit()

# --- 2. ENHANCED DEFINITIONS ---
WHITELIST = [
    "google.com", "microsoft.com", "apple.com", "amazon.com", "paypal.com", 
    "facebook.com", "virustotal.com", "github.com", "binance.com", "openai.com", 
    "chatgpt.com", "netflix.com"
]

HIGH_RISK_TLDS = ['cam', 'top', 'xyz', 'icu', 'live', 'bid', 'win', 'work', 'click']
COMMON_TLDS = ["com", "org", "net", "edu", "gov", "io", "co"]
PHISH_KEYWORDS = ["urgent", "apikey", "verify", "secure", "login", "update", "banking"]

# --- 3. THE SMART RISK ACCUMULATOR ---

def get_detailed_risk(url):
    """
    Calculates risk score AND returns a list of reasons for the alert.
    """
    ext = tldextract.extract(url)
    parsed = urlparse(url)
    score = 0.0
    reasons = []
    
    # A. TLD Analysis
    if ext.suffix in HIGH_RISK_TLDS:
        score += 4.5
        reasons.append(f"High-Risk TLD (.{ext.suffix})")
    elif ext.suffix not in COMMON_TLDS:
        score += 2.0
        reasons.append(f"Uncommon TLD (.{ext.suffix})")
        
    # B. Brand Spoofing (Deep Check)
    normalized = ext.domain.replace('1', 'i').replace('0', 'o').replace('5', 's')
    for brand in WHITELIST:
        brand_name = brand.split('.')[0]
        # Catches 'login-google.com' or 'google-support.top'
        if brand_name in ext.domain or brand_name in normalized:
            if f"{ext.domain}.{ext.suffix}" != brand:
                score += 4.0
                reasons.append(f"Impersonation of protected brand: {brand_name}")
                break
    
    # C. Obfuscation Patterns
    path_query = (parsed.path + parsed.query).lower()
    keyword_hits = [kw for kw in PHISH_KEYWORDS if kw in path_query]
    if keyword_hits:
        score += (len(keyword_hits) * 1.5)
        reasons.append(f"Phishing keywords found: {', '.join(keyword_hits)}")
    
    if url.count('@') > 0: # The @ symbol can hide the real domain
        score += 3.0
        reasons.append("URL contains '@' symbol (Credential stealing pattern)")
        
    if len(re.findall(r"\d", ext.domain)) > 3:
        score += 1.5
        reasons.append("Excessive digits in domain (DGA pattern)")

    return score, reasons

# --- 4. MAIN CLASSIFIER ---

def classify_url(url):
    url = url.strip().lower()
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url

    ext = tldextract.extract(url)
    root_domain = f"{ext.domain}.{ext.suffix}"

    # 1. Whitelist (Fast Exit)
    if root_domain in WHITELIST:
        return "Safe", 0.01, ["Verified Trusted Domain"]

    # 2. Risk Heuristics
    accumulated_risk, risk_reasons = get_detailed_risk(url)
    
    # 3. ML Prediction
    try:
        data = {
            "url_length": len(url), "count_dots": url.count('.'),
            "count_hyphens": url.count('-'), "count_slash": url.count('/'),
            "digit_count": sum(c.isdigit() for c in url),
            "domain_length": len(ext.domain), "subdomain_length": len(ext.subdomain),
            "entropy": accumulated_risk, # Feed heuristics into ML features
            "has_ip": 1 if re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", url) else 0
        }
        df_feats = pd.DataFrame([data]).reindex(columns=trained_features, fill_value=0)
        X_scaled = scaler.transform(df_feats)
        ml_prob = clf_rf.predict_proba(X_scaled)[0][1]
    except:
        ml_prob = 0.5

    # 4. Final Balanced Score
    heuristic_weight = min(accumulated_risk / 7.0, 1.0)
    final_score = (ml_prob * 0.3) + (heuristic_weight * 0.7)

    label = "Safe"
    if final_score >= 0.75: label = "Malicious"
    elif final_score >= 0.45: label = "Suspicious"
    
    return label, final_score, risk_reasons

# --- 5. INTERFACE ---
if __name__ == "__main__":
    print("\n" + "="*60)
    print("PHISHING DETECTION SYSTEM")
    print("="*60)
    
    while True:
        user_input = input("\nEnter URL (or 'exit'): ").strip()
        if user_input.lower() == 'exit': break
        if not user_input: continue

        label, score, reasons = classify_url(user_input)
        
        print(f"\nResult: [{label.upper()}] | Final Risk Score: {score:.4f}")
        if reasons:
            print("Detected Risk Factors:")
            for r in reasons:
                print(f"  - {r}")
        print("-" * 60)
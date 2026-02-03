import os
import re
import sys
import json
import joblib
import tldextract
import pandas as pd
from urllib.parse import urlparse
from dotenv import load_dotenv

# --- 1. SETUP & PATHS ---
load_dotenv()

# Use absolute paths to prevent "File Not Found" errors when called from Node.js
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Datasets_for_fyp")
RF_MODEL_PATH = os.path.join(DATASET_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(DATASET_DIR, "scaler.pkl")
FEATURES_LIST_PATH = os.path.join(DATASET_DIR, "features.pkl")

# --- 2. LOAD ML COMPONENTS ---
try:
    clf_rf = joblib.load(RF_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    trained_features = joblib.load(FEATURES_LIST_PATH)
except Exception as e:
    # Print as JSON so Node.js doesn't crash on parsing
    print(json.dumps({"status": "Error", "message": f"Model Load Failure: {str(e)}"}))
    sys.exit(1)

# Configuration
WHITELIST = ["google.com", "microsoft.com", "paypal.com", "apple.com", "github.com", "amazon.com", "facebook.com"]
HIGH_RISK_TLDS = ['cam', 'top', 'xyz', 'icu', 'live', 'bid', 'win', 'work', 'click']
PHISH_KEYWORDS = ["urgent", "verify", "secure", "login", "update", "banking", "account", "signin"]

# --- 3. DETECTION LOGIC ---
def get_detailed_risk(url):
    ext = tldextract.extract(url)
    parsed = urlparse(url)
    score = 0.0
    reasons = []
    
    # TLD Check
    if ext.suffix in HIGH_RISK_TLDS:
        score += 4.5
        reasons.append(f"High-Risk TLD (.{ext.suffix})")
    
    # Brand Spoofing Check
    normalized = ext.domain.replace('1', 'i').replace('0', 'o').replace('5', 's').replace('v', 'u')
    for brand in WHITELIST:
        brand_name = brand.split('.')[0]
        if brand_name in ext.domain or brand_name in normalized:
            if f"{ext.domain}.{ext.suffix}" != brand:
                score += 4.0
                reasons.append(f"Impersonation of brand: {brand_name}")
                break

    # Keyword Check
    path_query = (parsed.path + parsed.query).lower()
    found_keywords = [kw for kw in PHISH_KEYWORDS if kw in path_query]
    if found_keywords:
        score += 2.5
        reasons.append(f"Phishing keywords found: {', '.join(found_keywords)}")

    return score, reasons

def classify_url(url):
    url = url.strip().lower()
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url

    ext = tldextract.extract(url)
    root_domain = f"{ext.domain}.{ext.suffix}"

    # Fast Exit: Whitelist
    if root_domain in WHITELIST:
        return "Safe", 0.0, ["Verified Trusted Domain"]

    accumulated_risk, risk_reasons = get_detailed_risk(url)
    
    # ML Prediction
    try:
        data = {
            "url_length": len(url), 
            "count_dots": url.count('.'),
            "count_hyphens": url.count('-'), 
            "count_slash": url.count('/'),
            "digit_count": sum(c.isdigit() for c in url),
            "domain_length": len(ext.domain), 
            "subdomain_length": len(ext.subdomain),
            "entropy": accumulated_risk,
            "has_ip": 1 if re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", url) else 0
        }
        df_feats = pd.DataFrame([data]).reindex(columns=trained_features, fill_value=0)
        X_scaled = scaler.transform(df_feats)
        ml_prob = clf_rf.predict_proba(X_scaled)[0][1]
    except:
        ml_prob = 0.5

    # Combine Heuristics (70%) and ML (30%)
    heuristic_weight = min(accumulated_risk / 7.5, 1.0)
    final_score = (ml_prob * 0.3) + (heuristic_weight * 0.7)

    label = "Safe"
    if final_score >= 0.70: label = "Malicious"
    elif final_score >= 0.40: label = "Suspicious"
    
    return label, final_score, risk_reasons

# --- 4. EXECUTION ---
if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
        try:
            status, score, reasons = classify_url(target_url)
            # Output ONLY valid JSON
            print(json.dumps({
                "status": status,
                "riskScore": round(float(score) * 100, 2),
                "reasons": reasons
            }))
        except Exception as e:
            print(json.dumps({"status": "Error", "message": str(e)}))
    else:
        print(json.dumps({"status": "Error", "message": "No input URL provided"}))
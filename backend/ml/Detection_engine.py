import os
import re
import pandas as pd
import numpy as np
import joblib
import tldextract
import difflib
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv

# -----------------------------
# Load environment variables
# -----------------------------
load_dotenv()  # Loads .env file in same directory

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")

if not VIRUSTOTAL_API_KEY or not ABUSEIPDB_API_KEY:
    raise RuntimeError("API keys not found. Please set them in the .env file.")

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Datasets_for_fyp")

RF_MODEL_PATH = os.path.join(DATASET_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(DATASET_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(DATASET_DIR, "features.pkl")

# -----------------------------
# Load ML model, scaler, features
# -----------------------------
clf_rf = joblib.load(RF_MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
features = joblib.load(FEATURES_PATH)
print("Random Forest model, scaler, and feature list loaded.\n")

# -----------------------------
# Whitelist and popular domains
# -----------------------------
WHITELIST = [
    "google.com", "gmail.com", "microsoft.com", "facebook.com",
    "twitter.com", "linkedin.com", "apple.com", "youtube.com",
    "amazon.com", "paypal.com", "instagram.com", "outlook.com"
]
POPULAR_DOMAINS = WHITELIST.copy()

# -----------------------------
# Suspicious keywords
# -----------------------------
SUSPICIOUS_KEYWORDS = ["secure","account","login","update","verify","bank","free","lucky"]

# -----------------------------
# Helper functions
# -----------------------------
def safe_str(s): 
    return str(s) if pd.notnull(s) else ""

def extract_domain(url):
    try:
        return tldextract.extract(safe_str(url)).top_domain_under_public_suffix
    except:
        return ""

def extract_subdomain(url):
    try:
        return tldextract.extract(safe_str(url)).subdomain
    except:
        return ""

def extract_ip(url):
    try:
        hostname = urlparse(url).hostname
        import socket
        return socket.gethostbyname(hostname)
    except:
        return None

# -----------------------------
# Rule-based feature scoring
# -----------------------------
def compute_rule_based_score(url):
    score = 0
    url_lower = safe_str(url).lower()
    
    # URL length
    score += 1 if len(url) > 75 else 0
    
    # Dots, hyphens, slashes
    score += 1 if url.count('.') > 3 else 0
    score += 1 if url.count('-') > 2 else 0
    score += 1 if url.count('/') > 3 else 0
    
    # Suspicious keywords
    score += sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)
    
    # IP address in URL
    if re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", url): score += 2
    
    # Multiple subdomains
    if extract_subdomain(url).count('.') >= 2: score += 1
    
    # Shortened URLs
    for s in ["bit.ly","tinyurl","goo.gl","t.co","ow.ly"]:
        if s in url_lower: score += 1
    
    # Encoded URL
    if '%' in url: score += 1
    
    return score

# -----------------------------
# Typosquatting detection
# -----------------------------
def is_typosquatting(domain):
    for popular in POPULAR_DOMAINS:
        similarity = difflib.SequenceMatcher(None, domain, popular).ratio()
        if similarity > 0.8 and domain != popular:
            return True
    return False

# -----------------------------
# Threat intelligence APIs
# -----------------------------
def check_virustotal(url):
    try:
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        data = {"url": url}
        response = requests.post("https://www.virustotal.com/api/v3/urls", headers=headers, data=data)
        if response.status_code == 200:
            json_data = response.json()
            stats = json_data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            return stats.get("malicious", 0) > 0
    except Exception as e:
        print(f"VirusTotal API error: {e}")
    return False

def check_abuseipdb(url):
    ip = extract_ip(url)
    if not ip: return False
    try:
        headers = {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"}
        params = {"ipAddress": ip}
        response = requests.get("https://api.abuseipdb.com/api/v2/check", headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {}).get("abuseConfidenceScore", 0) > 50
    except Exception as e:
        print(f"AbuseIPDB API error: {e}")
    return False

# -----------------------------
# ML feature extraction
# -----------------------------
def extract_features(url):
    data = {}
    data["url_length"] = len(url)
    data["count_dots"] = url.count('.')
    data["count_hyphens"] = url.count('-')
    data["count_slash"] = url.count('/')
    data["count_at"] = url.count('@')
    data["count_question"] = url.count('?')
    data["count_equal"] = url.count('=')
    data["digit_count"] = sum(c.isdigit() for c in url)
    data["letter_count"] = sum(c.isalpha() for c in url)
    data["special_chars"] = len(re.findall(r"[^A-Za-z0-9]", url))
    data["has_ip"] = 1 if re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", url) else 0
    data["https_flag"] = 1 if url.startswith("https") else 0
    data["encoded_url"] = 1 if "%" in url else 0
    data["domain_length"] = len(extract_domain(url))
    data["subdomain_length"] = len(extract_subdomain(url))
    data["multiple_subdomains"] = 1 if extract_subdomain(url).count('.') >= 2 else 0
    data["suspicious_words"] = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url.lower())
    data["shortening_service"] = 1 if any(s in url.lower() for s in ["bit.ly","tinyurl","goo.gl","t.co","ow.ly"]) else 0
    return pd.DataFrame([data], columns=features)

# -----------------------------
# Main classification
# -----------------------------
def classify_url(url):
    domain = extract_domain(url)
    
    # 1. Whitelist
    if domain in WHITELIST:
        return "Safe", 0.0
    
    # 2. Typosquatting
    if is_typosquatting(domain):
        return "Suspicious", 0.5
    
    # 3. Threat Intelligence
    if check_virustotal(url) or check_abuseipdb(url):
        return "Malicious", 1.0
    
    # 4. Rule-based score
    rule_score = compute_rule_based_score(url)
    
    # 5. ML prediction
    df_features = extract_features(url)
    X_scaled = scaler.transform(df_features)
    ml_prob = clf_rf.predict_proba(X_scaled)[0][1]
    
    # 6. Combine scores
    combined_score = (rule_score * 0.2) + (ml_prob * 0.6)
    combined_score = min(combined_score, 1.0)
    
    # 7. Final classification
    if combined_score >= 0.7:
        classification = "Malicious"
    elif combined_score >= 0.4:
        classification = "Suspicious"
    else:
        classification = "Safe"
    
    return classification, combined_score

# -----------------------------
# Interactive CLI
# -----------------------------
if __name__ == "__main__":
    while True:
        url = input("Enter URL to classify (or type 'exit' to quit): ").strip()
        if url.lower() == "exit":
            break
        cls, score = classify_url(url)
        print("\n==============================")
        print(f"URL: {url}")
        print(f"Threat Score: {score:.4f}")
        print(f"Classification: {cls}\n")

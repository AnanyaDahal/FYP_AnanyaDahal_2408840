import pandas as pd
import numpy as np
import joblib
import tldextract
import re
import os
import difflib
import requests
from urllib.parse import urlparse

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Datasets_for_fyp")

MODEL_PATH = os.path.join(DATASET_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(DATASET_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(DATASET_DIR, "features.pkl")

# -----------------------------
# Load Model, Scaler, Features
# -----------------------------
clf = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
features = joblib.load(FEATURES_PATH)
print("Model, scaler, and features loaded successfully.\n")

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
# API Keys (replace with your keys)
# -----------------------------
VIRUSTOTAL_API_KEY = "8e79b36411bc0de69f9c4f68f33a224e121d0bfeb733e851ea24cc52fd8cbc73"
ABUSEIPDB_API_KEY = "94c81c286a618b02f402b2f7a7eed6aafba4ca96ae835b18cf131aaefe73ee82445b666363b0c9b8"

# -----------------------------
# Helper Functions
# -----------------------------
def safe_str(s): return str(s) if pd.notnull(s) else ""

def extract_domain(url):
    try:
        return tldextract.extract(safe_str(url)).top_domain_under_public_suffix
    except:
        return ""

def extract_ip(url):
    try:
        hostname = urlparse(url).hostname
        import socket
        return socket.gethostbyname(hostname)
    except:
        return None

def is_typosquatting(domain):
    for popular in POPULAR_DOMAINS:
        similarity = difflib.SequenceMatcher(None, domain, popular).ratio()
        if similarity > 0.8 and domain != popular:
            return True
    return False

# -----------------------------
# Threat Intelligence API Checks
# -----------------------------
def check_virustotal(url):
    """Check URL with VirusTotal API"""
    try:
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        params = {"url": url}
        response = requests.post("https://www.virustotal.com/api/v3/urls", headers=headers, data=params)
        if response.status_code == 200:
            json_data = response.json()
            # For simplicity, check if any engine flagged it as malicious
            stats = json_data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            if stats.get("malicious", 0) > 0:
                return True
        return False
    except Exception as e:
        print(f"VirusTotal API error: {e}")
        return False

def check_abuseipdb(url):
    """Check resolved IP with AbuseIPDB"""
    ip = extract_ip(url)
    if not ip:
        return False
    try:
        headers = {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"}
        params = {"ipAddress": ip}
        response = requests.get("https://api.abuseipdb.com/api/v2/check", headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get("data", {}).get("abuseConfidenceScore", 0) > 50:
                return True
        return False
    except Exception as e:
        print(f"AbuseIPDB API error: {e}")
        return False

# -----------------------------
# Random Forest + Typosquatting Features
# -----------------------------
def extract_features(url):
    url_length = len(url)
    count_dots = url.count('.')
    count_hyphens = url.count('-')
    count_slashes = url.count('/')
    count_at = url.count('@')
    count_question = url.count('?')
    count_equal = url.count('=')
    digit_count = sum(c.isdigit() for c in url)
    letter_count = sum(c.isalpha() for c in url)
    special_chars = len(re.findall(r"[^A-Za-z0-9]", url))
    domain_len = len(extract_domain(url))
    subdomain_len = len(tldextract.extract(url).subdomain)
    multiple_subdomains = 1 if tldextract.extract(url).subdomain.count('.') >= 2 else 0
    https_flag = 1 if url.startswith("https") else 0
    encoded_url = 1 if "%" in url else 0
    return pd.DataFrame([{
        "url_length": url_length, "count_dots": count_dots,
        "count_hyphens": count_hyphens, "count_slash": count_slashes,
        "count_at": count_at, "count_question": count_question,
        "count_equal": count_equal, "digit_count": digit_count,
        "letter_count": letter_count, "special_chars": special_chars,
        "domain_length": domain_len, "subdomain_length": subdomain_len,
        "multiple_subdomains": multiple_subdomains, "https_flag": https_flag,
        "encoded_url": encoded_url
    }], columns=features)

# -----------------------------
# Main Classification Function
# -----------------------------
def classify_url(url, threshold_suspicious=0.4, threshold_phishing=0.7):
    domain = extract_domain(url)

    # 1. Whitelist
    if domain in WHITELIST:
        return "Legitimate", 0.0

    # 2. Typosquatting
    if is_typosquatting(domain):
        return "Suspicious", 0.5

    # 3. Threat Intelligence APIs
    if check_virustotal(url) or check_abuseipdb(url):
        return "Phishing/Malicious", 1.0

    # 4. Random Forest Model
    df_features = extract_features(url)
    X_scaled = scaler.transform(df_features)
    prob = clf.predict_proba(X_scaled)[0][1]

    if prob >= threshold_phishing:
        return "Phishing/Malicious", prob
    elif prob >= threshold_suspicious:
        return "Suspicious", prob
    else:
        return "Legitimate", prob

# -----------------------------
# Interactive CLI
# -----------------------------
if __name__ == "__main__":
    while True:
        url = input("Enter URL to classify (or type 'exit' to quit): ").strip()
        if url.lower() == "exit":
            break
        prediction, prob = classify_url(url)
        print("\n==============================")
        print(f"URL: {url}")
        print(f"Prediction: {prediction}")
        print(f"Probability: {prob:.4f}\n")

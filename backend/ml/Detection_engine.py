import pandas as pd
import numpy as np
import joblib
import tldextract
import re
import os

# -----------------------------
# Paths (updated to Datasets_for_fyp)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "Datasets_for_fyp")

MODEL_PATH = os.path.join(DATASET_DIR, "rf_model.pkl")
SCALER_PATH = os.path.join(DATASET_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(DATASET_DIR, "features.pkl")

# -----------------------------
# Load Model, Scaler, Features
# -----------------------------
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"{MODEL_PATH} not found!")
if not os.path.exists(SCALER_PATH):
    raise FileNotFoundError(f"{SCALER_PATH} not found!")
if not os.path.exists(FEATURES_PATH):
    raise FileNotFoundError(f"{FEATURES_PATH} not found!")

clf = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
features = joblib.load(FEATURES_PATH)

print("Model, scaler, and features loaded successfully.\n")

# -----------------------------
# Whitelist of well-known safe domains
# -----------------------------
WHITELIST = [
    "google.com", "gmail.com", "microsoft.com", "facebook.com",
    "twitter.com", "linkedin.com", "apple.com", "youtube.com"
]

# -----------------------------
# Helper Functions
# -----------------------------
def safe_str(s):
    return str(s) if pd.notnull(s) else ""

def url_length(url): return len(safe_str(url))
def count_dots(url): return safe_str(url).count('.')
def count_hyphens(url): return safe_str(url).count('-')
def count_slashes(url): return safe_str(url).count('/')
def count_at(url): return safe_str(url).count('@')
def count_question(url): return safe_str(url).count('?')
def count_equal(url): return safe_str(url).count('=')
def digit_count(url): return sum(c.isdigit() for c in safe_str(url))
def letter_count(url): return sum(c.isalpha() for c in safe_str(url))
def count_special_chars(url): return len(re.findall(r"[^A-Za-z0-9]", safe_str(url)))
def has_ip_address(url):
    ip_pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    return 1 if re.search(ip_pattern, safe_str(url)) else 0
def https_token(url): return 1 if safe_str(url).startswith("https") else 0
def is_encoded(url): return 1 if "%" in safe_str(url) else 0

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

def domain_length(url): return len(extract_domain(url))
def subdomain_length(url): return len(extract_subdomain(url))
def has_multiple_subdomains(url): return 1 if extract_subdomain(url).count('.') >= 2 else 0

def suspicious_words(url):
    keywords = ["secure", "account", "login", "update", "verify", "bank", "free", "lucky"]
    return sum(1 for k in keywords if k in safe_str(url).lower())

def count_params(url): return safe_str(url).count('&')
def has_shortening_service(url):
    services = ["bit.ly", "tinyurl", "goo.gl", "t.co", "ow.ly"]
    return 1 if any(s in safe_str(url).lower() for s in services) else 0
def get_tld(url):
    try: return tldextract.extract(safe_str(url)).suffix
    except: return ""
def tld_length(url): return len(get_tld(url))

# -----------------------------
# Feature Extraction
# -----------------------------
def extract_features(url):
    data = {
        "url_length": url_length(url),
        "count_dots": count_dots(url),
        "count_hyphens": count_hyphens(url),
        "count_slash": count_slashes(url),
        "count_at": count_at(url),
        "count_question": count_question(url),
        "count_equal": count_equal(url),
        "digit_count": digit_count(url),
        "letter_count": letter_count(url),
        "special_chars": count_special_chars(url),
        "has_ip": has_ip_address(url),
        "https_flag": https_token(url),
        "encoded_url": is_encoded(url),
        "domain_length": domain_length(url),
        "subdomain_length": subdomain_length(url),
        "multiple_subdomains": has_multiple_subdomains(url),
        "suspicious_words": suspicious_words(url),
        "count_params": count_params(url),
        "shortening_service": has_shortening_service(url),
        "tld_length": tld_length(url)
    }
    return pd.DataFrame([data], columns=features)

# -----------------------------
# Classification Function
# -----------------------------
def classify_url(url, threshold_suspicious=0.4, threshold_phishing=0.7):
    domain = extract_domain(url)
    
    # Check whitelist first
    if domain in WHITELIST:
        return "Legitimate", 0.0

    df_features = extract_features(url)
    X_scaled = scaler.transform(df_features)
    prob = clf.predict_proba(X_scaled)[0][1]  # probability of phishing

    if prob >= threshold_phishing:
        prediction = "Phishing/Malicious"
    elif prob >= threshold_suspicious:
        prediction = "Suspicious"
    else:
        prediction = "Legitimate"
    
    return prediction, prob

# -----------------------------
# Interactive URL Testing
# -----------------------------
if __name__ == "__main__":
    while True:
        url = input("Enter URL to classify (or type 'exit' to quit): ").strip()
        if url.lower() == "exit":
            print("Exiting detection engine.")
            break
        prediction, prob = classify_url(url)
        print("\n==============================")
        print(f"URL: {url}")
        print(f"Prediction: {prediction}")
        print(f"Probability of phishing: {prob:.4f}\n")

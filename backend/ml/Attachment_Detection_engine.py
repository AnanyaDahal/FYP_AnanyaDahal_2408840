import os
import sys
import json
import re
import hashlib

HIGH_RISK_EXTENSIONS = {
    # Executables & Installers
    '.exe', '.msi', '.scr', '.com', '.bat', '.cmd', '.pif', '.cpl',
    # Scripting languages
    '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.py', '.sh',
    # Compressed Archives (often containing payloads)
    '.zip', '.rar', '.7z', '.tar', '.gz', '.cab', '.iso', '.dmg',
    # Macro-enabled office docs
    '.docm', '.dotm', '.xlsm', '.xltm', '.pptm'
}

PHISH_KEYWORDS = ["invoice", "payment", "bank", "verify", "account", "urgent", "suspended", "password", "login", "update", "confidential"]

# Mock Threat Intelligence Known Malicious SHA-256 Hash database
MOCK_THREAT_INTEL_HASHES = {
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", # empty file
    "44d88e1e70404020a1f0a1c128y60k45x3231s2s8hdtdypao8wcj9tacj925916",
    "cf27db95f2d01957f86236b280h72590USBE3corpmpi3231459ps3z2irs86604"
}

def analyze_file(file_path):
    if not os.path.exists(file_path):
        return {
            "status": "Suspicious",
            "riskScore": 50.0,
            "reasons": ["Scan Target Missing - File could not be localized on server"]
        }

    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    
    score = 0.0
    reasons = []
    
    # 1. Double Extension Check
    # Matches patterns like filename.pdf.exe or filename.txt.js
    base, ext = os.path.splitext(filename.lower())
    if ext and '.' in base:
        score += 8.0
        reasons.append("Double file extension detected (obfuscation tactic)")

    # 2. High-Risk Extension Check
    if ext in HIGH_RISK_EXTENSIONS:
        score += 4.5
        reasons.append(f"High-Risk file extension ({ext}) - commonly associated with malware payloads")
    
    # 3. File Hash & Threat Intelligence Check
    sha256_hash = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        file_hash = sha256_hash.hexdigest()
    except Exception as e:
        file_hash = "unknown"
        reasons.append(f"Hashing failure: {str(e)}")

    if file_hash in MOCK_THREAT_INTEL_HASHES:
        score += 9.5
        reasons.append("Known malicious file signature matches Threat Intelligence Database")
        
    # Heuristics based on size (Malicious droppers are often extremely small, e.g., < 100KB)
    if file_size < 102400 and ext in HIGH_RISK_EXTENSIONS:
        score += 1.5
        reasons.append("File size is exceptionally small (< 100KB) - indicative of malicious downloader scripts")

    # 4. Text and Keyword Analysis (only run on text-like attachments or small logs)
    if ext in {'.txt', '.html', '.htm', '.vbs', '.js', '.ps1', '.bat', '.py'}:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().lower()
                
            found_keywords = [kw for kw in PHISH_KEYWORDS if kw in content]
            if found_keywords:
                score += min(len(found_keywords) * 1.0, 3.5)
                reasons.append(f"Suspicious words found in code/text content: {', '.join(found_keywords)}")
                
            # Check for hidden commands or execution flags
            if "wscript.shell" in content or "powershell -bypass" in content or "cmd.exe /c" in content:
                score += 3.0
                reasons.append("Suspicious scripting/execution shell calls detected")
        except:
            pass # ignore parse issues for binary file types read as text

    # Cap score
    final_score = min(score / 10.0, 1.0)
    
    label = "Safe"
    if final_score >= 0.70:
        label = "Phishing" # standard label expected by UI is Phishing/Suspicious/Safe
    elif final_score >= 0.40:
        label = "Suspicious"
        
    return {
        "status": label,
        "riskScore": round(float(final_score) * 100, 2),
        "reasons": reasons if reasons else ["No suspicious structural, payload, or hash anomalies detected."],
        "fileHash": file_hash,
        "fileSize": file_size
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"type": "error", "message": "Missing file path argument"}), flush=True)
        sys.exit(1)
        
    target_path = sys.argv[1]
    try:
        analysis_result = analyze_file(target_path)
        print(json.dumps({"type": "done", "payload": analysis_result}), flush=True)
    except Exception as e:
        print(json.dumps({"type": "error", "message": f"Python Scan Crash: {str(e)}"}), flush=True)
        sys.exit(1)

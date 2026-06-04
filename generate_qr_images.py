#!/usr/bin/env python3
"""
Generate QR code JPG files for tables 1..N into the `qr/` folder.
Run: python generate_qr_images.py
"""
import os
import requests

QR_DIR = 'qr'
TABLES = 10
BASE_URL = 'https://jynx-nowaiter.onrender.com/'

os.makedirs(QR_DIR, exist_ok=True)

for i in range(1, TABLES + 1):
    url = f"{BASE_URL}?table={i}"
    qr_api = f"https://api.qrserver.com/v1/create-qr-code/?size=512x512&data={requests.utils.requote_uri(url)}"
    out_path = os.path.join(QR_DIR, f"table-{i}.jpg")
    print(f"Fetching QR for table {i}: {url}")
    try:
        r = requests.get(qr_api, timeout=15)
        r.raise_for_status()
        with open(out_path, 'wb') as f:
            f.write(r.content)
        print(f"Saved {out_path}")
    except Exception as e:
        print(f"Failed to fetch QR for table {i}: {e}")

print('Done')

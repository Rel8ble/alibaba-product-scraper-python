"""Scrape Alibaba.com products and suppliers with Python via the Alibaba Product Search Scraper on Apify.

pip install -r requirements.txt
set APIFY_TOKEN in your environment (or paste it below)
python example.py
"""
import csv
import os

from apify_client import ApifyClient

client = ApifyClient(os.environ.get("APIFY_TOKEN", "<YOUR_APIFY_TOKEN>"))

run_input = {
    "searchTerms": ["yoga mat", "custom tote bags"],
    "maxResultsPerSearch": 20,        # you pay per product, keep it small while testing
    "maxMoq": 100,                    # low-MOQ suppliers only; remove for all
    "verifiedSuppliersOnly": True,
    "includeAds": False,
}

run = client.actor("rel8ble/alibaba-product-search-scraper").call(run_input=run_input)
products = list(client.dataset(run["defaultDatasetId"]).iterate_items())
products.sort(key=lambda p: (p.get("priceMin") is None, p.get("priceMin") or 0))
print(f"Got {len(products)} products")

fields = ["searchTerm", "title", "priceMin", "priceMax", "moq", "moqUnit", "soldCount",
          "leadTimeDays", "supplierName", "supplierCountryCode", "supplierYears",
          "supplierRating", "responseRate", "url"]
with open("alibaba_products.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    w.writerows(products)

for p in products[:5]:
    print(f"${p['priceMin']}  MOQ {p['moq']}  {p['supplierName']}  {p['title'][:60]}")
print("Saved alibaba_products.csv")

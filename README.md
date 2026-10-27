# Alibaba Product Scraper in Python: export Alibaba.com products, prices, MOQ and suppliers to JSON/CSV

A short tutorial for pulling **Alibaba.com search results** (price range and quantity tiers, MOQ, units sold, lead time, supplier name, country, years, Verified/Gold status and rating) into Python with the [Alibaba Product Search Scraper](https://apify.com/rel8ble/alibaba-product-search-scraper) on Apify.

> Disclosure: I built this actor; it's a paid tool on Apify ($1.50 per 1,000 products). The code in this repo is MIT-licensed.

## How it works

The actor calls the same JSON endpoint Alibaba's own search page uses, over plain HTTPS through Apify Proxy. No headless browser, no cookies, no Alibaba account. Blocked requests are retried on a fresh session automatically.

## Quick start (Python)

```bash
pip install apify-client
```

```python
from apify_client import ApifyClient

client = ApifyClient("<YOUR_APIFY_TOKEN>")

run = client.actor("rel8ble/alibaba-product-search-scraper").call(run_input={
    "searchTerms": ["yoga mat", "custom tote bags"],
    "maxResultsPerSearch": 20,
    "maxMoq": 100,
    "verifiedSuppliersOnly": True,
})

for p in client.dataset(run["defaultDatasetId"]).iterate_items():
    print(p["priceMin"], p["moq"], p["supplierName"], p["title"][:60])
```

[`example.py`](example.py) is the runnable version: it keeps low-MOQ products from verified suppliers and writes a CSV sorted by price.

## Quick start (Node.js)

```js
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: '<YOUR_APIFY_TOKEN>' });
const run = await client.actor('rel8ble/alibaba-product-search-scraper').call({
    searchTerms: ['led strip lights'], maxResultsPerSearch: 20,
});
const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(items.length, 'products');
```

## Plain HTTP (curl, Google Apps Script, anything)

One call runs the actor and returns the results. Use `format=csv` for a spreadsheet, `format=json` for code:

```bash
curl -X POST "https://api.apify.com/v2/acts/rel8ble~alibaba-product-search-scraper/run-sync-get-dataset-items?format=csv"   -H "Authorization: Bearer <YOUR_APIFY_TOKEN>"   -H "Content-Type: application/json"   -d '{"searchTerms":["yoga mat"],"maxResultsPerSearch":100,"verifiedSuppliersOnly":true,"maxMoq":50}'   -o results.csv
```

The sync endpoint waits up to 5 minutes; for bigger runs use the clients above (they wait as long as needed). [`example.js`](example.js) is a runnable Node.js version that writes `alibaba_products.csv` (`npm install`, then `APIFY_TOKEN=... node example.js`).

## No code: n8n, Make, Zapier, Google Sheets

- **n8n**: import [`n8n/workflow.json`](n8n/workflow.json) (Workflows > Import from file), replace `YOUR_APIFY_TOKEN`, and add a Google Sheets "Append or update row" node after it, matched on `productId` so weekly runs don't create duplicates. It uses n8n's built-in HTTP Request node, so no community node is needed (the official Apify node, `@apify/n8n-nodes-apify`, works too).
- **Make**: Apify app > "Run an Actor" (actor `rel8ble/alibaba-product-search-scraper`, wait for finish on, input JSON as above) > Apify "Get Dataset Items" > Google Sheets "Add a Row" or your CRM module.
- **Zapier**: Apify app > "Run Actor" action (or the "Finished Actor Run" trigger on a scheduled run) > "Fetch Dataset Items" > Google Sheets / HubSpot / Airtable.
- **Google Sheets only**: run it from the [Store page](https://apify.com/rel8ble/alibaba-product-search-scraper) form, download CSV and import. Useful columns: title, priceText, moq, minOrderValue, supplierName, supplierYears, verifiedSupplier, supplierRating, url.
- **AI agents**: the Apify MCP server (https://mcp.apify.com) lets Claude, ChatGPT or Cursor call `rel8ble/alibaba-product-search-scraper` as a tool.

## Input

| Field | Default | What it does |
|---|---|---|
| `searchTerms` | `["led strip lights"]` | Alibaba keywords or search URLs |
| `maxResultsPerSearch` | 100 | Products per keyword; `0` = all Alibaba serves (~960) |
| `minPrice` / `maxPrice` | - | Unit price in whole USD |
| `maxMoq` | - | Maximum minimum order quantity, e.g. `100` |
| `verifiedSuppliersOnly` | `false` | Only suppliers with Alibaba's third-party-inspected "Verified" badge |
| `supplierCountry` | all | 2-letter code: `CN`, `IN`, `VN`, `TR`, `US`... |
| `includeAds` | `true` | Sponsored listings are flagged `isAd: true` |

## Output sample (one real product, trimmed)

```json
{
  "searchTerm": "bluetooth earbuds",
  "title": "ALOVA Latest Model Bluetooth 6.0 Earphone IPX7 Bone Conduction Headset Waterproof Headphone Wireless Earbuds with Mic",
  "url": "https://www.alibaba.com/product-detail/ALOVA-Latest-Model-Bluetooth-6-0_1601511059774.html",
  "priceMin": 6.5,
  "priceMax": 9.9,
  "priceTiers": [
    { "minQuantity": 10, "maxQuantity": 89, "price": 9.9, "unit": "pieces" },
    { "minQuantity": 90, "maxQuantity": 1999, "price": 8.5, "unit": "pieces" }
  ],
  "moq": 10,
  "moqUnit": "pieces",
  "soldCount": 2126,
  "leadTimeDays": 14,
  "productCertifications": ["FCC", "UKCA", "CE", "ROHS"],
  "isAd": false,
  "supplierName": "Shenzhen Alex Technology Co., Ltd.",
  "supplierCountryCode": "CN",
  "supplierYears": 10,
  "verifiedSupplier": true,
  "goldSupplier": true,
  "tradeAssurance": true,
  "supplierRating": 4.5,
  "supplierReviewCount": 65,
  "responseRate": "98.5%"
}
```

Each row has about 55 fields in total, including image URLs, category, supplier sub-ratings (product quality, service, on-time shipment), employees, factory size, main products, export countries and certifications.

## Use cases

- **Sourcing shortlists**: filter by `maxMoq`, `verifiedSuppliersOnly` and `supplierCountry`, then sort by `priceMin`.
- **Landed-cost planning**: `priceTiers` shows how the unit price drops at each quantity break.
- **Supplier vetting**: compare `supplierYears`, `supplierRating`, `responseRate` and certifications side by side.
- **Price monitoring**: schedule the same keywords weekly and track `priceMin` and `soldCount` by `productId`.

## Price

**$1.50 per 1,000 products**, pay per result. No start fee, no monthly rental. Apify's free plan includes $5 of monthly credit.

## Limits

- About 960 unique products per keyword: Alibaba serves 20 pages of 48 for any search. Use narrower keywords or the price/MOQ/country filters to slice further.
- Alibaba matches loosely, so a narrow or misspelled keyword still returns related products. Check titles if precision matters.
- Prices are USD list prices from the search card; final prices depend on quantity, options and shipping.
- Supplier location is country level, and only search-result fields are returned (no full specs, SKU lists or review texts).
- `minPrice` / `maxPrice` take whole dollars.

## Links

- Actor on the Apify Store: https://apify.com/rel8ble/alibaba-product-search-scraper
- Apify Python client docs: https://docs.apify.com/api/client/python

## License

MIT

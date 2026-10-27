// Runnable Node.js example for the Alibaba scraper on Apify: https://apify.com/rel8ble/alibaba-product-search-scraper
// npm install && APIFY_TOKEN=<YOUR_APIFY_TOKEN> node example.js
import { ApifyClient } from 'apify-client';
import { writeFileSync } from 'node:fs';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client.actor('rel8ble/alibaba-product-search-scraper').call({
        "searchTerms": [
            "yoga mat"
        ],
        "maxResultsPerSearch": 100,
        "verifiedSuppliersOnly": true,
        "maxMoq": 50
    });
const { items } = await client.dataset(run.defaultDatasetId).listItems();

// Verified, low-MOQ Alibaba products -> alibaba_products.csv, cheapest first order first
const rows = items
    .filter((p) => p.moq && (p.priceTiers?.[0]?.price ?? p.priceMax))
    .map((p) => {
        const unit = p.priceTiers?.[0]?.price ?? p.priceMax;
        return { firstOrderUsd: +(p.moq * unit).toFixed(2), moq: p.moqText, unit, supplier: p.supplierName,
            years: p.supplierYears, rating: p.supplierRating, verifiedBy: p.supplierVerifiedBy, title: p.title, url: p.url };
    })
    .sort((a, b) => a.firstOrderUsd - b.firstOrderUsd);

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const header = Object.keys(rows[0] ?? {});
writeFileSync('alibaba_products.csv', [header.join(','), ...rows.map((row) => header.map((h) => esc(row[h])).join(','))].join('\n'));
console.log(`${rows.length} rows -> alibaba_products.csv`);

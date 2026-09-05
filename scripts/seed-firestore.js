/**
 * scripts/seed-firestore.js
 * Seeds Firestore from your Excel (export Sheet1 as products.csv here first).
 * 
 * HOW TO USE:
 *   1. Export Sheet1 of your Excel as "products.csv" → put it in /scripts/
 *   2. Download service account JSON from Firebase Console → Project Settings → Service Accounts
 *      → save as scripts/service-account.json
 *   3. npm install  (once)
 *   4. node scripts/seed-firestore.js
 */
'use strict';

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const SA_PATH = path.join(__dirname, 'service-account.json');
const CSV_PATH = path.join(__dirname, 'products.csv');

if (!fs.existsSync(SA_PATH)) {
  console.error('ERROR: Missing scripts/service-account.json');
  process.exit(1);
}
if (!fs.existsSync(CSV_PATH)) {
  console.error('ERROR: Missing scripts/products.csv — export Sheet1 from your Excel');
  process.exit(1);
}

initializeApp({ credential: cert(require(SA_PATH)) });
const db = getFirestore();

function extractDriveId(url) {
  if (!url) return null;
  const m = url.match(/\/file\/d\/([^\/\?&]+)/) ||
            url.match(/[?&]id=([^&]+)/) ||
            url.match(/\/d\/([^\/\s,]+)/);
  return m ? m[1] : null;
}

function driveThumb(rawUrl, width = 400) {
  if (!rawUrl || !rawUrl.trim()) return '';
  const id = extractDriveId(rawUrl.trim());
  return id ? `https://lh3.googleusercontent.com/d/${id}=w${width}` : rawUrl.trim();
}

function getCategory(row) {
  const cat = (row.category || '').trim().toLowerCase();
  if (cat) return cat;
  const t = (row.title || row['Product Name'] || '').toLowerCase();
  if (/earring|stud|hoop|jhumk/i.test(t)) return 'earring';
  if (/necklace|pendant|chain/i.test(t)) return 'necklace';
  if (/bracelet|bangle/i.test(t)) return 'bracelet';
  if (/anklet|payal/i.test(t)) return 'anklet';
  if (/\bring\b/i.test(t)) return 'ring';
  return 'other';
}

async function seed() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });
  const products = records.filter(r => r.id && parseFloat(r.id) > 0 && (r.title || r['Product Name']));
  console.log('Seeding ' + products.length + ' products...');

  const BATCH_SIZE = 400;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = products.slice(i, i + BATCH_SIZE);
    for (const row of chunk) {
      const id = String(parseInt(row.id));
      const ref = db.collection('products').doc(id);
      const imageLink = (row['image link'] || row['raw image'] || '').trim();
      batch.set(ref, {
        id,
        title: (row.title || row['Product Name'] || '').trim(),
        description: (row.description || '').trim(),
        price: parseFloat(row.price) || 0,
        without_offer: parseFloat(row.without_offer) || 0,
        stocks: parseInt(row.stocks) || 0,
        category: getCategory(row),
        image_link: imageLink,
        image_thumb: driveThumb(imageLink, 400),
        additional_images: (row.additional_images || '').trim(),
        video_link: (row.video_link || row.Instagram_video || '').trim(),
        details: (row.details || row['product detail'] || '').trim(),
        quote: (row.quote || '').trim(),
        logo_link: (row.logo_link || '').trim(),
        updatedAt: new Date(),
      }, { merge: true });
    }
    await batch.commit();
    console.log('  Seeded ' + Math.min(i + BATCH_SIZE, products.length) + ' / ' + products.length);
  }
  console.log('Done! Products are now in Firestore.');
}

seed().catch(e => { console.error(e); process.exit(1); });

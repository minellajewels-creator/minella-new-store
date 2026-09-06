"use strict";

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const SA_PATH = path.join(__dirname, "service-account.json");
const XLSX_PATH = path.join(__dirname, "data.xlsx");

if (!fs.existsSync(SA_PATH)) {
  console.error("ERROR: Missing scripts/service-account.json");
  process.exit(1);
}
if (!fs.existsSync(XLSX_PATH)) {
  console.error("ERROR: Missing scripts/data.xlsx");
  process.exit(1);
}

initializeApp({ credential: cert(require(SA_PATH)) });
const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────
function extractDriveId(url) {
  if (!url) return null;
  const m =
    String(url).match(/\/file\/d\/([^\/\?&]+)/) ||
    String(url).match(/[?&]id=([^&]+)/) ||
    String(url).match(/\/d\/([^\/\s,]+)/);
  return m ? m[1] : null;
}
function driveThumb(rawUrl, width = 400) {
  if (!rawUrl) return "";
  const id = extractDriveId(String(rawUrl).trim());
  return id
    ? `https://lh3.googleusercontent.com/d/${id}=w${width}`
    : String(rawUrl).trim();
}
function getCategory(title) {
  const t = (title || "").toLowerCase();
  if (/earring|stud|hoop|jhumk/i.test(t)) return "earring";
  if (/necklace|pendant|chain/i.test(t)) return "necklace";
  if (/bracelet|bangle|cuff/i.test(t)) return "bracelet";
  if (/anklet|payal/i.test(t)) return "anklet";
  if (/\bring\b/i.test(t)) return "ring";
  return "other";
}
function parseHeader(val) {
  if (!val) return "";
  const m = String(val).match(/"([^"]+)"\s*\)/);
  return m ? m[1] : String(val);
}
async function batchWrite(collection, docs) {
  const CHUNK = 499;
  let count = 0;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    for (const { id, data } of docs.slice(i, i + CHUNK)) {
      batch.set(db.collection(collection).doc(id), data, { merge: true });
    }
    await batch.commit();
    count += docs.slice(i, i + CHUNK).length;
    console.log(`  ${collection}: ${count}/${docs.length} written`);
  }
}

// ── Read Excel ────────────────────────────────────────────────
console.log("\n📖 Reading data.xlsx...");
const wb = XLSX.readFile(XLSX_PATH, { cellDates: true, raw: false });

// ── Sheet1 → /products ────────────────────────────────────────
async function seedProducts() {
  const ws = wb.Sheets["Sheet1"];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
  });
  const headers = rows[0].map(parseHeader);

  console.log("\n📦 Seeding products...");
  const docs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = {};
    headers.forEach((h, i) => {
      row[h] = rows[r][i] ?? "";
    });

    const id = row["id"] ? String(parseInt(row["id"])) : null;
    if (!id || id === "NaN") continue;

    const imageLink = (row["image link"] || row["raw image"] || "").trim();
    const title = (row["Product Name"] || row["title"] || "").trim();

    docs.push({
      id,
      data: {
        id,
        title,
        description: (row["description"] || "").trim(),
        price: parseFloat(row["price"]) || 0,
        without_offer: parseFloat(row["without_offer"]) || 0,
        stocks: parseInt(row["stocks"]) || 0,
        category: getCategory(title),
        image_link: imageLink,
        image_thumb: driveThumb(imageLink, 400),
        additional_images: (row["additional_images"] || "").trim(),
        video_link: (row["video_link"] || row["Instagram_video"] || "").trim(),
        details: (row["details"] || row["product detail"] || "").trim(),
        quote: (row["quote"] || "").trim(),
        logo_link: (row["logo_link"] || "").trim(),
        updatedAt: new Date(),
      },
    });
  }
  await batchWrite("products", docs);
  console.log(`  ✅ ${docs.length} products done`);
}

// ── Orders → /orders ─────────────────────────────────────────
// No header row — columns fixed by position
async function seedOrders() {
  const ws = wb.Sheets["Orders"];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false,
    defval: "",
  });

  console.log("\n🧾 Seeding orders...");
  const docs = [];
  for (const row of rows) {
    const orderId = row[1];
    if (!orderId || !String(orderId).startsWith("MNL-")) continue;

    let cartData = row[13] || "[]";
    try {
      JSON.parse(cartData);
    } catch {
      cartData = "[]";
    }

    let createdAt = new Date();
    try {
      const d = new Date(row[0]);
      if (!isNaN(d)) createdAt = d;
    } catch {}

    docs.push({
      id: String(orderId),
      data: {
        orderId: String(orderId),
        txnid: String(row[2] || ""),
        name: String(row[3] || ""),
        phone: String(row[4] || "").replace(/\.0$/, ""),
        email: String(row[5] || ""),
        address: String(row[6] || ""),
        items: String(row[7] || ""),
        subtotal: parseFloat(row[8]) || 0,
        shipping: parseFloat(row[9]) || 0,
        codCharge: parseFloat(row[10]) || 0,
        grandTotal: parseFloat(row[11]) || 0,
        paymentMethod: String(row[12] || ""),
        cartData,
        status: String(row[14] || "Unknown"),
        createdAt,
      },
    });
  }
  await batchWrite("orders", docs);
  console.log(`  ✅ ${docs.length} orders done`);
}

// ── Run ───────────────────────────────────────────────────────
async function run() {
  await seedProducts();
  await seedOrders();
  console.log("\n🎉 Firestore seeded!\n");
  process.exit(0);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});

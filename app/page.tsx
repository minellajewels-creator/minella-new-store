import { getAdminDb } from "@/lib/firebase-admin";
import { Product } from "@/lib/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import Toast from "@/components/Toast";

export const dynamic = "force-dynamic";

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "https://minella.in";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Minella Jewels",
      url: STORE_URL,
      logo: `${STORE_URL}/favicon.png`,
      sameAs: ["https://instagram.com/minellajewels"],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-9080014835",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["English", "Tamil"],
      },
    },
    {
      "@type": "WebSite",
      name: "Minella Jewels",
      url: STORE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${STORE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is anti-tarnish jewellery?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Anti-tarnish jewellery uses a protective coating that prevents oxidation, keeping it shiny for months even with daily wear, sweat, and water exposure.",
      },
    },
    {
      "@type": "Question",
      name: "Is Minella Jewels jewellery waterproof?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All Minella Jewels pieces are 100% waterproof and sweat-resistant. You can wear them in rain, while exercising, or in the shower.",
      },
    },
    {
      "@type": "Question",
      name: "Is cash on delivery available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Minella Jewels offers Cash on Delivery (COD) across India. Free shipping on orders above ₹999.",
      },
    },
    {
      "@type": "Question",
      name: "Is the jewellery skin safe?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All pieces are nickel-free and hypoallergenic, safe for sensitive skin.",
      },
    },
  ],
};

// Strip Firestore class instances (Timestamps etc.) — only keep plain scalar fields
function sanitizeProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  const plain: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) { plain[k] = ""; continue; }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      plain[k] = v;
    }
    // Skip Timestamps, GeoPoints, References, Arrays of objects — not needed for Product
  }
  return plain as unknown as Product;
}

async function getProducts(): Promise<Product[]> {
  try {
    const db = getAdminDb();
    const snap = await db.collection("products").get();
    return snap.docs
      .map((d) => sanitizeProduct(d.id, d.data()))
      .filter((p) => p.title)
      .sort((a, b) => Number(a.id) - Number(b.id));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Every Day Every WEAR</h1>
          <p>18K Gold Plated &bull; Anti-Tarnish &bull; Skin Friendly</p>
          <button className="hero-cta" onClick={undefined}>
            Shop Now &rarr;
          </button>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('.hero-cta')?.addEventListener('click',function(){document.getElementById('shopAnchor')?.scrollIntoView({behavior:'smooth'});});`,
        }}
      />

      {/* Trust bar */}
      <div className="trust-bar">
        {[
          {
            icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>,
            label: <><strong>Anti-Tarnish</strong> Guaranteed</>,
          },
          {
            icon: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
            label: <><strong>Free Shipping</strong> on ₹999+</>,
          },
          {
            icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>,
            label: <><strong>COD</strong> Available</>,
          },
          {
            icon: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></>,
            label: <><strong>Handpicked</strong> Quality</>,
          },
          {
            icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
            label: <><strong>Secure</strong> Payments</>,
          },
        ].map((t, i) => (
          <div key={i} className="trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              {t.icon}
            </svg>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      <ProductGrid initialProducts={products} />

      <a href="https://wa.me/919080014835" target="_blank" rel="noopener" id="waBtn" aria-label="Chat on WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <Toast />
      <Footer />
    </>
  );
}

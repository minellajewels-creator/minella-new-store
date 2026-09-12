import { getAdminDb } from "@/lib/firebase-admin";

export interface SiteAssets {
  hero_url: string;
  logo_url: string;
  og_image_url: string;
  cat_earring_url: string;
  cat_necklace_url: string;
  cat_bracelet_url: string;
  cat_ring_url: string;
  cat_anklet_url: string;
  cat_all_url: string;
}

const DEFAULTS: SiteAssets = {
  hero_url: "/assets/images/hero/hero-1.webp",
  logo_url: "",
  og_image_url: "/assets/images/og-home.jpg",
  cat_earring_url: "/assets/images/categories/earrings.jpg",
  cat_necklace_url: "/assets/images/categories/necklaces.jpg",
  cat_bracelet_url: "/assets/images/categories/bracelets.jpg",
  cat_ring_url: "/assets/images/categories/rings.jpg",
  cat_anklet_url: "/assets/images/categories/anklets.jpg",
  cat_all_url: "/assets/images/categories/necklaces.jpg",
};

export async function getSiteAssets(): Promise<SiteAssets> {
  try {
    const db = getAdminDb();
    const snap = await db.collection("site_assets").doc("main").get();
    if (!snap.exists) return DEFAULTS;
    const data = snap.data()!;
    return {
      hero_url: data.hero_url || DEFAULTS.hero_url,
      logo_url: data.logo_url || DEFAULTS.logo_url,
      og_image_url: data.og_image_url || DEFAULTS.og_image_url,
      cat_earring_url: data.cat_earring_url || DEFAULTS.cat_earring_url,
      cat_necklace_url: data.cat_necklace_url || DEFAULTS.cat_necklace_url,
      cat_bracelet_url: data.cat_bracelet_url || DEFAULTS.cat_bracelet_url,
      cat_ring_url: data.cat_ring_url || DEFAULTS.cat_ring_url,
      cat_anklet_url: data.cat_anklet_url || DEFAULTS.cat_anklet_url,
      cat_all_url: data.cat_all_url || DEFAULTS.cat_all_url,
    };
  } catch {
    return DEFAULTS;
  }
}

const ZONE_RATES: Record<string, { base: number; extra: number; name: string }> = {
  A: { base: 35.40, extra: 34.22, name: 'Zone A — Local (Coimbatore)' },
  B: { base: 38.94, extra: 37.76, name: 'Zone B — Intra-state (Tamil Nadu)' },
  C: { base: 51.92, extra: 49.56, name: 'Zone C — Metro' },
  D: { base: 61.36, extra: 57.82, name: 'Zone D — Pan India' },
  E: { base: 75.52, extra: 71.98, name: 'Zone E — Northeast / J&K' },
};

const FLAT_PREFIXES = [
  '380','382','560','562','631','160','140','141','600','602',
  '110','120','121','122','201','250','124','131','132','500',
  '711','712','713','700','400','421','401','410','411','415',
  '395','403','641','642','643','625','626','627','628',
];

export function getPincodeZone(pin: string): string {
  if (!pin || pin.length !== 6) return 'D';
  const n = parseInt(pin);
  const p2 = pin.substring(0, 2);
  const p3 = pin.substring(0, 3);
  if (p2 === '18' || p2 === '19') return 'E';
  if (p2 === '73' && n >= 737000 && n <= 737199) return 'E';
  if (p2 === '78' && n >= 781000) return 'E';
  if (p2 === '79' || p2 === '97') return 'E';
  if (n >= 744100 && n <= 744304) return 'E';
  if (['641','642','643','638'].includes(p3)) return 'A';
  if (n >= 600000 && n <= 643999) return 'B';
  if (['110','400','600','700','500','560','380','411','160'].includes(p3)) return 'C';
  return 'D';
}

export function calcShipping(pin: string, subtotal: number, totalItems: number): {
  cost: number;
  label: string;
  zone: string;
  free: boolean;
} {
  if (subtotal >= 999) {
    return { cost: 0, label: '₹0 — FREE!', zone: 'Free shipping on orders above ₹999 🎉', free: true };
  }
  const zone = getPincodeZone(pin);
  const r = ZONE_RATES[zone] || ZONE_RATES['D'];
  const weightG = Math.max(500, totalItems * 50);
  const slabs = Math.ceil(weightG / 500);
  const extraSlabs = Math.max(0, slabs - 1);
  let baseShip = r.base + extraSlabs * r.extra;
  if (FLAT_PREFIXES.some((pf) => pin.startsWith(pf)) && zone !== 'A') baseShip += 2.5;
  const total = Math.ceil(baseShip + baseShip * 0.05);
  return {
    cost: total,
    label: `₹${total}`,
    zone: `${r.name} · ${totalItems} item(s)`,
    free: false,
  };
}

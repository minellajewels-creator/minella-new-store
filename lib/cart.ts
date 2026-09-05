'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  title: string;
  price: number;
  qty: number;
  stock: number;
  id: string;
}

interface CartState {
  items: Record<string, CartItem>;
  add: (item: { id: string; title: string; price: number; stock: number }) => string | null;
  change: (title: string, delta: number) => void;
  remove: (title: string) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      add: ({ id, title, price, stock }) => {
        const cur = get().items[title];
        if (cur && cur.qty >= stock) return 'No more stock available';
        set((state) => ({
          items: {
            ...state.items,
            [title]: { id, title, price, stock, qty: (cur?.qty ?? 0) + 1 },
          },
        }));
        return null;
      },
      change: (title, delta) =>
        set((state) => {
          const item = state.items[title];
          if (!item) return state;
          const qty = item.qty + delta;
          if (qty <= 0) {
            const { [title]: _, ...rest } = state.items;
            return { items: rest };
          }
          return { items: { ...state.items, [title]: { ...item, qty } } };
        }),
      remove: (title) =>
        set((state) => {
          const { [title]: _, ...rest } = state.items;
          return { items: rest };
        }),
      clear: () => set({ items: {} }),
      subtotal: () =>
        Object.values(get().items).reduce((s, i) => s + i.price * i.qty, 0),
      count: () =>
        Object.values(get().items).reduce((s, i) => s + i.qty, 0),
    }),
    { name: 'minella_cart_v2' }
  )
);

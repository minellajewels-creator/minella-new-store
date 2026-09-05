'use client';
import { useState } from 'react';
import { useCart, CartItem } from '@/lib/cart';
import CheckoutModal from './CheckoutModal';

interface Props { open: boolean; onClose: () => void; }

export default function CartDrawer({ open, onClose }: Props) {
  const { items, change, remove, subtotal, count } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const total = subtotal();
  const itemList = Object.values(items);

  return (
    <>
      <div className={`overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer${open ? ' open' : ''}`}>
        <div className="drawer-head">
          <h3>Your Bag</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-body">
          {itemList.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛍️</div>
              <p>Your bag is empty</p>
            </div>
          ) : (
            itemList.map((item: CartItem) => (
              <div key={item.title} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.title}</div>
                  <div className="cart-item-sub">
                    ₹{item.price.toLocaleString('en-IN')} × {item.qty} = ₹{(item.price * item.qty).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="qty-row">
                  <div className="qty-ctrl">
                    <button onClick={() => change(item.title, -1)}>-</button>
                    <span className="qty-num">{item.qty}</span>
                    <button onClick={() => change(item.title, 1)}>+</button>
                  </div>
                  <button className="btn-remove" onClick={() => remove(item.title)}>×</button>
                </div>
              </div>
            ))
          )}
        </div>
        {itemList.length > 0 && (
          <div className="cart-foot">
            <div className="cart-cod-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Cash on Delivery available at checkout
            </div>
            <div className="cart-total-row">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
            <button className="btn-checkout" onClick={() => { onClose(); setCheckoutOpen(true); }}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}

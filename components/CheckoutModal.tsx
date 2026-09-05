'use client';
import { useState, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { calcShipping } from '@/lib/shipping';
import { useRouter } from 'next/navigation';

interface Props { open: boolean; onClose: () => void; }

type PayMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'emi' | 'cod' | null;

export default function CheckoutModal({ open, onClose }: Props) {
  const { items, subtotal, count, clear } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [selectedPay, setSelectedPay] = useState<PayMethod>(null);
  const [shipping, setShipping] = useState<{ cost: number; label: string; zone: string } | null>(null);
  const payuFormRef = useRef<HTMLFormElement>(null);

  // Form fields
  const [form, setForm] = useState({ name: '', phone: '', email: '', addr: '', city: '', state: '', pin: '' });
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  const sub = subtotal();
  const codCharge = selectedPay === 'cod' ? Math.max(40, Math.round(sub * 0.02)) : 0;
  const grand = sub + (shipping?.cost ?? 0) + codCharge;
  const itemList = Object.values(items);
  const totalItems = itemList.reduce((s, i) => s + i.qty, 0);

  function validateDelivery() {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your full name';
    if (!/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Enter a valid 10-digit number';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (form.addr.trim().length < 5) errs.addr = 'Please enter your address';
    if (!/^\d{6}$/.test(form.pin.trim())) errs.pin = 'Enter a valid 6-digit pincode';
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    setErr('');
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      if (!validateDelivery()) { setErr('Please fill all mandatory fields correctly.'); return; }
      const sh = calcShipping(form.pin, sub, totalItems);
      setShipping(sh);
      setStep(3);
      return;
    }
    if (step === 3) placeOrder();
  }

  async function placeOrder() {
    if (!selectedPay) { setErr('Please select a payment method.'); return; }
    setLoading(true);
    setErr('');
    const fullAddress = `${form.addr}${form.city ? ', ' + form.city : ''}${form.state ? ', ' + form.state : ''} - ${form.pin}`;
    const itemsSummary = itemList.map((i) => `${i.title} x${i.qty} = Rs.${i.price * i.qty}`).join('; ');
    const cartArr = itemList.map((i) => ({ id: i.id, title: i.title, qty: i.qty, price: i.price }));
    const payload = {
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(),
      address: fullAddress, items: itemsSummary, subtotal: sub,
      shipping: shipping?.cost ?? 0, codCharge, grandTotal: grand,
      paymentMethod: selectedPay === 'cod' ? 'Cash on Delivery' : selectedPay,
      cartData: cartArr,
    };

    try {
      const res = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Order failed');

      if (selectedPay === 'cod') {
        clear();
        onClose();
        router.push(`/success?method=cod&name=${encodeURIComponent(form.name)}`);
        return;
      }

      // PayU online flow
      if (!data.formFields) throw new Error('Payment setup failed');
      clear();
      const f = data.formFields;
      const form_ = payuFormRef.current!;
      (form_ as any).action = data.payuUrl;
      (form_.elements.namedItem('key') as HTMLInputElement).value = f.key;
      (form_.elements.namedItem('txnid') as HTMLInputElement).value = f.txnid;
      (form_.elements.namedItem('amount') as HTMLInputElement).value = f.amount;
      (form_.elements.namedItem('productinfo') as HTMLInputElement).value = f.productinfo;
      (form_.elements.namedItem('firstname') as HTMLInputElement).value = f.firstname;
      (form_.elements.namedItem('email') as HTMLInputElement).value = f.email;
      (form_.elements.namedItem('phone') as HTMLInputElement).value = f.phone;
      (form_.elements.namedItem('surl') as HTMLInputElement).value = f.surl;
      (form_.elements.namedItem('furl') as HTMLInputElement).value = f.furl;
      (form_.elements.namedItem('hash') as HTMLInputElement).value = f.hash;
      (form_.elements.namedItem('udf1') as HTMLInputElement).value = f.udf1 || '';
      (form_.elements.namedItem('udf2') as HTMLInputElement).value = f.udf2 || '';
      form_.submit();
    } catch (e: any) {
      setErr(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1); setErr(''); setSelectedPay(null); setShipping(null);
    setForm({ name: '', phone: '', email: '', addr: '', city: '', state: '', pin: '' });
    setFormErr({});
  }

  function handleClose() { reset(); onClose(); }

  if (!open) return null;

  return (
    <>
      {/* Spinner */}
      {loading && (
        <div className="spinner-overlay show">
          <div className="spinner" />
          <div className="spinner-text">Processing…</div>
        </div>
      )}

      {/* Hidden PayU form */}
      <form ref={payuFormRef} method="POST" style={{ display: 'none' }}>
        <input type="hidden" name="key" />
        <input type="hidden" name="txnid" />
        <input type="hidden" name="amount" />
        <input type="hidden" name="productinfo" />
        <input type="hidden" name="firstname" />
        <input type="hidden" name="email" />
        <input type="hidden" name="phone" />
        <input type="hidden" name="surl" />
        <input type="hidden" name="furl" />
        <input type="hidden" name="hash" />
        <input type="hidden" name="udf1" />
        <input type="hidden" name="udf2" />
      </form>

      <div className="overlay open" onClick={handleClose} />
      <div className="co-modal open">
        <div className="co-box">
          <div className="co-head">
            <h3>Checkout</h3>
            <button className="btn-close" onClick={handleClose}>✕</button>
          </div>

          {/* Stepper */}
          <div className="stepper">
            {[1,2,3].map((s, i) => (
              <>
                <div key={s} className={`step-item${step === s ? ' active' : step > s ? ' done' : ''}`}>
                  <div className="step-circle">{step > s ? '✓' : s}</div>
                  <div className="step-label">{['Review','Delivery','Payment'][i]}</div>
                </div>
                {i < 2 && <div className={`step-line${step > s ? ' done' : ''}`} />}
              </>
            ))}
          </div>

          <div className="co-body">
            {err && <div className="err-banner show">⚠️ {err}</div>}

            {/* Step 1: Review */}
            {step === 1 && (
              <div className="co-section active">
                <div className="co-sec-title">Order Summary</div>
                <div className="co-cod-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                  Cash on Delivery available — pay when your order arrives!
                </div>
                {itemList.map((item) => (
                  <div key={item.title} className="order-line">
                    <span className="order-line-name">{item.title} × {item.qty}</span>
                    <span className="order-line-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="order-line sub-line"><span>Shipping</span><span>Calculated in next step</span></div>
                <div className="order-line total-line"><span>Grand Total</span><span>—</span></div>
              </div>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <div className="co-section active">
                <div className="co-sec-title">Delivery Details</div>
                {[
                  { id: 'name', label: 'Full Name', placeholder: 'e.g. Priya Krishnan', type: 'text', autocomplete: 'name' },
                  { id: 'phone', label: 'Mobile Number', placeholder: '10-digit mobile', type: 'tel', autocomplete: 'tel' },
                  { id: 'email', label: 'Email', placeholder: 'yourname@email.com', type: 'email', autocomplete: 'email' },
                  { id: 'addr', label: 'Address', placeholder: 'House/Flat no., Street, Area', type: 'text', autocomplete: 'street-address' },
                  { id: 'pin', label: 'Pincode', placeholder: '6-digit pincode', type: 'tel', autocomplete: 'postal-code' },
                ].map((field) => (
                  <div key={field.id} className="form-g">
                    <label className="form-label">{field.label} <span className="req">*</span></label>
                    <input
                      className={`form-input${formErr[field.id] ? ' err' : ''}`}
                      type={field.type}
                      placeholder={field.placeholder}
                      autoComplete={field.autocomplete}
                      value={(form as any)[field.id]}
                      onChange={(e) => { setForm(f => ({ ...f, [field.id]: e.target.value })); setFormErr(fe => ({ ...fe, [field.id]: '' })); }}
                    />
                    {formErr[field.id] && <div className="field-err show">{formErr[field.id]}</div>}
                  </div>
                ))}
                <div className="form-row">
                  <div className="form-g">
                    <label className="form-label">City</label>
                    <input className="form-input" placeholder="City" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="form-g">
                    <label className="form-label">State</label>
                    <input className="form-input" placeholder="State" value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="co-section active">
                <div className="co-sec-title">Payment Method</div>
                <div className="pay-sec-label">Pay Online</div>
                <div className="pay-methods-grid">
                  {[
                    { key: 'upi', icon: '📱', label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
                    { key: 'card', icon: '💳', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
                    { key: 'netbanking', icon: '🏦', label: 'Net Banking', sub: 'All major banks' },
                    { key: 'wallet', icon: '👛', label: 'Wallets', sub: 'Paytm, Mobikwik, Airtel' },
                    { key: 'emi', icon: '📅', label: 'EMI', sub: 'Credit card EMI' },
                  ].map((m) => (
                    <div key={m.key} className={`pay-method-card${selectedPay === m.key ? ' selected' : ''}`} onClick={() => setSelectedPay(m.key as PayMethod)}>
                      <div className="pay-method-icon">{m.icon}</div>
                      <div className="pay-method-label">{m.label}</div>
                      <div className="pay-method-sub">{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="pay-divider">or</div>
                <div className={`cod-card${selectedPay === 'cod' ? ' selected' : ''}`} onClick={() => setSelectedPay('cod')}>
                  <div className="cod-card-icon">💵</div>
                  <div>
                    <div className="cod-card-label">Cash on Delivery</div>
                    <div className="cod-card-sub">Pay when your order arrives — no upfront payment needed</div>
                  </div>
                </div>
                {selectedPay && (
                  <div className="confirm-box">
                    <div className="confirm-box-title">Order Summary</div>
                    {itemList.map((i) => (
                      <div key={i.title} className="confirm-line">
                        <span>{i.title} ×{i.qty}</span>
                        <span>₹{(i.price * i.qty).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="confirm-line"><span>Shipping</span><span>₹{shipping?.cost ?? 0}</span></div>
                    {codCharge > 0 && <div className="confirm-line"><span>COD Charge</span><span>₹{codCharge}</span></div>}
                    <div className="confirm-total"><span>Grand Total</span><span>₹{grand.toLocaleString('en-IN')}</span></div>
                  </div>
                )}
                {selectedPay === 'cod' && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>COD charge of ₹{codCharge} (₹40 or 2% of order, whichever is higher) added.</div>}
                {selectedPay && selectedPay !== 'cod' && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>You'll be redirected to PayU's secure page to pay.</div>}
              </div>
            )}
          </div>

          <div className="co-foot">
            {step > 1 && <button className="btn-back" onClick={() => setStep(step - 1)}>← Back</button>}
            <button className={step === 3 ? 'btn-place' : 'btn-next'} onClick={handleNext} disabled={loading}>
              {step === 3 ? 'Place Order' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

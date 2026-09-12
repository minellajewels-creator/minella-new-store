"use client";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { calcShipping } from "@/lib/shipping";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

type PayMethod = "online" | "cod" | null;

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutModal({ open, onClose }: Props) {
  const { items, subtotal, count, clear } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selectedPay, setSelectedPay] = useState<PayMethod>(null);
  const [shipping, setShipping] = useState<{
    cost: number;
    label: string;
    zone: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    addr: "",
    city: "",
    state: "",
    pin: "",
  });
  const [formErr, setFormErr] = useState<Record<string, string>>({});

  const sub = subtotal();
  const codCharge =
    selectedPay === "cod" ? Math.max(40, Math.round(sub * 0.02)) : 0;
  const grand = sub + (shipping?.cost ?? 0) + codCharge;
  const itemList = Object.values(items);
  const totalItems = itemList.reduce((s, i) => s + i.qty, 0);

  function validateDelivery() {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your full name";
    const rawPhone = form.phone.trim().replace(/^(\+91|91)/, "");
    if (!/^\d{10}$/.test(rawPhone))
      errs.phone = "Enter a valid 10-digit number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Enter a valid email address";
    if (form.addr.trim().length < 5) errs.addr = "Please enter your address";
    if (!/^\d{6}$/.test(form.pin.trim()))
      errs.pin = "Enter a valid 6-digit pincode";
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    setErr("");
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateDelivery()) {
        setErr("Please fill all mandatory fields correctly.");
        return;
      }
      const sh = calcShipping(form.pin, sub, totalItems);
      setShipping(sh);
      setStep(3);
      return;
    }
    if (step === 3) placeOrder();
  }

  // Load Razorpay script dynamically
  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function placeOrder() {
    if (!selectedPay) {
      setErr("Please select a payment method.");
      return;
    }
    setLoading(true);
    setErr("");

    const fullAddress = `${form.addr}${form.city ? ", " + form.city : ""}${form.state ? ", " + form.state : ""} - ${form.pin}`;
    const itemsSummary = itemList
      .map((i) => `${i.title} x${i.qty} = Rs.${i.price * i.qty}`)
      .join("; ");
    const cartArr = itemList.map((i) => ({
      id: i.id,
      title: i.title,
      qty: i.qty,
      price: i.price,
    }));
    const cleanPhone = form.phone.trim().replace(/^(\+91|91)/, "");

    const payload = {
      name: form.name.trim(),
      phone: cleanPhone,
      email: form.email.trim(),
      address: fullAddress,
      items: itemsSummary,
      subtotal: sub,
      shipping: shipping?.cost ?? 0,
      codCharge,
      grandTotal: grand,
      paymentMethod:
        selectedPay === "cod" ? "Cash on Delivery" : "Online Payment",
      cartData: cartArr,
      pincode: form.pin.trim(),
    };

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Order failed");

      // COD — done
      if (selectedPay === "cod") {
        clear();
        onClose();
        router.push(
          `/success?method=cod&name=${encodeURIComponent(form.name)}`,
        );
        return;
      }

      // Online — open Razorpay modal
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded)
        throw new Error("Payment gateway failed to load. Please try again.");

      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const rzp = new window.Razorpay({
        key: rzpKey,
        order_id: data.razorpayOrderId,
        amount: data.amount, // paise — Razorpay uses this automatically
        currency: data.currency,
        name: "Minella Jewels",
        description: `Order ${data.orderId}`,
        image: "/manifest.json", // optional brand logo
        prefill: {
          name: data.name,
          email: data.email,
          contact: `+91${cleanPhone}`,
        },
        theme: { color: "#4a1942" },

        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // Payment success — verify on server
          try {
            const vRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                txnid: data.txnid,
              }),
            });
            const vData = await vRes.json();
            clear();
            onClose();
            if (vData.ok) {
              router.push(`/success?method=online&txnid=${data.txnid}`);
            } else {
              router.push(`/success?method=failed&txnid=${data.txnid}`);
            }
          } catch {
            clear();
            onClose();
            router.push(`/success?method=failed&txnid=${data.txnid}`);
          }
        },

        modal: {
          ondismiss: function () {
            // User closed the modal without paying
            setLoading(false);
            setErr("Payment cancelled. You can try again.");
          },
        },
      });

      rzp.on("payment.failed", function (response: any) {
        setLoading(false);
        setErr(
          response?.error?.description ||
            "Payment failed. Please try a different method.",
        );
      });

      rzp.open();
      setLoading(false); // loading stops once modal is open
    } catch (e: any) {
      setErr(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function reset() {
    setStep(1);
    setErr("");
    setSelectedPay(null);
    setShipping(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      addr: "",
      city: "",
      state: "",
      pin: "",
    });
    setFormErr({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {loading && (
        <div className="spinner-overlay show">
          <div className="spinner" />
          <div className="spinner-text">Processing…</div>
        </div>
      )}

      <div className="overlay open" onClick={handleClose} />
      <div className="co-modal open">
        <div className="co-box">
          <div className="co-head">
            <h3>Checkout</h3>
            <button className="btn-close" onClick={handleClose}>
              ✕
            </button>
          </div>

          {/* Stepper */}
          <div className="stepper">
            {[1, 2, 3].map((s, i) => (
              <>
                <div
                  key={s}
                  className={`step-item${step === s ? " active" : step > s ? " done" : ""}`}
                >
                  <div className="step-circle">{step > s ? "✓" : s}</div>
                  <div className="step-label">
                    {["Review", "Delivery", "Payment"][i]}
                  </div>
                </div>
                {i < 2 && (
                  <div className={`step-line${step > s ? " done" : ""}`} />
                )}
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    width="14"
                    height="14"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Cash on Delivery available — pay when your order arrives!
                </div>
                {itemList.map((item) => (
                  <div key={item.title} className="order-line">
                    <span className="order-line-name">
                      {item.title} × {item.qty}
                    </span>
                    <span className="order-line-price">
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
                <div className="order-line sub-line">
                  <span>Shipping</span>
                  <span>Calculated in next step</span>
                </div>
                <div className="order-line total-line">
                  <span>Grand Total</span>
                  <span>—</span>
                </div>
              </div>
            )}

            {/* Step 2: Delivery */}
            {step === 2 && (
              <div className="co-section active">
                <div className="co-sec-title">Delivery Details</div>
                {[
                  {
                    id: "name",
                    label: "Full Name",
                    placeholder: "e.g. Priya Krishnan",
                    type: "text",
                    autocomplete: "name",
                  },
                  {
                    id: "phone",
                    label: "Mobile Number",
                    placeholder: "10-digit mobile",
                    type: "tel",
                    autocomplete: "tel",
                  },
                  {
                    id: "email",
                    label: "Email",
                    placeholder: "yourname@email.com",
                    type: "email",
                    autocomplete: "email",
                  },
                  {
                    id: "addr",
                    label: "Address",
                    placeholder: "House/Flat no., Street, Area",
                    type: "text",
                    autocomplete: "street-address",
                  },
                  {
                    id: "pin",
                    label: "Pincode",
                    placeholder: "6-digit pincode",
                    type: "tel",
                    autocomplete: "postal-code",
                  },
                ].map((field) => (
                  <div key={field.id} className="form-g">
                    <label className="form-label">
                      {field.label} <span className="req">*</span>
                    </label>
                    <input
                      className={`form-input${formErr[field.id] ? " err" : ""}`}
                      type={field.type}
                      placeholder={field.placeholder}
                      autoComplete={field.autocomplete}
                      value={(form as any)[field.id]}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, [field.id]: e.target.value }));
                        setFormErr((fe) => ({ ...fe, [field.id]: "" }));
                      }}
                    />
                    {formErr[field.id] && (
                      <div className="field-err show">{formErr[field.id]}</div>
                    )}
                  </div>
                ))}
                <div className="form-row">
                  <div className="form-g">
                    <label className="form-label">City</label>
                    <input
                      className="form-input"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-g">
                    <label className="form-label">State</label>
                    <input
                      className="form-input"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, state: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="co-section active">
                <div className="co-sec-title">How would you like to pay?</div>

                {/* Online Payment card */}
                <div
                  className={`cod-card${selectedPay === "online" ? " selected" : ""}`}
                  onClick={() => setSelectedPay("online")}
                  style={{ marginBottom: 12 }}
                >
                  <div className="cod-card-icon">💳</div>
                  <div>
                    <div className="cod-card-label">Pay Online</div>
                    <div className="cod-card-sub">
                      UPI, Cards, Net Banking, Wallets &amp; EMI — secured by
                      Razorpay
                    </div>
                  </div>
                </div>

                {/* COD card */}
                <div
                  className={`cod-card${selectedPay === "cod" ? " selected" : ""}`}
                  onClick={() => setSelectedPay("cod")}
                >
                  <div className="cod-card-icon">💵</div>
                  <div>
                    <div className="cod-card-label">Cash on Delivery</div>
                    <div className="cod-card-sub">
                      Pay when your order arrives — no upfront payment needed
                    </div>
                  </div>
                </div>

                {selectedPay && (
                  <div className="confirm-box">
                    <div className="confirm-box-title">Order Summary</div>
                    {itemList.map((i) => (
                      <div key={i.title} className="confirm-line">
                        <span>
                          {i.title} ×{i.qty}
                        </span>
                        <span>
                          ₹{(i.price * i.qty).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    <div className="confirm-line">
                      <span>Shipping</span>
                      <span>₹{shipping?.cost ?? 0}</span>
                    </div>
                    {codCharge > 0 && (
                      <div className="confirm-line">
                        <span>COD Charge</span>
                        <span>₹{codCharge}</span>
                      </div>
                    )}
                    <div className="confirm-total">
                      <span>Grand Total</span>
                      <span>₹{grand.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}
                {selectedPay === "cod" && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 8,
                    }}
                  >
                    COD charge of ₹{codCharge} (₹40 or 2% of order, whichever is
                    higher) added.
                  </div>
                )}
                {selectedPay === "online" && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 8,
                    }}
                  >
                    Razorpay's secure modal will open — UPI, cards, net banking
                    all available.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="co-foot">
            {step > 1 && (
              <button className="btn-back" onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}
            <button
              className={step === 3 ? "btn-place" : "btn-next"}
              onClick={handleNext}
              disabled={loading}
            >
              {step === 3 ? "Place Order" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

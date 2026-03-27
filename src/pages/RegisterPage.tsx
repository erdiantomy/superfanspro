import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, ChevronLeft, ChevronRight, Send } from "lucide-react";

// ─── TYPES ────────────────────────────────────────────
interface FormData {
  // Step 1
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  city: string;
  country: string;
  // Step 2
  venue_name: string;
  slug: string;
  courts: number;
  primary_color: string;
  // Step 3
  monthly_prize: number;
  prize_split_1st: number;
  prize_split_2nd: number;
  prize_split_3rd: number;
  // Step 4
  admin_password: string;
  confirm_password: string;
  logo_url: string;
  agree_terms: boolean;
}

const INITIAL: FormData = {
  contact_name: "", contact_email: "", contact_phone: "",
  city: "", country: "Indonesia",
  venue_name: "", slug: "", courts: 2, primary_color: "#00E676",
  monthly_prize: 2000000, prize_split_1st: 50, prize_split_2nd: 30, prize_split_3rd: 20,
  admin_password: "", confirm_password: "", logo_url: "", agree_terms: false,
};

const STEPS = ["Contact Details", "Venue Details", "Prize Configuration", "Admin Setup"];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);
}

function fmtRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

// ─── SLUG CHECKER ─────────────────────────────────────
function useSlugCheck(slug: string) {
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (!slug || slug.length < 3) { setStatus("idle"); return; }
    setStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await (supabase as any).from("venues").select("id").eq("slug", slug).maybeSingle();
      setStatus(data ? "taken" : "available");
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  return status;
}

// ─── MAIN COMPONENT ──────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const slugStatus = useSlugCheck(form.slug);

  const set = useCallback((key: keyof FormData, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }, []);

  // Auto-slug from venue name
  const setVenueName = (name: string) => {
    set("venue_name", name);
    if (!form.slug || form.slug === slugify(form.venue_name)) {
      set("slug", slugify(name));
    }
  };

  // ─── VALIDATION ──────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (step === 0) {
      if (!form.contact_name.trim()) e.contact_name = "Name is required";
      if (!form.contact_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) e.contact_email = "Valid email required";
      if (!form.contact_phone.trim()) e.contact_phone = "Phone number is required";
      if (!form.city.trim()) e.city = "City is required";
    }

    if (step === 1) {
      if (!form.venue_name.trim()) e.venue_name = "Venue name is required";
      if (!form.slug || form.slug.length < 3) e.slug = "Slug must be at least 3 characters";
      if (slugStatus === "taken") e.slug = "This slug is already taken";
      if (form.courts < 1 || form.courts > 10) e.courts = "Must be 1-10";
    }

    if (step === 2) {
      if (form.monthly_prize < 0) e.monthly_prize = "Must be positive";
      const total = form.prize_split_1st + form.prize_split_2nd + form.prize_split_3rd;
      if (total !== 100) e.prize_split = `Prize splits must total 100% (currently ${total}%)`;
    }

    if (step === 3) {
      if (form.admin_password.length < 8) e.admin_password = "Minimum 8 characters";
      if (form.admin_password !== form.confirm_password) e.confirm_password = "Passwords don't match";
      if (!form.agree_terms) e.agree_terms = "You must agree to continue";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 3)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("venue_registrations").insert({
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        venue_name: form.venue_name.trim(),
        slug: form.slug,
        courts: form.courts,
        primary_color: form.primary_color,
        monthly_prize: form.monthly_prize,
        prize_split_1st: form.prize_split_1st,
        prize_split_2nd: form.prize_split_2nd,
        prize_split_3rd: form.prize_split_3rd,
        admin_password_hash: form.admin_password, // In production, hash server-side
        logo_url: form.logo_url || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setErrors({ submit: err.message || "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── SUCCESS SCREEN ─────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#00E67620", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Check size={32} color="#00E676" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 12 }}>Registration Submitted!</h1>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, marginBottom: 8 }}>
            We'll review and activate your venue within 24 hours.
          </p>
          <p style={{ fontSize: 13, color: "#999", marginBottom: 28 }}>
            A confirmation has been sent to <strong style={{ color: "#333" }}>{form.contact_email}</strong>
          </p>
          <div style={{ background: "#f8f8f8", borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Your venue URL</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>superfans.games/<span style={{ color: "#00E676" }}>{form.slug}</span></div>
          </div>
          <button onClick={() => navigate("/")} style={{ background: "#111", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #eee", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif" }}>SUPERFANS</span>
          <span style={{ fontSize: 10, color: "#999", letterSpacing: 1 }}>VENUE REGISTRATION</span>
        </div>
        <button onClick={() => navigate("/")} style={{ fontSize: 13, color: "#666", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {/* Progress Bar */}
      <div style={{ padding: "20px 16px 0", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "#111" : "#e5e5e5", transition: "background .3s" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Step {step + 1} of 4</span>
          <span style={{ fontSize: 13, color: "#999" }}>{STEPS[step]}</span>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px 120px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* STEP 1: Contact */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Contact Details</h2>
                <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>Tell us about yourself so we can reach you.</p>
                <Field label="Full Name" value={form.contact_name} onChange={v => set("contact_name", v)} error={errors.contact_name} placeholder="Your full name" />
                <Field label="Email Address" value={form.contact_email} onChange={v => set("contact_email", v)} error={errors.contact_email} placeholder="you@email.com" type="email" />
                <Field label="WhatsApp Phone" value={form.contact_phone} onChange={v => set("contact_phone", v)} error={errors.contact_phone} placeholder="+62 812 3456 7890" />
                <Field label="City" value={form.city} onChange={v => set("city", v)} error={errors.city} placeholder="Jakarta" />
                <Field label="Country" value={form.country} onChange={v => set("country", v)} placeholder="Indonesia" />
              </div>
            )}

            {/* STEP 2: Venue */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Venue Details</h2>
                <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>Set up your venue's identity.</p>
                <Field label="Venue Name" value={form.venue_name} onChange={setVenueName} error={errors.venue_name} placeholder="Tom's Padel" />
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>URL Handle (slug)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      value={form.slug}
                      onChange={e => set("slug", slugify(e.target.value))}
                      style={{ ...inputStyle, paddingRight: 36 }}
                      placeholder="tomspadel"
                    />
                    <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
                      {slugStatus === "checking" && <Loader2 size={16} color="#999" className="animate-spin" />}
                      {slugStatus === "available" && <Check size={16} color="#00E676" />}
                      {slugStatus === "taken" && <X size={16} color="#FF4444" />}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: slugStatus === "taken" ? "#FF4444" : "#999", marginTop: 4 }}>
                    {slugStatus === "taken"
                      ? "This slug is already taken"
                      : <>Your venue will be at <strong>superfans.games/{form.slug || "..."}</strong></>}
                  </div>
                  {errors.slug && <div style={errorStyle}>{errors.slug}</div>}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Number of Courts</label>
                  <input type="number" min={1} max={10} value={form.courts} onChange={e => set("courts", parseInt(e.target.value) || 1)} style={inputStyle} />
                  {errors.courts && <div style={errorStyle}>{errors.courts}</div>}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Primary Color</label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input type="color" value={form.primary_color} onChange={e => set("primary_color", e.target.value)} style={{ width: 48, height: 40, border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", padding: 2 }} />
                    <input value={form.primary_color} onChange={e => set("primary_color", e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="#00E676" />
                  </div>
                  <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: form.primary_color }} />
                </div>
              </div>
            )}

            {/* STEP 3: Prize */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Prize Configuration</h2>
                <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>Set your monthly prize pool and how it's distributed.</p>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Monthly Prize Pool (IDR)</label>
                  <input type="number" value={form.monthly_prize} onChange={e => set("monthly_prize", parseInt(e.target.value) || 0)} style={inputStyle} />
                  <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{fmtRp(form.monthly_prize)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>🥇 1st %</label>
                    <input type="number" min={0} max={100} value={form.prize_split_1st} onChange={e => set("prize_split_1st", parseInt(e.target.value) || 0)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>🥈 2nd %</label>
                    <input type="number" min={0} max={100} value={form.prize_split_2nd} onChange={e => set("prize_split_2nd", parseInt(e.target.value) || 0)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>🥉 3rd %</label>
                    <input type="number" min={0} max={100} value={form.prize_split_3rd} onChange={e => set("prize_split_3rd", parseInt(e.target.value) || 0)} style={inputStyle} />
                  </div>
                </div>
                {errors.prize_split && <div style={errorStyle}>{errors.prize_split}</div>}
                <div style={{ background: "#f8f8f8", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Prize Breakdown</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                    <span>🥇 1st Place</span>
                    <strong>{fmtRp(Math.round(form.monthly_prize * form.prize_split_1st / 100))}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                    <span>🥈 2nd Place</span>
                    <strong>{fmtRp(Math.round(form.monthly_prize * form.prize_split_2nd / 100))}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>🥉 3rd Place</span>
                    <strong>{fmtRp(Math.round(form.monthly_prize * form.prize_split_3rd / 100))}</strong>
                  </div>
                </div>
                <div style={{ background: "#FFF8E1", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#996600" }}>
                  💡 10% platform fee applies to all support pools
                </div>
              </div>
            )}

            {/* STEP 4: Admin */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admin Setup</h2>
                <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>Secure your venue's admin access.</p>
                <Field label="Admin Password" value={form.admin_password} onChange={v => set("admin_password", v)} error={errors.admin_password} placeholder="Min 8 characters" type="password" />
                <Field label="Confirm Password" value={form.confirm_password} onChange={v => set("confirm_password", v)} error={errors.confirm_password} placeholder="Re-enter password" type="password" />
                <Field label="Logo URL (optional)" value={form.logo_url} onChange={v => set("logo_url", v)} placeholder="https://..." />
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.agree_terms} onChange={e => set("agree_terms", e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: "#111" }} />
                    <span style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>
                      I agree that all sessions are subject to platform approval and that SuperFans may suspend venue access for policy violations.
                    </span>
                  </label>
                  {errors.agree_terms && <div style={errorStyle}>{errors.agree_terms}</div>}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {errors.submit && (
          <div style={{ background: "#FFF0F0", border: "1px solid #ffcccc", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#cc0000", marginTop: 16 }}>
            {errors.submit}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <button onClick={back} disabled={step === 0} style={{ ...navBtn, opacity: step === 0 ? 0.3 : 1 }}>
            <ChevronLeft size={16} /> Back
          </button>
          {step < 3 ? (
            <button onClick={next} style={{ ...navBtn, background: "#111", color: "#fff" }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{ ...navBtn, background: "#111", color: "#fff", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FIELD COMPONENT ──────────────────────────────────
function Field({ label, value, onChange, error, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; placeholder?: string; type?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  border: "1px solid #ddd", fontSize: 16, outline: "none",
  background: "#fafafa", transition: "border .2s",
  boxSizing: "border-box",
  WebkitAppearance: "none",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: "#FF4444", marginTop: 4,
};

const navBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
  border: "1px solid #ddd", background: "#fff", color: "#333", cursor: "pointer",
  flex: 1, maxWidth: 180,
};

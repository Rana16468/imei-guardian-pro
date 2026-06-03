import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Smartphone, Users, Receipt } from "lucide-react";
import { Sale, addSale, nextInvoiceNumber } from "@/lib/phone-store";
import { fmt, PageHeader, Metric } from "@/lib/phone-ui";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "New Sale — PhoneTrack" }] }),
  component: NewSale,
});

function NewSale() {
  const nav = useNavigate();
  const [form, setForm] = useState<Sale>(() => ({
    id: crypto.randomUUID(),
    imei: "", barcode: "", brand: "", model: "", variant: "", color: "",
    ram: "", storage: "", purchasePrice: 0, sellingPrice: 0,
    customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
    invoiceNumber: nextInvoiceNumber(), saleDate: new Date().toISOString(),
    quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
    salesPerson: "", warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    notes: "", ownership: [],
  }));
  const set = <K extends keyof Sale>(k: K, v: Sale[K]) => setForm((f) => ({ ...f, [k]: v }));

  const finalPrice = useMemo(() => Math.max(0, (form.sellingPrice || 0) - (form.discount || 0)), [form.sellingPrice, form.discount]);
  const profitAmt = finalPrice - (form.purchasePrice || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imei || !form.customerName) { alert("IMEI and Customer Name are required"); return; }
    addSale({
      ...form, finalPrice,
      warrantyExpiry: new Date(form.warrantyExpiry).toISOString(),
      ownership: [{ owner: form.customerName, phone: form.customerPhone, transferDate: new Date().toISOString(), note: "First buyer" }],
    });
    nav({ to: "/" });
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
      <PageHeader title="New Sale" subtitle="Record a phone sale with full traceability" />
      <form onSubmit={submit} className="space-y-5">
        <Section title="Phone Information" icon={Smartphone}>
          <Field label="IMEI Number *"><Input value={form.imei} onChange={(e) => set("imei", e.target.value)} required /></Field>
          <Field label="Barcode"><Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} /></Field>
          <Field label="Brand"><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Apple, Samsung..." /></Field>
          <Field label="Model"><Input value={form.model} onChange={(e) => set("model", e.target.value)} /></Field>
          <Field label="Variant"><Input value={form.variant} onChange={(e) => set("variant", e.target.value)} /></Field>
          <Field label="Color"><Input value={form.color} onChange={(e) => set("color", e.target.value)} /></Field>
          <Field label="RAM"><Input value={form.ram} onChange={(e) => set("ram", e.target.value)} placeholder="8GB" /></Field>
          <Field label="Storage"><Input value={form.storage} onChange={(e) => set("storage", e.target.value)} placeholder="256GB" /></Field>
          <Field label="Purchase Price"><Input type="number" value={form.purchasePrice || ""} onChange={(e) => set("purchasePrice", +e.target.value)} /></Field>
          <Field label="Selling Price"><Input type="number" value={form.sellingPrice || ""} onChange={(e) => set("sellingPrice", +e.target.value)} /></Field>
        </Section>

        <Section title="Customer Information" icon={Users}>
          <Field label="Customer Name *"><Input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} required /></Field>
          <Field label="Phone Number"><Input value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} /></Field>
          <Field label="Alternative Phone"><Input value={form.altPhone} onChange={(e) => set("altPhone", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="NID Number"><Input value={form.nid} onChange={(e) => set("nid", e.target.value)} /></Field>
          <Field label="Address" wide><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
        </Section>

        <Section title="Sale Information" icon={Receipt}>
          <Field label="Invoice Number"><Input value={form.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} /></Field>
          <Field label="Sale Date"><Input type="datetime-local" value={form.saleDate.slice(0, 16)} onChange={(e) => set("saleDate", new Date(e.target.value).toISOString())} /></Field>
          <Field label="Quantity"><Input type="number" value={form.quantity} onChange={(e) => set("quantity", +e.target.value)} /></Field>
          <Field label="Discount Amount"><Input type="number" value={form.discount || ""} onChange={(e) => set("discount", +e.target.value)} /></Field>
          <Field label="Final Selling Price"><Input value={fmt(finalPrice)} readOnly className="input bg-muted" /></Field>
          <Field label="Payment Method">
            <select className="input" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {["Cash", "Card", "Mobile Banking", "Bank Transfer", "Installment"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Sales Person"><Input value={form.salesPerson} onChange={(e) => set("salesPerson", e.target.value)} /></Field>
          <Field label="Warranty Expiry"><Input type="date" value={form.warrantyExpiry.slice(0, 10)} onChange={(e) => set("warrantyExpiry", e.target.value)} /></Field>
          <Field label="Notes" wide><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </Section>

        <div className="bg-accent/40 rounded-xl border border-primary/20 p-5 flex flex-wrap gap-6 items-center justify-between sticky bottom-4">
          <div className="flex gap-8">
            <Metric label="Final Price" value={fmt(finalPrice)} />
            <Metric label="Profit" value={fmt(profitAmt)} positive={profitAmt >= 0} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => nav({ to: "/" })} className="px-4 py-2.5 rounded-md border text-sm">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2">
              <Receipt className="size-4" /> Complete Sale
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border">
      <div className="px-5 py-3.5 border-b flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className || ""}`} />;
}

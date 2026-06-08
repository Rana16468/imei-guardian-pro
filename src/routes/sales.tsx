import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Smartphone, Users, Receipt, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Sale, addSale, loadSales, saveSales, nextInvoiceNumber } from "@/lib/phone-store";
import { fmt, PageHeader, Metric } from "@/lib/phone-ui";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Stock & Sales — PhoneTrack" }] }),
  component: StockPage,
});

type StockExtra = { buyerName: string; buyerPhone: string };
type StockSale = Sale & StockExtra;

const blankForm = (): StockSale => ({
  id: crypto.randomUUID(),
  imei: "", barcode: "", brand: "", model: "", variant: "", color: "",
  ram: "", storage: "", purchasePrice: 0, sellingPrice: 0,
  customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
  invoiceNumber: nextInvoiceNumber(), saleDate: new Date().toISOString(),
  quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
  salesPerson: "", warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  notes: "", ownership: [],
  buyerName: "", buyerPhone: "",
});

function StockPage() {
  const [form, setForm] = useState<StockSale>(blankForm);
  const [rows, setRows] = useState<StockSale[]>(() => loadSales() as StockSale[]);
  const [openId, setOpenId] = useState<string | null>(null);

  const set = <K extends keyof StockSale>(k: K, v: StockSale[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const finalPrice = useMemo(
    () => Math.max(0, (form.sellingPrice || 0) - (form.discount || 0)),
    [form.sellingPrice, form.discount]
  );
  const profitAmt = finalPrice - (form.purchasePrice || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imei) { alert("IMEI is required"); return; }
    const record: StockSale = {
      ...form, finalPrice,
      warrantyExpiry: new Date(form.warrantyExpiry).toISOString(),
      ownership: form.customerName
        ? [{ owner: form.customerName, phone: form.customerPhone, transferDate: new Date().toISOString(), note: "First buyer" }]
        : [],
    };
    addSale(record);
    setRows([record, ...rows]);
    setForm(blankForm());
  };

  const remove = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next);
    saveSales(next);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      <PageHeader title="Stock & Sales" subtitle="Add phone stock, then expand a row to record customer & sale details" />

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
          <Field label="Buyer Name (Supplier)"><Input value={form.buyerName} onChange={(e) => set("buyerName", e.target.value)} placeholder="Whom did you buy from" /></Field>
          <Field label="Buyer Phone Number"><Input value={form.buyerPhone} onChange={(e) => set("buyerPhone", e.target.value)} /></Field>
        </Section>

        <div className="bg-accent/40 rounded-xl border border-primary/20 p-5 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex gap-8">
            <Metric label="Final Price" value={fmt(finalPrice)} />
            <Metric label="Profit" value={fmt(profitAmt)} positive={profitAmt >= 0} />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2">
            <Plus className="size-4" /> Add to Stock
          </button>
        </div>
      </form>

      <div className="mt-8 bg-card rounded-xl border overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2"><Receipt className="size-4 text-primary" /> Stock List</h3>
          <span className="text-xs text-muted-foreground">{rows.length} item(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">IMEI</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Buyer (Supplier)</th>
                <th className="p-3 text-right">Purchase</th>
                <th className="p-3 text-right">Selling</th>
                <th className="p-3 text-center">Seller Info</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No stock yet. Add your first phone above.</td></tr>
              )}
              {rows.map((r) => {
                const open = openId === r.id;
                return (
                  <FragmentRow key={r.id}>
                    <tr className="border-t hover:bg-accent/30">
                      <td className="p-3 font-mono text-xs">{r.invoiceNumber}</td>
                      <td className="p-3 font-mono text-xs">{r.imei}</td>
                      <td className="p-3">{r.brand} {r.model}<div className="text-xs text-muted-foreground">{r.ram} · {r.storage} · {r.color}</div></td>
                      <td className="p-3">{r.buyerName || "—"}<div className="text-xs text-muted-foreground">{r.buyerPhone}</div></td>
                      <td className="p-3 text-right">{fmt(r.purchasePrice)}</td>
                      <td className="p-3 text-right font-medium">{fmt(r.finalPrice || r.sellingPrice)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setOpenId(open ? null : r.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs hover:bg-accent">
                          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                          Seller Info
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => remove(r.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-muted/30">
                        <td colSpan={8} className="p-5">
                          <SellerInfoPanel row={r} onSave={(patch) => {
                            const next = rows.map((x) => x.id === r.id ? { ...x, ...patch } : x);
                            setRows(next); saveSales(next);
                          }} />
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SellerInfoPanel({ row, onSave }: { row: StockSale; onSave: (patch: Partial<StockSale>) => void }) {
  const [f, setF] = useState<StockSale>(row);
  const set = <K extends keyof StockSale>(k: K, v: StockSale[K]) => setF((p) => ({ ...p, [k]: v }));
  const finalPrice = Math.max(0, (f.sellingPrice || 0) - (f.discount || 0));

  const save = () => {
    onSave({
      customerName: f.customerName, customerPhone: f.customerPhone, nid: f.nid, address: f.address,
      saleDate: f.saleDate, quantity: f.quantity, discount: f.discount, finalPrice,
      paymentMethod: f.paymentMethod, salesPerson: f.salesPerson,
      warrantyExpiry: new Date(f.warrantyExpiry).toISOString(), notes: f.notes,
      ownership: f.customerName
        ? [{ owner: f.customerName, phone: f.customerPhone, transferDate: new Date().toISOString(), note: "First buyer" }]
        : [],
    });
    alert("Seller info saved");
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="size-3.5 text-primary" /> Customer Information
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Customer Name *"><Input value={f.customerName} onChange={(e) => set("customerName", e.target.value)} /></Field>
          <Field label="Phone Number"><Input value={f.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} /></Field>
          <Field label="NID Number (optional)"><Input value={f.nid} onChange={(e) => set("nid", e.target.value)} /></Field>
          <Field label="Address" wide><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Receipt className="size-3.5 text-primary" /> Sale Information
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Sale Date"><Input type="datetime-local" value={f.saleDate.slice(0, 16)} onChange={(e) => set("saleDate", new Date(e.target.value).toISOString())} /></Field>
          <Field label="Quantity"><Input type="number" value={f.quantity} onChange={(e) => set("quantity", +e.target.value)} /></Field>
          <Field label="Discount Amount"><Input type="number" value={f.discount || ""} onChange={(e) => set("discount", +e.target.value)} /></Field>
          <Field label="Final Selling Price"><Input readOnly value={fmt(finalPrice)} className="bg-muted" /></Field>
          <Field label="Payment Method">
            <select className="input" value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {["Cash", "Card", "Mobile Banking", "Bank Transfer", "Installment"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Sales Person"><Input value={f.salesPerson} onChange={(e) => set("salesPerson", e.target.value)} /></Field>
          <Field label="Warranty Expiry"><Input type="date" value={f.warrantyExpiry.slice(0, 10)} onChange={(e) => set("warrantyExpiry", e.target.value)} /></Field>
          <Field label="Notes" wide><Input value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
          Save Seller Info
        </button>
      </div>
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

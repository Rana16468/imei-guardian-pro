import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, ChevronDown, ChevronUp, Receipt, Users, FileText, Printer, ShoppingCart, X } from "lucide-react";
import { Sale, loadSales, saveSales } from "@/lib/phone-store";
import { fmt, PageHeader } from "@/lib/phone-ui";

export const Route = createFileRoute("/new-sale")({
  head: () => ({ meta: [{ title: "New Sale — PhoneTrack" }] }),
  component: NewSalePage,
});

type StockSale = Sale & { buyerName?: string; buyerPhone?: string };

function NewSalePage() {
  const [rows, setRows] = useState<StockSale[]>(() => loadSales() as StockSale[]);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [invoiceFor, setInvoiceFor] = useState<StockSale | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.imei.toLowerCase().includes(s) ||
      r.brand.toLowerCase().includes(s) ||
      r.model.toLowerCase().includes(s) ||
      r.customerName.toLowerCase().includes(s) ||
      r.customerPhone.toLowerCase().includes(s) ||
      r.invoiceNumber.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const updateRow = (id: string, patch: Partial<StockSale>) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next); saveSales(next);
  };

  const sold = rows.filter((r) => r.customerName).length;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PageHeader title="New Sale" subtitle="Record customer details for stocked phones and generate invoices" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Stat label="Total Stock" value={rows.length} icon={ShoppingCart} />
        <Stat label="Sold" value={sold} icon={Receipt} />
        <Stat label="Available" value={rows.length - sold} icon={FileText} />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-medium flex items-center gap-2"><Receipt className="size-4 text-primary" /> Sales Table</h3>
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by IMEI, customer, phone, invoice, brand..."
              className="w-full pl-9 pr-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} result(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Invoice</th>
                <th className="p-3 text-left">IMEI</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No matching records.</td></tr>
              )}
              {filtered.map((r) => {
                const open = openId === r.id;
                const isSold = !!r.customerName;
                return (
                  <FragmentRow key={r.id}>
                    <tr className="border-t hover:bg-accent/30">
                      <td className="p-3 font-mono text-xs">{r.invoiceNumber}</td>
                      <td className="p-3 font-mono text-xs">{r.imei}</td>
                      <td className="p-3">{r.brand} {r.model}<div className="text-xs text-muted-foreground">{r.ram} · {r.storage} · {r.color}</div></td>
                      <td className="p-3">{r.customerName || <span className="text-muted-foreground">—</span>}<div className="text-xs text-muted-foreground">{r.customerPhone}</div></td>
                      <td className="p-3 text-right font-medium">{fmt(r.finalPrice || r.sellingPrice)}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isSold ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                          {isSold ? "Sold" : "Available"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-1.5">
                          <button onClick={() => setOpenId(open ? null : r.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs hover:bg-accent">
                            {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            Seller Info
                          </button>
                          <button onClick={() => setInvoiceFor(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90">
                            <FileText className="size-3.5" /> Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="bg-muted/30">
                        <td colSpan={7} className="p-5">
                          <SellerInfoPanel row={r} onSave={(patch) => updateRow(r.id, patch)} />
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

      {invoiceFor && <InvoiceModal sale={invoiceFor} onClose={() => setInvoiceFor(null)} />}
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
      <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  );
}

function SellerInfoPanel({ row, onSave }: { row: StockSale; onSave: (patch: Partial<StockSale>) => void }) {
  const [f, setF] = useState<StockSale>(row);
  const set = <K extends keyof StockSale>(k: K, v: StockSale[K]) => setF((p) => ({ ...p, [k]: v }));
  const finalPrice = Math.max(0, (f.sellingPrice || 0) - (f.discount || 0));

  const save = () => {
    onSave({
      customerName: f.customerName, customerPhone: f.customerPhone, altPhone: f.altPhone,
      email: f.email, nid: f.nid, address: f.address,
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
          <Field label="Alt Phone"><Input value={f.altPhone} onChange={(e) => set("altPhone", e.target.value)} /></Field>
          <Field label="Email (optional)"><Input value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="NID Number (optional)"><Input value={f.nid} onChange={(e) => set("nid", e.target.value)} /></Field>
          <Field label="Address"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Receipt className="size-3.5 text-primary" /> Sale Information
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Sale Date"><Input type="datetime-local" value={(f.saleDate || new Date().toISOString()).slice(0, 16)} onChange={(e) => set("saleDate", new Date(e.target.value).toISOString())} /></Field>
          <Field label="Quantity"><Input type="number" value={f.quantity} onChange={(e) => set("quantity", +e.target.value)} /></Field>
          <Field label="Discount Amount"><Input type="number" value={f.discount || ""} onChange={(e) => set("discount", +e.target.value)} /></Field>
          <Field label="Final Selling Price"><Input readOnly value={fmt(finalPrice)} className="bg-muted" /></Field>
          <Field label="Payment Method">
            <select className="input" value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {["Cash", "Card", "Mobile Banking", "Bank Transfer", "Installment"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Sales Person"><Input value={f.salesPerson} onChange={(e) => set("salesPerson", e.target.value)} /></Field>
          <Field label="Warranty Expiry"><Input type="date" value={(f.warrantyExpiry || new Date().toISOString()).slice(0, 10)} onChange={(e) => set("warrantyExpiry", e.target.value)} /></Field>
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

function InvoiceModal({ sale, onClose }: { sale: StockSale; onClose: () => void }) {
  const finalPrice = sale.finalPrice || sale.sellingPrice;
  const subtotal = sale.sellingPrice * (sale.quantity || 1);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[92vh] overflow-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card print:hidden">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="size-4 text-primary" /> Invoice Preview</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs">
              <Printer className="size-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X className="size-4" /></button>
          </div>
        </div>
        <div className="p-8 space-y-6 print:p-6">
          <div className="flex justify-between items-start border-b pb-5">
            <div>
              <div className="text-2xl font-bold tracking-tight">PhoneTrack</div>
              <div className="text-xs text-muted-foreground">IMEI Sales Module</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground">Invoice</div>
              <div className="font-mono font-semibold">{sale.invoiceNumber}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(sale.saleDate).toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1.5">Bill To</div>
              <div className="font-medium">{sale.customerName || "—"}</div>
              <div className="text-sm text-muted-foreground">{sale.customerPhone}</div>
              {sale.email && <div className="text-sm text-muted-foreground">{sale.email}</div>}
              {sale.address && <div className="text-sm text-muted-foreground">{sale.address}</div>}
              {sale.nid && <div className="text-xs text-muted-foreground mt-1">NID: {sale.nid}</div>}
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1.5">Sale Details</div>
              <Row k="Sales Person" v={sale.salesPerson || "—"} />
              <Row k="Payment" v={sale.paymentMethod} />
              <Row k="Warranty Until" v={new Date(sale.warrantyExpiry).toLocaleDateString()} />
            </div>
          </div>

          <table className="w-full text-sm border-t border-b">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="text-left py-2">Item</th>
                <th className="text-left py-2">IMEI</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Unit</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-3">
                  <div className="font-medium">{sale.brand} {sale.model}</div>
                  <div className="text-xs text-muted-foreground">{sale.variant} · {sale.color} · {sale.ram} / {sale.storage}</div>
                </td>
                <td className="py-3 font-mono text-xs">{sale.imei}</td>
                <td className="py-3 text-center">{sale.quantity || 1}</td>
                <td className="py-3 text-right">{fmt(sale.sellingPrice)}</td>
                <td className="py-3 text-right font-medium">{fmt(subtotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <Line k="Subtotal" v={fmt(subtotal)} />
              <Line k="Discount" v={`- ${fmt(sale.discount || 0)}`} />
              <div className="border-t pt-2 mt-1">
                <Line k="Total Due" v={fmt(finalPrice)} bold />
              </div>
            </div>
          </div>

          {sale.notes && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              <span className="font-medium">Notes: </span>{sale.notes}
            </div>
          )}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="text-sm flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-semibold text-base" : ""}`}><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
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

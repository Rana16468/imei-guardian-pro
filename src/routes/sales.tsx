import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Smartphone, Receipt, Plus, Trash2, Pencil, Check, X, Search as SearchIcon } from "lucide-react";
import { Sale, addSale, loadSales, saveSales, nextInvoiceNumber } from "@/lib/phone-store";
import { fmt, PageHeader, Metric } from "@/lib/phone-ui";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Add Stock — PhoneTrack" }] }),
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
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<StockSale | null>(null);
  const [q, setQ] = useState("");

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
    const record: StockSale = { ...form, finalPrice: form.sellingPrice };
    addSale(record);
    setRows([record, ...rows]);
    setForm(blankForm());
  };

  const remove = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const next = rows.filter((r) => r.id !== id);
    setRows(next); saveSales(next);
  };

  const startEdit = (r: StockSale) => { setEditId(r.id); setDraft({ ...r }); };
  const cancelEdit = () => { setEditId(null); setDraft(null); };
  const saveEdit = () => {
    if (!draft) return;
    const next = rows.map((r) => r.id === draft.id ? draft : r);
    setRows(next); saveSales(next);
    cancelEdit();
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.imei.toLowerCase().includes(s) ||
      r.brand.toLowerCase().includes(s) ||
      r.model.toLowerCase().includes(s) ||
      r.buyerName.toLowerCase().includes(s) ||
      r.invoiceNumber.toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      <PageHeader title="Add Stock" subtitle="Register new phones into your inventory" />

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
            <Metric label="Selling Price" value={fmt(form.sellingPrice || 0)} />
            <Metric label="Expected Profit" value={fmt(profitAmt)} positive={profitAmt >= 0} />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2">
            <Plus className="size-4" /> Add to Stock
          </button>
        </div>
      </form>

      <div className="mt-8 bg-card rounded-xl border overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-medium flex items-center gap-2"><Receipt className="size-4 text-primary" /> Stock List</h3>
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search IMEI, brand, model, buyer..."
              className="w-full pl-9 pr-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} item(s)</span>
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
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No stock yet. Add your first phone above.</td></tr>
              )}
              {filtered.map((r) => {
                const editing = editId === r.id && draft;
                if (editing) {
                  return (
                    <tr key={r.id} className="border-t bg-accent/30">
                      <td className="p-3 font-mono text-xs">{r.invoiceNumber}</td>
                      <td className="p-2"><Input value={draft!.imei} onChange={(e) => setDraft({ ...draft!, imei: e.target.value })} /></td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Input value={draft!.brand} onChange={(e) => setDraft({ ...draft!, brand: e.target.value })} placeholder="Brand" />
                          <Input value={draft!.model} onChange={(e) => setDraft({ ...draft!, model: e.target.value })} placeholder="Model" />
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Input value={draft!.buyerName} onChange={(e) => setDraft({ ...draft!, buyerName: e.target.value })} placeholder="Name" />
                          <Input value={draft!.buyerPhone} onChange={(e) => setDraft({ ...draft!, buyerPhone: e.target.value })} placeholder="Phone" />
                        </div>
                      </td>
                      <td className="p-2"><Input type="number" value={draft!.purchasePrice} onChange={(e) => setDraft({ ...draft!, purchasePrice: +e.target.value })} /></td>
                      <td className="p-2"><Input type="number" value={draft!.sellingPrice} onChange={(e) => setDraft({ ...draft!, sellingPrice: +e.target.value })} /></td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-1">
                          <button onClick={saveEdit} className="p-1.5 rounded bg-primary text-primary-foreground"><Check className="size-4" /></button>
                          <button onClick={cancelEdit} className="p-1.5 rounded border"><X className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={r.id} className="border-t hover:bg-accent/30">
                    <td className="p-3 font-mono text-xs">{r.invoiceNumber}</td>
                    <td className="p-3 font-mono text-xs">{r.imei}</td>
                    <td className="p-3">{r.brand} {r.model}<div className="text-xs text-muted-foreground">{r.ram} · {r.storage} · {r.color}</div></td>
                    <td className="p-3">{r.buyerName || "—"}<div className="text-xs text-muted-foreground">{r.buyerPhone}</div></td>
                    <td className="p-3 text-right">{fmt(r.purchasePrice)}</td>
                    <td className="p-3 text-right font-medium">{fmt(r.sellingPrice)}</td>
                    <td className="p-3 text-center">
                      <div className="inline-flex gap-1">
                        <button onClick={() => startEdit(r)} className="p-1.5 rounded border hover:bg-accent" title="Edit"><Pencil className="size-4" /></button>
                        <button onClick={() => remove(r.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

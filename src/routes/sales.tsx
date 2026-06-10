import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Smartphone, Receipt, Plus, Trash2, Pencil, Check, X, Search as SearchIcon, Eye, Info, User, DollarSign } from "lucide-react";
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
  const [viewItem, setViewItem] = useState<StockSale | null>(null);

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

      <form onSubmit={submit} className="bg-card rounded-xl border overflow-hidden shadow-sm">
        {/* Form Header */}
        <div className="px-6 py-4 border-b flex items-center gap-2.5 bg-muted/20">
          <Smartphone className="size-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Register New Phone</h3>
            <p className="text-xs text-muted-foreground">Enter phone specs, purchase price, and supplier info</p>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Field label="IMEI Number *">
            <Input
              value={form.imei}
              onChange={(e) => set("imei", e.target.value)}
              placeholder="Enter 15-digit IMEI"
              required
            />
          </Field>
          <Field label="Barcode">
            <Input
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              placeholder="Scan or enter barcode"
            />
          </Field>
          <Field label="Phone Brand *">
            <div className="flex flex-col gap-2">
              <select
                className="input cursor-pointer"
                value={
                  ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Motorola", "Infinix", "Tecno", "Nokia"].includes(form.brand)
                    ? form.brand
                    : form.brand
                      ? "Add New Brand"
                      : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Add New Brand") {
                    set("brand", "Add New Brand");
                  } else {
                    set("brand", val);
                  }
                }}
                required
              >
                <option value="">Select Brand</option>
                {["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Motorola", "Infinix", "Tecno", "Nokia"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Add New Brand">+ Add New Brand</option>
              </select>
              {(!["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Motorola", "Infinix", "Tecno", "Nokia"].includes(form.brand) && form.brand !== "") && (
                <Input
                  value={form.brand === "Add New Brand" ? "" : form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="Type custom brand name..."
                  required
                />
              )}
            </div>
          </Field>
          <Field label="Phone Model *">
            <Input
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="e.g. iPhone 15 Pro, Galaxy S24"
              required
            />
          </Field>
          <Field label="Variant">
            <Input
              value={form.variant}
              onChange={(e) => set("variant", e.target.value)}
              placeholder="e.g. USA, Global, LLA"
            />
          </Field>
          <Field label="Color">
            <Input
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="e.g. Titanium Gray, Onyx Black"
            />
          </Field>
          <Field label="RAM">
            <Input
              value={form.ram}
              onChange={(e) => set("ram", e.target.value)}
              placeholder="e.g. 8GB, 12GB"
            />
          </Field>
          <Field label="Storage">
            <Input
              value={form.storage}
              onChange={(e) => set("storage", e.target.value)}
              placeholder="e.g. 128GB, 256GB"
            />
          </Field>
          <Field label="Purchase Price *">
            <Input
              type="number"
              value={form.purchasePrice || ""}
              onChange={(e) => set("purchasePrice", +e.target.value)}
              placeholder="Cost price"
              required
            />
          </Field>
          <Field label="Min Selling Price *">
            <Input
              type="number"
              value={form.sellingPrice || ""}
              onChange={(e) => set("sellingPrice", +e.target.value)}
              placeholder="Target selling price"
              required
            />
          </Field>
          <Field label="Supplier Name">
            <Input
              value={form.buyerName}
              onChange={(e) => set("buyerName", e.target.value)}
              placeholder="Whom did you buy from"
            />
          </Field>
          <Field label="Supplier Phone">
            <Input
              value={form.buyerPhone}
              onChange={(e) => set("buyerPhone", e.target.value)}
              placeholder="Supplier contact number"
            />
          </Field>
        </div>

        {/* Unified Action Footer */}
        <div className="px-6 py-4.5 bg-muted/30 border-t flex flex-wrap gap-5 items-center justify-between">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Expected Profit</span>
              <span className={`text-xl font-bold ${profitAmt >= 0 ? "text-success" : "text-destructive"}`}>
                {fmt(profitAmt)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Markup Margin</span>
              <span className="text-xl font-bold text-foreground">
                {form.sellingPrice > 0 ? ((profitAmt / form.sellingPrice) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Plus className="size-4.5" /> Add Device to Stock
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
                <th className="p-3 text-left">Supplier</th>
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
                return (
                  <tr key={r.id} onClick={() => setViewItem(r)} className="border-t hover:bg-accent/20 cursor-pointer transition-colors">
                    <td className="p-3 font-mono text-xs text-primary font-medium">{r.invoiceNumber}</td>
                    <td className="p-3 font-mono text-xs">{r.imei}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{r.brand} {r.model}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{r.ram} · {r.storage} · {r.color}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-foreground">{r.buyerName || "—"}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{r.buyerPhone}</div>
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{fmt(r.purchasePrice)}</td>
                    <td className="p-3 text-right font-semibold text-foreground">{fmt(r.sellingPrice)}</td>
                    <td className="p-3 text-center">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewItem(r); }}
                          className="p-1.5 rounded-md border hover:bg-accent transition-all cursor-pointer shadow-sm hover:border-primary/30"
                          title="View specifications"
                        >
                          <Eye className="size-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(r); }}
                          className="p-1.5 rounded-md border hover:bg-accent transition-all cursor-pointer shadow-sm hover:border-primary/30"
                          title="Edit specifications"
                        >
                          <Pencil className="size-4 text-foreground" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                          title="Delete from stock"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewItem && (
        <StockDetailModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => {
            startEdit(viewItem);
            setViewItem(null);
          }}
        />
      )}

      {editId && draft && (
        <EditStockModal
          draft={draft}
          onChange={setDraft}
          onSave={saveEdit}
          onClose={cancelEdit}
        />
      )}
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

function StockDetailModal({
  item,
  onClose,
  onEdit,
}: {
  item: StockSale;
  onClose: () => void;
  onEdit: () => void;
}) {
  const isSold = !!item.customerName;
  const profitAmt = item.sellingPrice - item.purchasePrice;
  const margin = item.sellingPrice > 0 ? ((profitAmt / item.sellingPrice) * 100).toFixed(1) : "0.0";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border transition-all animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-muted/20">
          <h3 className="font-semibold text-lg flex items-center gap-2.5 text-foreground">
            <Smartphone className="size-5 text-primary" />
            Device Details
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</span>
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${isSold ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
              {isSold ? "Sold" : "Available in Stock"}
            </span>
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <Info className="size-3.5 text-primary" /> Specifications
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Brand / Model" value={`${item.brand} ${item.model}`} />
              <DetailField label="IMEI" value={item.imei} isMono />
              <DetailField label="Variant / Color" value={`${item.variant || "—"} · ${item.color || "—"}`} />
              <DetailField label="RAM / Storage" value={`${item.ram || "—"} / ${item.storage || "—"}`} />
              <DetailField label="Barcode" value={item.barcode || "—"} isMono />
              <DetailField label="Added On" value={new Date(item.saleDate).toLocaleDateString()} />
            </div>
          </div>

          {/* Supplier Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <User className="size-3.5 text-primary" /> Supplier Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Supplier Name" value={item.buyerName || "—"} />
              <DetailField label="Supplier Contact" value={item.buyerPhone || "—"} />
            </div>
          </div>

          {/* Pricing Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <DollarSign className="size-3.5 text-primary" /> Pricing & Profit
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Purchase Cost</div>
                <div className="text-sm font-bold text-foreground mt-1">{fmt(item.purchasePrice)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Target Min Sell</div>
                <div className="text-sm font-bold text-foreground mt-1">{fmt(item.sellingPrice)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Expected Profit</div>
                <div className={`text-sm font-bold mt-1 ${profitAmt >= 0 ? "text-success" : "text-destructive"}`}>
                  {fmt(profitAmt)} ({margin}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t bg-muted/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-muted font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
          {!isSold && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Pencil className="size-4" /> Edit Specs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase font-bold text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium mt-0.5 text-foreground ${isMono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function EditStockModal({
  draft,
  onSave,
  onClose,
  onChange,
}: {
  draft: StockSale;
  onSave: () => void;
  onClose: () => void;
  onChange: (d: StockSale) => void;
}) {
  const setDraftVal = <K extends keyof StockSale>(k: K, v: StockSale[K]) => {
    onChange({ ...draft, [k]: v });
  };

  const profitAmt = draft.sellingPrice - draft.purchasePrice;
  const margin = draft.sellingPrice > 0 ? ((profitAmt / draft.sellingPrice) * 100).toFixed(1) : "0.0";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border transition-all animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-muted/20">
          <h3 className="font-semibold text-lg flex items-center gap-2.5 text-foreground">
            <Pencil className="size-5 text-primary" />
            Edit Phone Specifications
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="IMEI Number *">
            <Input
              value={draft.imei}
              onChange={(e) => setDraftVal("imei", e.target.value)}
              placeholder="Enter 15-digit IMEI"
              required
            />
          </Field>
          <Field label="Barcode">
            <Input
              value={draft.barcode}
              onChange={(e) => setDraftVal("barcode", e.target.value)}
              placeholder="Scan or enter barcode"
            />
          </Field>
          <Field label="Phone Brand *">
            <div className="flex flex-col gap-2">
              <select
                className="input cursor-pointer"
                value={
                  ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Motorola", "Infinix", "Tecno", "Nokia"].includes(draft.brand)
                    ? draft.brand
                    : draft.brand
                      ? "Add New Brand"
                      : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Add New Brand") {
                    setDraftVal("brand", "Add New Brand");
                  } else {
                    setDraftVal("brand", val);
                  }
                }}
                required
              >
                <option value="">Select Brand</option>
                {["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Motorola", "Infinix", "Tecno", "Nokia"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Add New Brand">+ Add New Brand</option>
              </select>
              {(!["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Vivo", "Oppo", "Realme", "Motorola", "Infinix", "Tecno", "Nokia"].includes(draft.brand) && draft.brand !== "") && (
                <Input
                  value={draft.brand === "Add New Brand" ? "" : draft.brand}
                  onChange={(e) => setDraftVal("brand", e.target.value)}
                  placeholder="Type custom brand name..."
                  required
                />
              )}
            </div>
          </Field>
          <Field label="Phone Model *">
            <Input
              value={draft.model}
              onChange={(e) => setDraftVal("model", e.target.value)}
              placeholder="e.g. iPhone 15 Pro, Galaxy S24"
              required
            />
          </Field>
          <Field label="Variant">
            <Input
              value={draft.variant}
              onChange={(e) => setDraftVal("variant", e.target.value)}
              placeholder="e.g. USA, Global, LLA"
            />
          </Field>
          <Field label="Color">
            <Input
              value={draft.color}
              onChange={(e) => setDraftVal("color", e.target.value)}
              placeholder="e.g. Titanium Gray, Onyx Black"
            />
          </Field>
          <Field label="RAM">
            <Input
              value={draft.ram}
              onChange={(e) => setDraftVal("ram", e.target.value)}
              placeholder="e.g. 8GB, 12GB"
            />
          </Field>
          <Field label="Storage">
            <Input
              value={draft.storage}
              onChange={(e) => setDraftVal("storage", e.target.value)}
              placeholder="e.g. 128GB, 256GB"
            />
          </Field>
          <Field label="Purchase Price *">
            <Input
              type="number"
              value={draft.purchasePrice || ""}
              onChange={(e) => setDraftVal("purchasePrice", +e.target.value)}
              placeholder="Cost price"
              required
            />
          </Field>
          <Field label="Min Selling Price *">
            <Input
              type="number"
              value={draft.sellingPrice || ""}
              onChange={(e) => setDraftVal("sellingPrice", +e.target.value)}
              placeholder="Target selling price"
              required
            />
          </Field>
          <Field label="Supplier Name">
            <Input
              value={draft.buyerName}
              onChange={(e) => setDraftVal("buyerName", e.target.value)}
              placeholder="Whom did you buy from"
            />
          </Field>
          <Field label="Supplier Phone">
            <Input
              value={draft.buyerPhone}
              onChange={(e) => setDraftVal("buyerPhone", e.target.value)}
              placeholder="Supplier contact number"
            />
          </Field>
        </div>

        <div className="p-5 border-t bg-muted/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
            <div>Expected Profit: <span className="text-foreground">{fmt(profitAmt)}</span></div>
            <div>Margin: <span className="text-foreground">{margin}%</span></div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-muted font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

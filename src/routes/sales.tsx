import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Smartphone, Receipt, Plus, Trash2, Pencil, Check, X, Search as SearchIcon,
  Eye, Info, User, DollarSign, ShoppingCart, ArrowLeft, ChevronRight, Sparkles,
  ChevronDown, ChevronUp, Printer, Cpu, HardDrive, Palette, Barcode, CheckCircle2,
  BadgeDollarSign
} from "lucide-react";
import { Sale, addSale, loadSales, saveSales, nextInvoiceNumber } from "@/lib/phone-store";
import { fmt, PageHeader, Metric, CustomerMemoModal } from "@/lib/phone-ui";

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

  /* wizard state */
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "customer">("pick");
  const [wizardQ, setWizardQ] = useState("");
  const [pickedPhone, setPickedPhone] = useState<Sale | null>(null);
  const [customerForm, setCustomerForm] = useState<ReturnType<typeof blankCustomer> | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showSuccessMemo, setShowSuccessMemo] = useState(false);
  const [memoSale, setMemoSale] = useState<Sale | null>(null);

  const availablePhones = useMemo(() => {
    const wq = wizardQ.trim().toLowerCase();
    const inStock = rows.filter((r) => !r.customerName);
    if (!wq) return inStock;
    return inStock.filter((r) =>
      r.imei?.toLowerCase().includes(wq) ||
      r.brand?.toLowerCase().includes(wq) ||
      r.model?.toLowerCase().includes(wq) ||
      r.color?.toLowerCase().includes(wq) ||
      r.barcode?.toLowerCase().includes(wq) ||
      r.storage?.toLowerCase().includes(wq)
    );
  }, [rows, wizardQ]);

  const updateRow = (id: string, patch: Partial<Sale>) => {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRows(next as StockSale[]);
    saveSales(next);
  };

  const openWizard = () => {
    setWizardOpen(true);
    setStep("pick");
    setWizardQ("");
    setPickedPhone(null);
    setCustomerForm(null);
    setSuccessId(null);
  };

  const startSale = (phone: Sale) => {
    setPickedPhone(phone);
    setCustomerForm(blankCustomer(phone));
    setStep("customer");
    setWizardOpen(true);
    setSuccessId(null);
  };

  const confirmSale = () => {
    if (!pickedPhone || !customerForm) return;
    if (!customerForm.customerName.trim()) { alert("Customer name is required"); return; }
    const fp = Math.max(0, customerForm.finalPrice || 0);
    const disc = Math.max(0, pickedPhone.sellingPrice - fp);
    const days = Math.max(0, customerForm.warrantyDays || 0);
    const warrantyExpiry = new Date(Date.now() + days * 86400000).toISOString();
    const patch: Partial<Sale> = {
      ...customerForm,
      saleDate: new Date().toISOString(),
      finalPrice: fp,
      discount: disc,
      warrantyExpiry,
      invoiceNumber: nextInvoiceNumber(),
      ownership: [{ owner: customerForm.customerName, phone: customerForm.customerPhone, transferDate: new Date().toISOString(), note: "First buyer" }],
    };
    updateRow(pickedPhone.id, patch);
    setSuccessId(pickedPhone.id);
    setStep("pick"); // reset to show success
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setPickedPhone(null);
    setCustomerForm(null);
    setWizardQ("");
    setSuccessId(null);
  };

  const setCustomer = <K extends keyof ReturnType<typeof blankCustomer>>(
    k: K, v: ReturnType<typeof blankCustomer>[K]
  ) => setCustomerForm((f) => f ? { ...f, [k]: v } : f);

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

  /* scroll pagination state */
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    setVisibleCount(4);
  }, [q]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 20) {
      if (visibleCount < filtered.length) {
        setVisibleCount((prev) => Math.min(prev + 4, filtered.length));
      }
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1280px] mx-auto">
      <PageHeader title="Add Stock" subtitle="Register, edit, sell, and delete devices in inventory">
        <button
          onClick={openWizard}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <ShoppingCart className="size-4.5" />
          Add New Sale
        </button>
      </PageHeader>

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

        <div className="max-h-[380px] overflow-y-auto overflow-x-auto" onScroll={handleScroll}>
          <table className="w-full text-sm">
            <thead className="bg-muted/95 backdrop-blur-sm text-xs uppercase text-muted-foreground sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
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
              {filtered.slice(0, visibleCount).map((r) => {
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
                      <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      
                        <button
                          onClick={() => setViewItem(r)}
                          className="p-1.5 rounded-md border hover:bg-accent transition-all cursor-pointer shadow-sm hover:border-primary/30"
                          title="View specifications"
                        >
                          <Eye className="size-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => startEdit(r)}
                          className="p-1.5 rounded-md border hover:bg-accent transition-all cursor-pointer shadow-sm hover:border-primary/30"
                          title="Edit specifications"
                        >
                          <Pencil className="size-4 text-foreground" />
                        </button>
                        <button
                          onClick={() => remove(r.id)}
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

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t bg-muted/20 text-center text-xs text-muted-foreground flex justify-between items-center select-none">
            <span>Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} items</span>
            {visibleCount < filtered.length ? (
              <span className="animate-pulse flex items-center gap-1 text-primary font-medium">
                <ChevronDown className="size-3.5" /> Scroll down to load more
              </span>
            ) : (
              <span className="text-muted-foreground/60">All items loaded</span>
            )}
          </div>
        )}
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

      {/* ── Add New Sale Wizard ─────────────────────── */}
      {wizardOpen && (
        <NewSaleWizard
          step={step}
          available={availablePhones}
          wizardQ={wizardQ}
          setWizardQ={setWizardQ}
          pickedPhone={pickedPhone}
          customerForm={customerForm}
          setCustomer={setCustomer}
          onPickPhone={startSale}
          onBack={() => setStep("pick")}
          onConfirm={confirmSale}
          onClose={closeWizard}
          successId={successId}
          totalAvailable={availablePhones.length}
          onPrintMemo={() => setShowSuccessMemo(true)}
        />
      )}

      {showSuccessMemo && rows.find((r) => r.id === successId) && (
        <CustomerMemoModal sale={rows.find((r) => r.id === successId)!} onClose={() => setShowSuccessMemo(false)} />
      )}

      {memoSale && (
        <CustomerMemoModal sale={memoSale} onClose={() => setMemoSale(null)} />
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

/* ─── Wizard Helper Functions & Components ───────────────── */
type WizardStep = "pick" | "customer";

function blankCustomer(phone: Sale) {
  return {
    customerName: "",
    customerPhone: "",
    altPhone: "",
    email: "",
    nid: "",
    address: "",
    saleDate: new Date().toISOString(),
    quantity: 1,
    discount: 0,
    finalPrice: phone.sellingPrice,
    paymentMethod: "Cash",
    salesPerson: "",
    warrantyDays: 365,
    warrantyExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
    notes: "",
  };
}

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-primary text-primary-foreground" :
          active ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
            "bg-muted text-muted-foreground"
        }`}>
        {done ? <Check className="size-3.5" /> : n}
      </div>
      <span className={`text-xs font-medium transition-colors ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

function WFormSection({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Icon className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function WField({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function WInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/50 ${props.className || ""}`}
    />
  );
}

function NewSaleWizard({
  step, available, wizardQ, setWizardQ, pickedPhone, customerForm, setCustomer,
  onPickPhone, onBack, onConfirm, onClose, successId, totalAvailable, onPrintMemo,
}: {
  step: WizardStep;
  available: Sale[];
  wizardQ: string;
  setWizardQ: (v: string) => void;
  pickedPhone: Sale | null;
  customerForm: ReturnType<typeof blankCustomer> | null;
  setCustomer: <K extends keyof ReturnType<typeof blankCustomer>>(k: K, v: ReturnType<typeof blankCustomer>[K]) => void;
  onPickPhone: (p: Sale) => void;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
  successId: string | null;
  totalAvailable: number;
  onPrintMemo: () => void;
}) {
  const autoDiscount = pickedPhone && customerForm
    ? Math.max(0, pickedPhone.sellingPrice - (customerForm.finalPrice || 0))
    : 0;
  const displayFinal = customerForm?.finalPrice ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-4.5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">New Sale</h2>
                <p className="text-xs text-muted-foreground">
                  {successId
                    ? "Sale completed successfully"
                    : step === "pick"
                      ? `Select a phone from ${totalAvailable} available`
                      : "Enter customer details"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Step indicator */}
          {!successId && (
            <div className="flex items-center gap-0 px-6 pt-4 pb-0">
              <StepDot n={1} label="Select Phone" active={step === "pick"} done={step === "customer"} />
              <div className={`flex-1 h-px mx-2 transition-colors ${step === "customer" ? "bg-primary" : "bg-muted"}`} />
              <StepDot n={2} label="Customer Info" active={step === "customer"} done={false} />
            </div>
          )}

          {/* ── Success state ───────────────────────── */}
          {successId && (
            <div className="flex-1 flex flex-col items-center justify-center py-14 px-8 text-center gap-4">
              <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="size-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Sale Confirmed!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  The phone has been sold and the record has been updated.
                </p>
              </div>
              <div className="flex gap-2.5 mt-2 flex-wrap justify-center">
                <button
                  onClick={onPrintMemo}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/20"
                >
                  <Printer className="size-4" /> Print Customer Memo
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Pick Phone ──────────────────── */}
          {!successId && step === "pick" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-4 pb-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="wizard-search"
                    autoFocus
                    type="text"
                    value={wizardQ}
                    onChange={(e) => setWizardQ(e.target.value)}
                    placeholder="Search by IMEI, brand, model, color, storage…"
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  {wizardQ && (
                    <button onClick={() => setWizardQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
                {available.length === 0 && (
                  <div className="py-16 text-center text-muted-foreground">
                    <Smartphone className="size-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No available phones found</p>
                    <p className="text-xs opacity-60 mt-1">Try a different search term</p>
                  </div>
                )}
                {available.map((phone) => (
                  <button
                    key={phone.id}
                    onClick={() => onPickPhone(phone)}
                    className="w-full text-left group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/3 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <Smartphone className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{phone.brand} {phone.model}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {phone.ram && <span className="text-xs text-muted-foreground flex items-center gap-1"><Cpu className="size-2.5" />{phone.ram}</span>}
                        {phone.storage && <span className="text-xs text-muted-foreground flex items-center gap-1"><HardDrive className="size-2.5" />{phone.storage}</span>}
                        {phone.color && <span className="text-xs text-muted-foreground flex items-center gap-1"><Palette className="size-2.5" />{phone.color}</span>}
                      </div>
                      {phone.imei && (
                        <div className="text-[10px] font-mono text-muted-foreground/60 mt-1 flex items-center gap-1">
                          <Barcode className="size-2.5" />{phone.imei}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">Selling</div>
                      <div className="font-bold text-primary">{fmt(phone.sellingPrice)}</div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Customer Info ───────────────── */}
          {!successId && step === "customer" && pickedPhone && customerForm && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selected phone summary */}
              <div className="mx-6 mt-4 mb-3 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Smartphone className="size-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">{pickedPhone.brand} {pickedPhone.model}</div>
                  <div className="text-xs text-muted-foreground">{[pickedPhone.color, pickedPhone.ram, pickedPhone.storage].filter(Boolean).join(" · ")}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-muted-foreground">Purchase</div>
                  <div className="font-bold text-foreground">{fmt(pickedPhone.purchasePrice)}</div>
                  <button onClick={onBack} className="text-[10px] text-muted-foreground hover:text-primary underline transition-colors">Change</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5">
                {/* Customer section */}
                <WFormSection icon={User} label="Customer Information">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <WField label="Customer Name *">
                      <WInput autoFocus value={customerForm.customerName} onChange={(e) => setCustomer("customerName", e.target.value)} placeholder="Full name" />
                    </WField>
                    <WField label="Phone Number *">
                      <WInput value={customerForm.customerPhone} onChange={(e) => setCustomer("customerPhone", e.target.value)} placeholder="+880..." />
                    </WField>
                    <WField label="NID (optional)">
                      <WInput value={customerForm.nid} onChange={(e) => setCustomer("nid", e.target.value)} placeholder="National ID number" />
                    </WField>
                    <WField label="Address">
                      <WInput value={customerForm.address} onChange={(e) => setCustomer("address", e.target.value)} placeholder="City, district" />
                    </WField>
                  </div>
                </WFormSection>

                {/* Sale section */}
                <WFormSection icon={BadgeDollarSign} label="Sale Details">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <WField label="Sale Date (auto)">
                      <div className="px-3 py-2 rounded-lg border bg-muted/40 text-sm font-medium text-muted-foreground flex items-center justify-between h-[38px]">
                        <span>
                          {new Date(customerForm.saleDate || Date.now()).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Auto
                        </span>
                      </div>
                    </WField>
                    <WField label="Payment Method">
                      <select
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                        value={customerForm.paymentMethod}
                        onChange={(e) => setCustomer("paymentMethod", e.target.value)}
                      >
                        {["Cash", "Card", "Mobile Banking", "Bank Transfer", "Installment"].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </WField>
                    <WField label="Final Price (Tk) *">
                      <WInput
                        type="number"
                        value={customerForm.finalPrice || ""}
                        onChange={(e) => setCustomer("finalPrice", +e.target.value)}
                        placeholder={String(pickedPhone.sellingPrice)}
                        className="font-semibold"
                      />
                    </WField>
                    <WField label="Discount (auto)">
                      <div className="px-3 py-2 rounded-lg border bg-muted/40 text-sm font-medium text-muted-foreground flex items-center justify-between">
                        <span>{autoDiscount > 0 ? `- ${fmt(autoDiscount)}` : "No discount"}</span>
                        {autoDiscount > 0 && <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{((autoDiscount / pickedPhone.sellingPrice) * 100).toFixed(1)}% off</span>}
                      </div>
                    </WField>
                    <WField label="Sales Person">
                      <WInput value={customerForm.salesPerson} onChange={(e) => setCustomer("salesPerson", e.target.value)} placeholder="Staff name" />
                    </WField>
                    <WField label="Warranty (days)">
                      <div className="flex flex-col gap-1">
                        <WInput
                          type="number"
                          min="0"
                          value={customerForm.warrantyDays ?? 365}
                          onChange={(e) => {
                            const d = Math.max(0, +e.target.value);
                            const expiry = new Date(Date.now() + d * 86400000).toISOString();
                            setCustomer("warrantyDays", d);
                            setCustomer("warrantyExpiry", expiry);
                          }}
                          placeholder="e.g. 365"
                        />
                        <span className="text-[10px] text-muted-foreground pl-1">
                          Expires: {new Date(Date.now() + (customerForm.warrantyDays ?? 365) * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </WField>
                    <WField label="Notes" wide>
                      <WInput value={customerForm.notes} onChange={(e) => setCustomer("notes", e.target.value)} placeholder="Any remarks (optional)" />
                    </WField>
                  </div>
                </WFormSection>
              </div>

              {/* Confirm footer */}
              <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-bold text-lg text-foreground">{fmt(displayFinal)}</span>
                  {autoDiscount > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">{fmt(pickedPhone.sellingPrice)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-muted transition-all cursor-pointer"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </button>
                  <button
                    id="confirm-sale-btn"
                    onClick={onConfirm}
                    className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Check className="size-4" /> Confirm Sale
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

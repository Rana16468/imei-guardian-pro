import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Filter, Package, X, ChevronRight,
  Smartphone, Tag, Barcode, Cpu, HardDrive, Palette,
  DollarSign, ShoppingBag, Calendar, User, Phone,
  Shield, Wallet, Receipt, AlertCircle, CheckCircle2,
  SlidersHorizontal, Eye, ShoppingCart, FileText, Printer,
  Plus, Sparkles, Check, ArrowLeft, ChevronDown, ChevronUp,
  BadgeDollarSign,
} from "lucide-react";
import { loadSales, seedIfEmpty, ensureInStockDemo, profit, warrantyStatus, Sale, saveSales, nextInvoiceNumber } from "@/lib/phone-store";
import { fmt, PageHeader, InfoRow, Metric, CustomerMemoModal } from "@/lib/phone-ui";

export const Route = createFileRoute("/all-stocks")({
  head: () => ({
    meta: [
      { title: "All Stocks & Sales — PhoneTrack" },
      { name: "description", content: "Browse all stock with brand filter, IMEI search, and detailed view." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    sellId: typeof search.sellId === "string" ? search.sellId : undefined,
  }),
  component: AllStocks,
});

/* ─── Status helpers ─────────────────────────────────────── */
type StockStatus = "all" | "in-stock" | "sold";
const STATUS_LABELS: Record<StockStatus, string> = {
  all: "All",
  "in-stock": "In Stock",
  sold: "Sold",
};

function AllStocks() {
  const [sales, setSales] = useState<Sale[]>([]);
  useEffect(() => { seedIfEmpty(); ensureInStockDemo(); setSales(loadSales()); }, []);

  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [status, setStatus] = useState<StockStatus>("all");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [view, setView] = useState<"grid" | "table">("grid");
  const navigate = useNavigate();

  const { sellId } = useSearch({ from: "/all-stocks" });

  /* wizard state */
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "customer">("pick");
  const [wizardQ, setWizardQ] = useState("");
  const [pickedPhone, setPickedPhone] = useState<Sale | null>(null);
  const [customerForm, setCustomerForm] = useState<ReturnType<typeof blankCustomer> | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [showSuccessMemo, setShowSuccessMemo] = useState(false);

  const availablePhones = useMemo(() => {
    const wq = wizardQ.trim().toLowerCase();
    const inStock = sales.filter((r) => !r.customerName);
    if (!wq) return inStock;
    return inStock.filter((r) =>
      r.imei?.toLowerCase().includes(wq) ||
      r.brand?.toLowerCase().includes(wq) ||
      r.model?.toLowerCase().includes(wq) ||
      r.color?.toLowerCase().includes(wq) ||
      r.barcode?.toLowerCase().includes(wq) ||
      r.storage?.toLowerCase().includes(wq)
    );
  }, [sales, wizardQ]);

  const updateRow = (id: string, patch: Partial<Sale>) => {
    const next = sales.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setSales(next);
    saveSales(next);
  };

  /* Auto-open wizard when navigated here with ?sellId=<id> */
  useEffect(() => {
    if (!sellId) return;
    const phone = sales.find((r) => r.id === sellId && !r.customerName);
    if (!phone) return;
    setPickedPhone(phone);
    setCustomerForm(blankCustomer(phone));
    setStep("customer");
    setWizardOpen(true);
    setSuccessId(null);
  }, [sellId, sales]);

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

  /* unique brands */
  const brands = useMemo(() => {
    const set = new Set(sales.map((s) => s.brand).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [sales]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter((s) => {
      if (brand !== "all" && s.brand !== brand) return false;
      if (status === "in-stock" && s.customerName) return false;
      if (status === "sold" && !s.customerName) return false;
      if (!q) return true;
      return (
        s.imei?.toLowerCase().includes(q) ||
        s.brand?.toLowerCase().includes(q) ||
        s.model?.toLowerCase().includes(q) ||
        s.color?.toLowerCase().includes(q) ||
        s.barcode?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q)
      );
    });
  }, [sales, query, brand, status]);

  const totalInStock = sales.filter((s) => !s.customerName).length;
  const totalSold = sales.filter((s) => s.customerName).length;

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader title="All Stocks & Sales" subtitle="Browse, search, and manage your device inventory and availability">
        <button
          onClick={openWizard}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Plus className="size-4.5" />
          Add New Sale
        </button>
        {/* View toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
          <button
            id="view-grid"
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "grid" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >Grid</button>
          <button
            id="view-table"
            onClick={() => setView("table")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "table" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >Table</button>
        </div>
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <StatCard label="Total Stock" value={sales.length} icon={ShoppingCart} color="text-blue-600 bg-blue-500/10" />
        <StatCard label="Sold" value={totalSold} icon={Receipt} color="text-emerald-600 bg-emerald-500/10" />
        <StatCard label="Available" value={totalInStock} icon={FileText} color="text-violet-600 bg-violet-500/10" />
      </div>

      {/* ── Filters bar ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* IMEI / name search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            id="imei-search"
            type="text"
            placeholder="Search by IMEI, model, brand, barcode…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["all", "in-stock", "sold"] as StockStatus[]).map((s) => (
            <button
              key={s}
              id={`status-${s}`}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${status === s ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Brand filter */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <select
            id="brand-filter"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer min-w-[160px] transition-all"
          >
            {brands.map((b) => (
              <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Results count ─────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {sales.length} items
        </p>
        {(query || brand !== "all" || status !== "all") && (
          <button
            onClick={() => { setQuery(""); setBrand("all"); setStatus("all"); }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Grid view ─────────────────────────────── */}
      {view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length === 0 && <EmptyState />}
          {filtered.map((s) => (
            <StockCard key={s.id} sale={s} onView={() => setSelected(s)} onSell={!s.customerName ? () => startSale(s) : undefined} />
          ))}
        </div>
      )}

      {/* ── Table view ────────────────────────────── */}
      {view === "table" && (
        <div className="bg-card rounded-xl border overflow-x-auto">
          {filtered.length === 0
            ? <EmptyState />
            : (
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">IMEI</th>
                    <th className="text-left p-3">Brand / Model</th>
                    <th className="text-left p-3">Color · RAM · Storage</th>
                    <th className="text-right p-3">Purchase</th>
                    <th className="text-right p-3">Selling</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Date Added</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const sold = !!s.customerName;
                    return (
                      <tr key={s.id} className="border-t hover:bg-accent/30 transition-colors">
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sold ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                            }`}>
                            <span className={`size-1.5 rounded-full ${sold ? "bg-emerald-400" : "bg-blue-400"}`} />
                            {sold ? "Sold" : "In Stock"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{s.imei || "—"}</td>
                        <td className="p-3">
                          <div className="font-medium">{s.brand}</div>
                          <div className="text-xs text-muted-foreground">{s.model}</div>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {[s.color, s.ram, s.storage].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td className="p-3 text-right text-sm">{fmt(s.purchasePrice)}</td>
                        <td className="p-3 text-right text-sm font-medium">{fmt(s.sellingPrice)}</td>
                        <td className="p-3">
                          {sold
                            ? <><div className="text-sm font-medium">{s.customerName}</div><div className="text-xs text-muted-foreground">{s.customerPhone}</div></>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(s.saleDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setSelected(s)}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                            >
                              <Eye className="size-3.5" /> View
                            </button>
                            {!sold && (
                              <button
                                onClick={() => startSale(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                              >
                                <ShoppingBag className="size-3" /> Sell
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* ── Detail Slide-over ─────────────────────── */}
      {selected && (
        <StockDetailPanel sale={selected} onClose={() => setSelected(null)} />
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

      {showSuccessMemo && sales.find((r) => r.id === successId) && (
        <CustomerMemoModal sale={sales.find((r) => r.id === successId)!} onClose={() => setShowSuccessMemo(false)} />
      )}
    </div>
  );
}

/* ─── Stock Card (Grid) ──────────────────────────────────── */
function StockCard({ sale: s, onView, onSell }: { sale: Sale; onView: () => void; onSell?: () => void }) {
  const sold = !!s.customerName;
  const w = warrantyStatus(s);

  return (
    <div
      className="bg-card rounded-xl border p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200 cursor-pointer group"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`size-10 rounded-xl flex items-center justify-center ${sold ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
            <Smartphone className="size-5" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">{s.brand}</div>
            <div className="text-xs text-muted-foreground">{s.model}</div>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${sold ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
          }`}>
          <span className={`size-1.5 rounded-full animate-pulse ${sold ? "bg-emerald-400" : "bg-blue-400"}`} />
          {sold ? "Sold" : "In Stock"}
        </span>
      </div>

      {/* Specs chips */}
      <div className="flex flex-wrap gap-1.5">
        {s.color && <Chip icon={Palette} label={s.color} />}
        {s.ram && <Chip icon={Cpu} label={s.ram} />}
        {s.storage && <Chip icon={HardDrive} label={s.storage} />}
      </div>

      {/* IMEI */}
      {s.imei && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
          <Barcode className="size-3.5 shrink-0" />
          <span className="font-mono truncate">{s.imei}</span>
        </div>
      )}

      {/* Price row */}
      <div className="flex items-center justify-between pt-1 border-t" onClick={(e) => e.stopPropagation()}>
        <div>
          <div className="text-[10px] text-muted-foreground">Purchase</div>
          <div className="text-sm font-semibold">{fmt(s.purchasePrice)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">{sold ? "Sold for" : "Selling"}</div>
          <div className="text-sm font-semibold text-primary">{fmt(sold ? s.finalPrice : s.sellingPrice)}</div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-1" />
      </div>

      {/* Action button at the bottom of the card */}
      {sold ? (
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-blue-500/10 text-blue-700 text-xs font-bold hover:bg-blue-500/20 active:scale-[0.98] transition-all cursor-pointer border border-blue-200/50"
        >
          <Eye className="size-3.5" /> View Details & Memo
        </button>
      ) : (
        onSell && (
          <button
            onClick={(e) => { e.stopPropagation(); onSell(); }}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-500/30 cursor-pointer"
          >
            <ShoppingBag className="size-3.5" /> Sell This Phone
          </button>
        )
      )}
    </div>
  );
}

/* ─── Detail Slide-over ──────────────────────────────────── */
function StockDetailPanel({ sale: s, onClose }: { sale: Sale; onClose: () => void }) {
  const sold = !!s.customerName;
  const w = warrantyStatus(s);
  const p = profit(s);
  const [showMemo, setShowMemo] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-card shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-card/80 backdrop-blur sticky top-0">
          <div className="flex items-center gap-3">
            <div className={`size-9 rounded-xl flex items-center justify-center ${sold ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
              <Smartphone className="size-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">{s.brand} {s.model}</div>
              <div className="text-xs text-muted-foreground">{s.variant || s.color}</div>
            </div>
          </div>
          <button id="close-detail" onClick={onClose} className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Status badge */}
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl ${sold ? "bg-emerald-500/8 border border-emerald-500/20" : "bg-blue-500/8 border border-blue-500/20"}`}>
            {sold
              ? <CheckCircle2 className="size-4 text-emerald-600" />
              : <Package className="size-4 text-blue-600" />
            }
            <div>
              <div className={`text-sm font-semibold ${sold ? "text-emerald-600" : "text-blue-600"}`}>
                {sold ? "Sold" : "Available in Stock"}
              </div>
              {sold && s.invoiceNumber && (
                <div className="text-xs text-muted-foreground">Invoice: {s.invoiceNumber}</div>
              )}
            </div>
          </div>

          {/* Device Info */}
          <Section icon={Smartphone} label="Device Info">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Brand" value={s.brand || "—"} />
              <InfoRow label="Model" value={s.model || "—"} />
              <InfoRow label="Variant" value={s.variant || "—"} />
              <InfoRow label="Color" value={s.color || "—"} />
              <InfoRow label="RAM" value={s.ram || "—"} />
              <InfoRow label="Storage" value={s.storage || "—"} />
            </div>
          </Section>

          {/* Identification */}
          <Section icon={Barcode} label="Identification">
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="IMEI" value={s.imei || "—"} mono />
              <InfoRow label="Barcode" value={s.barcode || "—"} />
            </div>
          </Section>

          {/* Pricing */}
          <Section icon={Wallet} label="Pricing">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Purchase" value={fmt(s.purchasePrice)} />
              <Metric label="Selling" value={fmt(s.sellingPrice)} />
              {sold
                ? <Metric label="Profit" value={fmt(p)} positive={p >= 0} />
                : <Metric label="Margin" value={fmt(s.sellingPrice - s.purchasePrice)} positive={(s.sellingPrice - s.purchasePrice) >= 0} />
              }
            </div>
            {sold && (
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
                <InfoRow label="Final Price" value={fmt(s.finalPrice)} />
                <InfoRow label="Discount" value={s.discount ? fmt(s.discount) : "—"} />
                <InfoRow label="Payment" value={s.paymentMethod || "—"} />
                <InfoRow label="Sales Person" value={s.salesPerson || "—"} />
              </div>
            )}
          </Section>

          {/* Customer — only if sold */}
          {sold && (
            <Section icon={User} label="Customer">
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Name" value={s.customerName} />
                <InfoRow label="Phone" value={s.customerPhone || "—"} />
                <InfoRow label="Alt Phone" value={s.altPhone || "—"} />
                <InfoRow label="Email" value={s.email || "—"} />
                <InfoRow label="NID" value={s.nid || "—"} />
                <InfoRow label="Address" value={s.address || "—"} />
              </div>
            </Section>
          )}

          {/* Warranty */}
          <Section icon={Shield} label="Warranty">
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm ${w.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              <Shield className="size-4 shrink-0" />
              <div>
                <div className="font-semibold">{w.active ? `Active — ${w.days} days remaining` : "Expired"}</div>
                <div className="text-xs opacity-70">Until {new Date(s.warrantyExpiry).toLocaleDateString()}</div>
              </div>
            </div>
          </Section>

          {/* Sale date */}
          <Section icon={Calendar} label="Dates">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Date Added" value={new Date(s.saleDate).toLocaleDateString()} />
              {sold && <InfoRow label="Sale Date" value={new Date(s.saleDate).toLocaleString()} />}
            </div>
          </Section>

          {/* Ownership history */}
          {s.ownership?.length > 0 && (
            <Section icon={Receipt} label="Ownership History">
              <div className="space-y-2">
                {s.ownership.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-muted/60">
                    <div>
                      <div className="text-sm font-medium">{o.owner} {o.note && <span className="text-xs text-muted-foreground">({o.note})</span>}</div>
                      <div className="text-xs text-muted-foreground">{o.phone}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(o.transferDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {s.notes && (
            <Section icon={AlertCircle} label="Notes">
              <p className="text-sm text-muted-foreground leading-relaxed">{s.notes}</p>
            </Section>
          )}
        </div>
        {/* Panel footer with Print Memo button */}
        {sold && (
          <div className="px-5 py-4 border-t bg-muted/20 flex gap-2 print:hidden">
            <button
              onClick={() => setShowMemo(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <Printer className="size-4" /> Print Customer Memo
            </button>
          </div>
        )}
      </div>
      {showMemo && (
        <CustomerMemoModal sale={s} onClose={() => setShowMemo(false)} />
      )}
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */
function Chip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full border border-muted/80">
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

function Section({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Icon className="size-3.5 text-primary" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Package className="size-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">No stock found</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-card rounded-xl border p-4 flex items-center gap-3 hover:shadow-sm transition-all">
      <div className={`size-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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

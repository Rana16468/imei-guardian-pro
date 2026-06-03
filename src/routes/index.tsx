import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Smartphone, Search, Users, BarChart3, Plus, Receipt, Shield,
  Download, FileText, Calendar, TrendingUp, Wallet, Package, X,
} from "lucide-react";
import {
  Sale, loadSales, addSale, seedIfEmpty, profit, warrantyStatus, nextInvoiceNumber,
} from "@/lib/phone-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Phone Sales Tracker — IMEI & Customer Management" },
      { name: "description", content: "Track every sold phone by IMEI, manage customers, warranty, and sales reports." },
    ],
  }),
  component: App,
});

type Tab = "dashboard" | "new" | "search" | "customers" | "reports";

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sales, setSales] = useState<Sale[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, [reloadKey]);
  const reload = () => setReloadKey((k) => k + 1);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "new", label: "New Sale", icon: Plus },
    { id: "search", label: "IMEI Search", icon: Search },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reports", label: "Reports", icon: FileText },
  ] as const;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-5 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <Smartphone className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold">PhoneTrack</div>
            <div className="text-xs opacity-70">IMEI Sales Module</div>
          </div>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="size-4" /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 text-xs opacity-60 border-t border-sidebar-border">
          {sales.length} sales tracked
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Smartphone className="size-5 text-primary" />
            <span className="font-semibold">PhoneTrack</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold capitalize">{tab === "new" ? "New Sale" : tab}</h1>
          </div>
          <div className="md:hidden flex gap-1 overflow-x-auto">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`px-2.5 py-1.5 rounded text-xs whitespace-nowrap ${tab === n.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {n.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {tab === "dashboard" && <Dashboard sales={sales} onJump={setTab} />}
          {tab === "new" && <NewSale onSaved={() => { reload(); setTab("dashboard"); }} />}
          {tab === "search" && <SearchView sales={sales} />}
          {tab === "customers" && <Customers sales={sales} />}
          {tab === "reports" && <Reports sales={sales} />}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ sales, onJump }: { sales: Sale[]; onJump: (t: Tab) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todays = sales.filter((s) => new Date(s.saleDate) >= today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthly = sales.filter((s) => new Date(s.saleDate) >= monthStart);

  const totalRevenue = sales.reduce((a, s) => a + s.finalPrice, 0);
  const totalProfit = sales.reduce((a, s) => a + profit(s), 0);

  const stats = [
    { label: "Total Sales", value: sales.length, icon: Package, color: "text-primary" },
    { label: "Today's Sales", value: todays.length, icon: Calendar, color: "text-success" },
    { label: "Monthly Revenue", value: fmt(monthly.reduce((a, s) => a + s.finalPrice, 0)), icon: Wallet, color: "text-warning" },
    { label: "Total Profit", value: fmt(totalProfit), icon: TrendingUp, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</span>
                <Icon className={`size-4 ${s.color}`} />
              </div>
              <div className="text-2xl font-semibold">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Recent Sales</h2>
          <button onClick={() => onJump("new")} className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1.5">
            <Plus className="size-4" /> New Sale
          </button>
        </div>
        <SalesTable sales={sales.slice(0, 10)} />
      </div>

      <div className="text-xs text-muted-foreground">Total revenue all-time: <span className="font-medium text-foreground">{fmt(totalRevenue)}</span></div>
    </div>
  );
}

/* ---------------- New Sale ---------------- */
function NewSale({ onSaved }: { onSaved: () => void }) {
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
    if (!form.imei || !form.customerName) { alert("IMEI and Customer Name required"); return; }
    const sale: Sale = {
      ...form,
      finalPrice,
      warrantyExpiry: new Date(form.warrantyExpiry).toISOString(),
      ownership: [{ owner: form.customerName, phone: form.customerPhone, transferDate: new Date().toISOString(), note: "First buyer" }],
    };
    addSale(sale);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
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
        <Field label="Email (Optional)"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="NID Number (Optional)"><Input value={form.nid} onChange={(e) => set("nid", e.target.value)} /></Field>
        <Field label="Address" wide><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
      </Section>

      <Section title="Sale Information" icon={Receipt}>
        <Field label="Invoice Number"><Input value={form.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} /></Field>
        <Field label="Sale Date"><Input type="datetime-local" value={form.saleDate.slice(0, 16)} onChange={(e) => set("saleDate", new Date(e.target.value).toISOString())} /></Field>
        <Field label="Quantity"><Input type="number" value={form.quantity} onChange={(e) => set("quantity", +e.target.value)} /></Field>
        <Field label="Discount Amount"><Input type="number" value={form.discount || ""} onChange={(e) => set("discount", +e.target.value)} /></Field>
        <Field label="Final Selling Price"><Input value={fmt(finalPrice)} readOnly className="bg-muted" /></Field>
        <Field label="Payment Method">
          <select className="input" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
            {["Cash", "Card", "Mobile Banking", "Bank Transfer", "Installment"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Sales Person"><Input value={form.salesPerson} onChange={(e) => set("salesPerson", e.target.value)} /></Field>
        <Field label="Warranty Expiry"><Input type="date" value={form.warrantyExpiry.slice(0, 10)} onChange={(e) => set("warrantyExpiry", e.target.value)} /></Field>
        <Field label="Notes" wide><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      </Section>

      <div className="bg-accent/40 rounded-lg border border-primary/20 p-4 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex gap-6">
          <Metric label="Final Price" value={fmt(finalPrice)} />
          <Metric label="Profit" value={fmt(profitAmt)} positive={profitAmt >= 0} />
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium inline-flex items-center gap-2">
          <Receipt className="size-4" /> Complete Sale & Generate Invoice
        </button>
      </div>
    </form>
  );
}

/* ---------------- Search ---------------- */
function SearchView({ sales }: { sales: Sale[] }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const results = useMemo(() => {
    if (!q.trim()) return sales;
    const s = q.toLowerCase();
    return sales.filter((x) =>
      x.imei.toLowerCase().includes(s) ||
      x.customerName.toLowerCase().includes(s) ||
      x.customerPhone.toLowerCase().includes(s) ||
      x.invoiceNumber.toLowerCase().includes(s)
    );
  }, [q, sales]);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4">
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by IMEI, customer name, phone or invoice..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="bg-card rounded-lg border">
        <SalesTable sales={results} onSelect={setSelected} />
      </div>
      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ---------------- Customers ---------------- */
function Customers({ sales }: { sales: Sale[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Sale[]>();
    sales.forEach((s) => {
      const key = s.customerPhone || s.customerName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.values());
  }, [sales]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {groups.map((g) => {
        const c = g[0];
        const spent = g.reduce((a, s) => a + s.finalPrice, 0);
        return (
          <div key={c.customerPhone + c.customerName} className="bg-card rounded-lg border p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-lg">{c.customerName}</div>
                <div className="text-sm text-muted-foreground">{c.customerPhone}</div>
                {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
              </div>
              <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{g.length} purchase{g.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2 border-t pt-3">
              {g.map((s) => {
                const w = warrantyStatus(s);
                return (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{s.brand} {s.model}</div>
                      <div className="text-xs text-muted-foreground font-mono">IMEI: {s.imei}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs">{new Date(s.saleDate).toLocaleDateString()}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                        {w.active ? `${w.days}d warranty` : "Expired"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-muted-foreground">Total Spent</span>
              <span className="font-semibold">{fmt(spent)}</span>
            </div>
          </div>
        );
      })}
      {groups.length === 0 && <div className="text-muted-foreground text-sm">No customers yet.</div>}
    </div>
  );
}

/* ---------------- Reports ---------------- */
function Reports({ sales }: { sales: Sale[] }) {
  const [range, setRange] = useState<"day" | "week" | "month" | "year" | "custom">("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    if (range === "day") { start = new Date(); start.setHours(0, 0, 0, 0); }
    else if (range === "week") { start = new Date(now.getTime() - 7 * 86400000); }
    else if (range === "month") { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (range === "year") { start = new Date(now.getFullYear(), 0, 1); }
    else if (range === "custom" && from && to) {
      const f = new Date(from), t = new Date(to); t.setHours(23, 59, 59, 999);
      return sales.filter((s) => { const d = new Date(s.saleDate); return d >= f && d <= t; });
    }
    return sales.filter((s) => new Date(s.saleDate) >= start);
  }, [sales, range, from, to]);

  const revenue = filtered.reduce((a, s) => a + s.finalPrice, 0);
  const profitSum = filtered.reduce((a, s) => a + profit(s), 0);

  const exportCSV = () => {
    const headers = ["Invoice", "Date", "IMEI", "Brand", "Model", "Customer", "Phone", "Final Price", "Profit"];
    const rows = filtered.map((s) => [s.invoiceNumber, new Date(s.saleDate).toLocaleString(), s.imei, s.brand, s.model, s.customerName, s.customerPhone, s.finalPrice, profit(s)]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    download(`sales-${Date.now()}.csv`, csv, "text/csv");
  };
  const exportJSON = () => download(`sales-${Date.now()}.json`, JSON.stringify(filtered, null, 2), "application/json");
  const exportPDF = () => {
    const html = `<html><head><title>Sales Report</title><style>body{font-family:sans-serif;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:left}th{background:#f3f4f6}</style></head><body>
      <h1>Sales Report</h1><p>Generated: ${new Date().toLocaleString()}</p>
      <p>Total: ${filtered.length} sales — Revenue ${fmt(revenue)} — Profit ${fmt(profitSum)}</p>
      <table><thead><tr><th>Invoice</th><th>Date</th><th>IMEI</th><th>Brand/Model</th><th>Customer</th><th>Price</th><th>Profit</th></tr></thead><tbody>
      ${filtered.map((s) => `<tr><td>${s.invoiceNumber}</td><td>${new Date(s.saleDate).toLocaleDateString()}</td><td>${s.imei}</td><td>${s.brand} ${s.model}</td><td>${s.customerName}</td><td>${fmt(s.finalPrice)}</td><td>${fmt(profit(s))}</td></tr>`).join("")}
      </tbody></table><script>window.print()</script></body></html>`;
    const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted p-1 rounded-md">
          {(["day", "week", "month", "year", "custom"] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded text-sm capitalize ${range === r ? "bg-card shadow-sm font-medium" : ""}`}>
              {r}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex gap-2 items-center">
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-muted-foreground">→</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-md border text-sm inline-flex items-center gap-1.5"><Download className="size-3.5" /> CSV</button>
          <button onClick={exportJSON} className="px-3 py-1.5 rounded-md border text-sm inline-flex items-center gap-1.5"><Download className="size-3.5" /> Excel/JSON</button>
          <button onClick={exportPDF} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5"><FileText className="size-3.5" /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Sales" value={filtered.length} />
        <StatCard label="Revenue" value={fmt(revenue)} />
        <StatCard label="Profit" value={fmt(profitSum)} />
      </div>

      <div className="bg-card rounded-lg border">
        <SalesTable sales={filtered} />
      </div>
    </div>
  );
}

/* ---------------- Reusable ---------------- */
function SalesTable({ sales, onSelect }: { sales: Sale[]; onSelect?: (s: Sale) => void }) {
  if (sales.length === 0) return <div className="p-8 text-center text-sm text-muted-foreground">No sales found.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="text-left p-3">Invoice</th>
            <th className="text-left p-3">IMEI</th>
            <th className="text-left p-3">Phone</th>
            <th className="text-left p-3">Customer</th>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Price</th>
            <th className="text-right p-3">Profit</th>
            <th className="text-left p-3">Warranty</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => {
            const w = warrantyStatus(s);
            return (
              <tr key={s.id} onClick={() => onSelect?.(s)}
                className={`border-t hover:bg-accent/30 ${onSelect ? "cursor-pointer" : ""}`}>
                <td className="p-3 font-mono text-xs">{s.invoiceNumber}</td>
                <td className="p-3 font-mono text-xs">{s.imei}</td>
                <td className="p-3">{s.brand} {s.model}</td>
                <td className="p-3"><div>{s.customerName}</div><div className="text-xs text-muted-foreground">{s.customerPhone}</div></td>
                <td className="p-3 text-xs">{new Date(s.saleDate).toLocaleDateString()}</td>
                <td className="p-3 text-right font-medium">{fmt(s.finalPrice)}</td>
                <td className="p-3 text-right text-success">{fmt(profit(s))}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {w.active ? `${w.days}d left` : "Expired"}
                </span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const w = warrantyStatus(sale);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
          <h3 className="font-semibold flex items-center gap-2"><Receipt className="size-4" /> {sale.invoiceNumber}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="IMEI" value={sale.imei} mono />
            <InfoRow label="Barcode" value={sale.barcode || "—"} />
            <InfoRow label="Brand / Model" value={`${sale.brand} ${sale.model}`} />
            <InfoRow label="Variant" value={`${sale.variant} ${sale.color}`} />
            <InfoRow label="RAM / Storage" value={`${sale.ram} / ${sale.storage}`} />
            <InfoRow label="Sale Date" value={new Date(sale.saleDate).toLocaleString()} />
          </div>
          <div className="border-t pt-4">
            <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="size-3.5" /> Customer</h4>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Name" value={sale.customerName} />
              <InfoRow label="Phone" value={sale.customerPhone} />
              <InfoRow label="Email" value={sale.email || "—"} />
              <InfoRow label="Address" value={sale.address || "—"} />
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><Wallet className="size-3.5" /> Pricing</h4>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Purchase" value={fmt(sale.purchasePrice)} />
              <Metric label="Final Price" value={fmt(sale.finalPrice)} />
              <Metric label="Profit" value={fmt(profit(sale))} positive={profit(sale) >= 0} />
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1.5"><Shield className="size-3.5" /> Warranty</h4>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {w.active ? `Active — ${w.days} days remaining` : "Warranty Expired"}
              <span className="text-xs opacity-70">(until {new Date(sale.warrantyExpiry).toLocaleDateString()})</span>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-xs uppercase text-muted-foreground mb-2">Ownership History</h4>
            <div className="space-y-2">
              {sale.ownership.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <div className="text-sm font-medium">{o.owner} <span className="text-xs text-muted-foreground">({o.note})</span></div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(o.transferDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
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
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${positive === false ? "text-destructive" : positive ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}
function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

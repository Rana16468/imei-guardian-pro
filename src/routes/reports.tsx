import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { loadSales, seedIfEmpty, Sale, profit } from "@/lib/phone-store";
import { fmt, download, PageHeader, SalesTable } from "@/lib/phone-ui";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — PhoneTrack" }] }),
  component: Reports,
});

type R = "day" | "week" | "month" | "year" | "custom";

function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [range, setRange] = useState<R>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    if (range === "day") { start = new Date(); start.setHours(0, 0, 0, 0); }
    else if (range === "week") start = new Date(now.getTime() - 7 * 86400000);
    else if (range === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (range === "year") start = new Date(now.getFullYear(), 0, 1);
    else if (range === "custom" && from && to) {
      const f = new Date(from), t = new Date(to); t.setHours(23, 59, 59, 999);
      return sales.filter((s) => { const d = new Date(s.saleDate); return d >= f && d <= t; });
    }
    return sales.filter((s) => new Date(s.saleDate) >= start);
  }, [sales, range, from, to]);

  const revenue = filtered.reduce((a, s) => a + s.finalPrice, 0);
  const profitSum = filtered.reduce((a, s) => a + profit(s), 0);

  // Chart: by day
  const chartData = useMemo(() => {
    const map = new Map<string, { day: string; revenue: number; sales: number }>();
    filtered.forEach((s) => {
      const day = new Date(s.saleDate).toLocaleDateString("en", { month: "short", day: "numeric" });
      const e = map.get(day) || { day, revenue: 0, sales: 0 };
      e.revenue += s.finalPrice; e.sales += 1;
      map.set(day, e);
    });
    return Array.from(map.values());
  }, [filtered]);

  const exportCSV = () => {
    const headers = ["Invoice", "Date", "IMEI", "Brand", "Model", "Customer", "Phone", "Final Price", "Profit"];
    const rows = filtered.map((s) => [s.invoiceNumber, new Date(s.saleDate).toLocaleString(), s.imei, s.brand, s.model, s.customerName, s.customerPhone, s.finalPrice, profit(s)]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    download(`sales-${Date.now()}.csv`, csv, "text/csv");
  };
  const exportJSON = () => download(`sales-${Date.now()}.json`, JSON.stringify(filtered, null, 2), "application/json");
  const exportPDF = () => {
    const html = `<html><head><title>Sales Report</title><style>body{font-family:sans-serif;padding:24px}h1{margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e5e7eb;padding:6px;font-size:11px;text-align:left}th{background:#f3f4f6}.k{display:inline-block;margin-right:24px}.k b{display:block;font-size:18px}</style></head><body>
      <h1>PhoneTrack Sales Report</h1><div style="color:#666;font-size:12px">Generated ${new Date().toLocaleString()}</div>
      <div style="margin-top:16px"><div class="k"><span>Sales</span><b>${filtered.length}</b></div><div class="k"><span>Revenue</span><b>${fmt(revenue)}</b></div><div class="k"><span>Profit</span><b>${fmt(profitSum)}</b></div></div>
      <table><thead><tr><th>Invoice</th><th>Date</th><th>IMEI</th><th>Brand/Model</th><th>Customer</th><th>Price</th><th>Profit</th></tr></thead><tbody>
      ${filtered.map((s) => `<tr><td>${s.invoiceNumber}</td><td>${new Date(s.saleDate).toLocaleDateString()}</td><td>${s.imei}</td><td>${s.brand} ${s.model}</td><td>${s.customerName}</td><td>${fmt(s.finalPrice)}</td><td>${fmt(profit(s))}</td></tr>`).join("")}
      </tbody></table><script>window.print()</script></body></html>`;
    const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader title="Reports" subtitle="Analyze sales performance across periods" />

      <div className="bg-card rounded-xl border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-muted p-1 rounded-md">
          {(["day", "week", "month", "year", "custom"] as R[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded text-sm capitalize transition ${range === r ? "bg-card shadow-sm font-medium" : "hover:bg-card/50"}`}>{r}</button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex gap-2 items-center">
            <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-muted-foreground text-sm">→</span>
            <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 rounded-md border text-sm inline-flex items-center gap-1.5 hover:bg-accent"><Download className="size-3.5" /> CSV</button>
          <button onClick={exportJSON} className="px-3 py-1.5 rounded-md border text-sm inline-flex items-center gap-1.5 hover:bg-accent"><Download className="size-3.5" /> JSON</button>
          <button onClick={exportPDF} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5"><FileText className="size-3.5" /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard label="Sales" value={filtered.length.toString()} />
        <StatCard label="Revenue" value={fmt(revenue)} />
        <StatCard label="Profit" value={fmt(profitSum)} positive />
      </div>

      <div className="bg-card rounded-xl border p-5 mb-4">
        <h3 className="font-semibold mb-4">Revenue by Day</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 255)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.91 0.01 255)", fontSize: 12 }} formatter={(v: number) => fmt(v)} />
            <Bar dataKey="revenue" fill="oklch(0.5 0.18 260)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border">
        <SalesTable sales={filtered} />
      </div>
    </div>
  );
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${positive ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Package, Calendar, Wallet, TrendingUp, ArrowUpRight, Plus, Receipt,
} from "lucide-react";
import { loadSales, seedIfEmpty, profit, Sale } from "@/lib/phone-store";
import { fmt, PageHeader, SalesTable } from "@/lib/phone-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PhoneTrack" },
      { name: "description", content: "Sales overview, profit, inventory and warranty KPIs." },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["oklch(0.5 0.18 260)", "oklch(0.62 0.17 155)", "oklch(0.75 0.16 75)", "oklch(0.58 0.22 25)", "oklch(0.55 0.15 200)"];

function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const monthly = sales.filter((s) => new Date(s.saleDate) >= monthStart);
  const lastMonth = sales.filter((s) => { const d = new Date(s.saleDate); return d >= lastMonthStart && d < monthStart; });
  const monthlyRev = monthly.reduce((a, s) => a + s.finalPrice, 0);
  const lastRev = lastMonth.reduce((a, s) => a + s.finalPrice, 0);
  const revChange = lastRev > 0 ? ((monthlyRev - lastRev) / lastRev) * 100 : 0;

  const totalProfit = sales.reduce((a, s) => a + profit(s), 0);
  const todays = sales.filter((s) => new Date(s.saleDate) >= today);

  // 14-day trend
  const trend = useMemo(() => {
    const days: { day: string; revenue: number; profit: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayS = sales.filter((s) => { const x = new Date(s.saleDate); return x >= d && x < next; });
      days.push({
        day: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
        revenue: dayS.reduce((a, s) => a + s.finalPrice, 0),
        profit: dayS.reduce((a, s) => a + profit(s), 0),
      });
    }
    return days;
  }, [sales]);

  // Top brands
  const brands = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => map.set(s.brand || "Other", (map.get(s.brand || "Other") || 0) + 1));
    return Array.from(map, ([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [sales]);

  // Payment mix
  const payments = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => map.set(s.paymentMethod, (map.get(s.paymentMethod) || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [sales]);

  const stats = [
    { label: "Total Sales", value: sales.length.toString(), icon: Package, sub: `${todays.length} today`, color: "bg-primary/10 text-primary" },
    { label: "Monthly Revenue", value: fmt(monthlyRev), icon: Wallet, sub: revChange >= 0 ? `+${revChange.toFixed(1)}%` : `${revChange.toFixed(1)}%`, color: "bg-success/10 text-success", trend: revChange },
    { label: "Total Profit", value: fmt(totalProfit), icon: TrendingUp, sub: "All time", color: "bg-warning/10 text-warning" },
    { label: "Active Warranties", value: sales.filter((s) => new Date(s.warrantyExpiry) > new Date()).length.toString(), icon: Calendar, sub: "Under coverage", color: "bg-accent text-accent-foreground" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader title="Dashboard" subtitle="Overview of your phone sales performance">
        <Link to="/sales" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90">
          <Plus className="size-4" /> New Sale
        </Link>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`size-9 rounded-lg ${s.color} flex items-center justify-center`}>
                  <Icon className="size-4" />
                </div>
                {s.trend !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 ${s.trend >= 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    <ArrowUpRight className={`size-3 ${s.trend < 0 ? "rotate-90" : ""}`} /> {Math.abs(s.trend).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label} · <span>{s.sub}</span></div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue & Profit (14 days)</h3>
              <p className="text-xs text-muted-foreground">Daily sales trend</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Revenue</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> Profit</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 255)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.91 0.01 255)", fontSize: 12 }} formatter={(v: number) => fmt(v)} />
              <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} fill="url(#rev)" strokeWidth={2} />
              <Area type="monotone" dataKey="profit" stroke={CHART_COLORS[1]} fill="url(#prof)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold mb-1">Payment Methods</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution of sales</p>
          {payments.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={payments} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {payments.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.91 0.01 255)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {payments.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {p.name}
                    </span>
                    <span className="font-medium">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-sm text-muted-foreground py-12 text-center">No data</div>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold mb-1">Top Brands</h3>
          <p className="text-xs text-muted-foreground mb-4">Units sold</p>
          {brands.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={brands} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 255)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }} tickLine={false} axisLine={false} />
                <YAxis dataKey="brand" type="category" tick={{ fontSize: 11, fill: "oklch(0.3 0.03 260)" }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.91 0.01 255)", fontSize: 12 }} />
                <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-sm text-muted-foreground py-12 text-center">No data</div>}
        </div>

        <div className="bg-card rounded-xl border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Recent Sales</h3>
              <p className="text-xs text-muted-foreground">Latest 5 transactions</p>
            </div>
            <Link to="/search" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <SalesTable sales={sales.slice(0, 5)} compact />
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border p-5 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Receipt className="size-5" />
          </div>
          <div>
            <div className="font-semibold">Need to record a new sale?</div>
            <div className="text-xs text-muted-foreground">Capture IMEI, customer details, and auto-generate an invoice in one flow.</div>
          </div>
        </div>
        <Link to="/sales" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">Start New Sale</Link>
      </div>
    </div>
  );
}

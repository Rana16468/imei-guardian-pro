import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Package, Calendar, Wallet, TrendingUp, ArrowUpRight, Plus, Receipt,
  Smartphone, ShoppingCart, Coins, Briefcase,
  DollarSign,
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

  const monthly = sales.filter((s) => s.customerName && new Date(s.saleDate) >= monthStart);
  const lastMonth = sales.filter((s) => { const d = new Date(s.saleDate); return s.customerName && d >= lastMonthStart && d < monthStart; });
  const monthlyRev = monthly.reduce((a, s) => a + s.finalPrice, 0);
  const lastRev = lastMonth.reduce((a, s) => a + s.finalPrice, 0);
  const revChange = lastRev > 0 ? ((monthlyRev - lastRev) / lastRev) * 100 : 0;

  const totalProfit = sales.filter((s) => s.customerName).reduce((a, s) => a + profit(s), 0);
  const todays = sales.filter((s) => s.customerName && new Date(s.saleDate) >= today);

  const totalStock = sales.length;
  const totalSold = sales.filter((s) => s.customerName).length;
  const availableStock = totalStock - totalSold;
  const totalInvestVal = sales.filter((s) => !s.customerName).reduce((a, s) => a + s.purchasePrice, 0);
  const liquidCashVal = sales.filter((s) => s.customerName).reduce((a, s) => a + s.finalPrice, 0);

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
    sales.filter((s) => s.customerName).forEach((s) => map.set(s.brand || "Other", (map.get(s.brand || "Other") || 0) + 1));
    return Array.from(map, ([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [sales]);


  const stats = [
    {
      label: "Total Stock",
      value: totalStock.toString(),
      sub: `${availableStock} available`,
      icon: Smartphone,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Total Sold",
      value: totalSold.toString(),
      sub: "All-time transactions",
      icon: ShoppingCart,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Monthly Sales",
      value: fmt(monthlyRev),
      sub: revChange >= 0 ? `+${revChange.toFixed(1)}%` : `${revChange.toFixed(1)}%`,
      icon: Wallet,
      color: "bg-violet-500/10 text-violet-600",
      trend: revChange,
    },
    {
      label: "Total Profit",
      value: fmt(totalProfit),
      sub: "Net earnings",
      icon: TrendingUp,
      color: "bg-green-500/10 text-green-600",
    },
    {
      label: "Liquid Cash",
      value: fmt(monthlyRev),
      sub: "Cash inflow",
      icon: DollarSign,
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      label: "Total Invested",
      value: fmt(totalInvestVal),
      sub: "Active stock cost",
      icon: Briefcase,
      color: "bg-blue-500/10 text-blue-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader title="Dashboard" subtitle="Overview of your phone sales performance">
        <Link to="/sales" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:opacity-90">
          <Plus className="size-4" /> New Sale
        </Link>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card rounded-xl border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`size-11 rounded-xl ${s.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="size-5" />
                  </div>
                  {s.trend !== undefined && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                        s.trend >= 0
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      <ArrowUpRight className={`size-3.5 ${s.trend < 0 ? "rotate-90" : ""}`} />
                      {Math.abs(s.trend).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {s.value}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-semibold text-muted-foreground">{s.label}</div>
              
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue & Profit (Monthly)</h3>
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

        <div className="bg-card rounded-xl border p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-1">Top Sales Brands</h3>
            <p className="text-xs text-muted-foreground mb-4">Distribution of units sold</p>
          </div>
          {brands.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center">
              <div className="relative flex items-center justify-center h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brands}
                      dataKey="count"
                      nameKey="brand"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={3}
                      cornerRadius={3}
                    >
                      {brands.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="focus:outline-none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid oklch(0.91 0.01 255)",
                        fontSize: 12,
                        backgroundColor: "var(--color-card)",
                        color: "var(--color-foreground)",
                      }}
                      formatter={(v: number) => [`${v} sold`, "Volume"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Sold</span>
                  <span className="text-2xl font-extrabold text-foreground leading-none mt-0.5">{totalSold}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {brands.map((b, i) => {
                  const percentage = totalSold > 0 ? Math.round((b.count / totalSold) * 100) : 0;
                  return (
                    <div key={b.brand} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-muted/50 transition-all hover:bg-muted/50">
                      <span className="size-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">{b.brand}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">{b.count} {b.count === 1 ? "unit" : "units"} ({percentage}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-12 text-center flex-1 flex items-center justify-center">No data</div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Recent Sales</h3>
              <p className="text-xs text-muted-foreground">Latest 5 transactions</p>
            </div>
            <Link to="/search" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <SalesTable sales={sales.slice(0, 5)} />
        </div>
      </div>


    </div>
  );
}

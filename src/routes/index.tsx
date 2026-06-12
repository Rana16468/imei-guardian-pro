import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Package, Calendar, Wallet, TrendingUp, ArrowUpRight, Plus, Receipt,
  Smartphone, ShoppingCart, Coins, Briefcase,
  DollarSign, Eye, EyeOff,
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

const MONTHS = [
  { label: "January", value: 0 },
  { label: "February", value: 1 },
  { label: "March", value: 2 },
  { label: "April", value: 3 },
  { label: "May", value: 4 },
  { label: "June", value: 5 },
  { label: "July", value: 6 },
  { label: "August", value: 7 },
  { label: "September", value: 8 },
  { label: "October", value: 9 },
  { label: "November", value: 10 },
  { label: "December", value: 11 }
];

function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [showInvested, setShowInvested] = useState(false);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, []);

  const years = useMemo(() => {
    const allYears = sales.map((s) => new Date(s.saleDate).getFullYear());
    const uniqueYears = Array.from(new Set(allYears));
    const currentYear = new Date().getFullYear();
    if (!uniqueYears.includes(currentYear)) {
      uniqueYears.push(currentYear);
    }
    return uniqueYears.sort((a, b) => b - a);
  }, [sales]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Monthly logic
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
  const lastMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const lastMonthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const monthly = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= monthStart && d <= monthEnd;
  });
  const lastMonth = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= lastMonthStart && d <= lastMonthEnd;
  });
  const monthlyRev = monthly.reduce((a, s) => a + s.finalPrice, 0);
  const lastRev = lastMonth.reduce((a, s) => a + s.finalPrice, 0);
  const revChange = lastRev > 0 ? ((monthlyRev - lastRev) / lastRev) * 100 : 0;
  const selectedMonthProfit = monthly.reduce((a, s) => a + profit(s), 0);

  // Yearly logic
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
  const lastYearStart = new Date(selectedYear - 1, 0, 1);
  const lastYearEnd = new Date(selectedYear - 1, 11, 31, 23, 59, 59, 999);

  const yearlySales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= yearStart && d <= yearEnd;
  });
  const lastYearSales = sales.filter((s) => {
    const d = new Date(s.saleDate);
    return s.customerName && d >= lastYearStart && d <= lastYearEnd;
  });
  const yearlyRev = yearlySales.reduce((a, s) => a + s.finalPrice, 0);
  const lastYearRev = lastYearSales.reduce((a, s) => a + s.finalPrice, 0);
  const yoyRevChange = lastYearRev > 0 ? ((yearlyRev - lastYearRev) / lastYearRev) * 100 : 0;
  const yearlyProfit = yearlySales.reduce((a, s) => a + profit(s), 0);

  const todays = sales.filter((s) => s.customerName && new Date(s.saleDate) >= today);
  const todayRevenue = todays.reduce((a, s) => a + s.finalPrice, 0);
  const todayProfit = todays.reduce((a, s) => a + profit(s), 0);

  const totalStock = sales.length;
  const totalSold = sales.filter((s) => s.customerName).length;
  const availableStock = totalStock - totalSold;
  const totalInvestVal = sales.filter((s) => !s.customerName).reduce((a, s) => a + s.purchasePrice, 0);
  const liquidCashVal = sales.filter((s) => s.customerName).reduce((a, s) => a + s.finalPrice, 0);

  // Trend data: dynamically switch between Yearly (monthly aggregates) and Monthly (daily aggregates)
  const trend = useMemo(() => {
    if (viewMode === "yearly") {
      return MONTHS.map((m) => {
        const monthSales = sales.filter((s) => {
          const d = new Date(s.saleDate);
          return (
            s.customerName &&
            d.getFullYear() === selectedYear &&
            d.getMonth() === m.value
          );
        });

        return {
          day: m.label,
          revenue: monthSales.reduce((a, s) => a + s.finalPrice, 0),
          profit: monthSales.reduce((a, s) => a + profit(s), 0),
        };
      });
    } else {
      const days: { day: string; revenue: number; profit: number }[] = [];
      const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();

      for (let i = 1; i <= totalDays; i++) {
        const d = new Date(selectedYear, selectedMonth, i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(selectedYear, selectedMonth, i + 1);
        next.setHours(0, 0, 0, 0);

        const dayS = sales.filter((s) => {
          const x = new Date(s.saleDate);
          return s.customerName && x >= d && x < next;
        });

        days.push({
          day: `${i} ${d.toLocaleDateString("en", { month: "short" })}`,
          revenue: dayS.reduce((a, s) => a + s.finalPrice, 0),
          profit: dayS.reduce((a, s) => a + profit(s), 0),
        });
      }
      return days;
    }
  }, [sales, viewMode, selectedMonth, selectedYear]);

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
      todaySub: `${availableStock} in stock today`,
      icon: Smartphone,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: viewMode === "yearly" ? "Yearly Sold" : "Monthly Sold",
      value: viewMode === "yearly" ? yearlySales.length.toString() : monthly.length.toString(),
      sub: viewMode === "yearly" ? "Yearly transactions" : "Monthly transactions",
      todaySub: todays.length > 0 ? `${todays.length} sold today` : "No sales today",
      icon: ShoppingCart,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: viewMode === "yearly" ? "Yearly Sales" : "Monthly Sales",
      value: viewMode === "yearly" ? fmt(yearlyRev) : fmt(monthlyRev),
      sub: viewMode === "yearly"
        ? (yoyRevChange >= 0 ? `+${yoyRevChange.toFixed(1)}% YoY` : `${yoyRevChange.toFixed(1)}% YoY`)
        : (revChange >= 0 ? `+${revChange.toFixed(1)}% MoM` : `${revChange.toFixed(1)}% MoM`),
      todaySub: todayRevenue > 0 ? `Today: ${fmt(todayRevenue)}` : "No revenue today",
      icon: Wallet,
      color: "bg-violet-500/10 text-violet-600",
      trend: viewMode === "yearly" ? yoyRevChange : revChange,
    },
    {
      label: viewMode === "yearly" ? "Yearly Profit" : "Monthly Profit",
      value: viewMode === "yearly" ? fmt(yearlyProfit) : fmt(selectedMonthProfit),
      sub: "Net earnings",
      todaySub: todayProfit > 0 ? `Today: ${fmt(todayProfit)}` : "No profit today",
      icon: TrendingUp,
      color: "bg-green-500/10 text-green-600",
    },
    {
      label: "Liquid Cash",
      value: fmt(liquidCashVal),
      sub: "Cash inflow",
      todaySub: todayRevenue > 0 ? `+${fmt(todayRevenue)} today` : "No cash today",
      icon: DollarSign,
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      label: "Total Invested",
      value: fmt(totalInvestVal),
      sub: "Active stock cost",
      todaySub: `${availableStock} unsold unit${availableStock !== 1 ? "s" : ""}`,
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
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${s.trend >= 0
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                        }`}
                    >
                      <ArrowUpRight className={`size-3.5 ${s.trend < 0 ? "rotate-90" : ""}`} />
                      {Math.abs(s.trend).toFixed(0)}%
                    </span>
                  )}
                  {s.label === "Total Invested" && (
                    <button
                      onClick={() => setShowInvested(!showInvested)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                      title={showInvested ? "Hide Amount" : "Show Amount"}
                    >
                      {showInvested ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  )}
                </div>
                <div className={`text-xl font-bold tracking-tight text-foreground sm:text-2xl text-gray-600 transition-all duration-200 ${
                  s.label === "Total Invested" && !showInvested ? "blur-[5px] select-none" : ""
                }`}>
                  {s.value}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-semibold text-muted-foreground">{s.label}</div>
                <span className="text-xs text-muted-foreground/70 inline-flex items-center gap-1 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {s.todaySub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">Revenue & Profit ({viewMode === "yearly" ? "Yearly" : "Monthly"})</h3>
              <p className="text-xs text-muted-foreground">{viewMode === "yearly" ? "Monthly sales breakdown" : "Daily sales trend"}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* View Mode Toggle Button */}
              <div className="flex rounded-md border bg-muted p-0.5 animate-in fade-in duration-200">
                <button
                  onClick={() => setViewMode("yearly")}
                  className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "yearly"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly
                </button>
                <button
                  onClick={() => setViewMode("monthly")}
                  className={`px-3 py-1 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "monthly"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Year Dropdown */}
              <select
                className="px-2 py-1 rounded-md border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer text-foreground animate-in fade-in duration-200"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {/* Month Dropdown (conditional) */}
              {viewMode === "monthly" && (
                <select
                  className="px-2 py-1 rounded-md border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer text-foreground animate-in fade-in duration-200"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Revenue</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> Profit</span>
              </div>
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
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "oklch(0.5 0.02 260)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (viewMode === "yearly" ? v.substring(0, 3) : v.split(" ")[0])}
              />
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

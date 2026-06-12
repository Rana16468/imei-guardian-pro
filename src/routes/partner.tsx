import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  loadSales, Sale, profit,
  loadPartnerTransactions, savePartnerTransactions, PartnerTransaction,
  loadShopExpenses, saveShopExpenses, ShopExpense
} from "@/lib/phone-store";
import { loadGadgets, loadGadgetSales, Gadget, GadgetSale } from "@/lib/gadget-store";
import { fmt, PageHeader } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";
import {
  Users, Handshake, DollarSign, Wallet, FileText,
  TrendingUp, ArrowDownRight, ArrowUpRight, Plus, Trash2,
  Calendar, Layers, Percent, BadgeDollarSign, ShieldAlert,
  ArrowRightLeft, Settings
} from "lucide-react";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Partner Ledger — PhoneTrack" }] }),
  component: PartnerLedger,
});

const COLORS = ["oklch(0.5 0.18 260)", "oklch(0.62 0.17 155)", "oklch(0.75 0.16 75)", "oklch(0.58 0.22 25)", "oklch(0.55 0.15 200)"];

function PartnerLedger() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [gadgetSales, setGadgetSales] = useState<GadgetSale[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "ledger" | "expenses">("overview");

  // Modal States
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Pagination states
  const [ledgerPage, setLedgerPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const pageSize = 8;

  // Split calculations
  const [profitSplitMode, setProfitSplitMode] = useState<"equal" | "proportional">("equal");

  // Forms State
  const [txForm, setTxForm] = useState<{
    partner: "Mehedi" | "Rauf";
    amount: number;
    type: "Investment" | "Withdrawal";
    date: string;
    notes: string;
  }>({
    partner: "Mehedi",
    amount: 0,
    type: "Investment",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [expenseRows, setExpenseRows] = useState<{
    Rent: { amount: number; notes: string };
    Salary: { amount: number; notes: string };
    Internet: { amount: number; notes: string };
    Electricity: { amount: number; notes: string };
    Others: { amount: number; notes: string };
  }>({
    Rent: { amount: 0, notes: "" },
    Salary: { amount: 0, notes: "" },
    Internet: { amount: 0, notes: "" },
    Electricity: { amount: 0, notes: "" },
    Others: { amount: 0, notes: "" },
  });

  // Load data
  useEffect(() => {
    setSales(loadSales());
    setGadgets(loadGadgets());
    setGadgetSales(loadGadgetSales());
    setTransactions(loadPartnerTransactions());
    setExpenses(loadShopExpenses());
  }, []);

  const refreshData = () => {
    setTransactions(loadPartnerTransactions());
    setExpenses(loadShopExpenses());
  };

  // 1. Calculate Partner Capital balances
  const partnerBalances = useMemo(() => {
    let mehediInvest = 0;
    let mehediWithdraw = 0;
    let raufInvest = 0;
    let raufWithdraw = 0;

    transactions.forEach((t) => {
      if (t.partner === "Mehedi") {
        if (t.type === "Investment") mehediInvest += t.amount;
        else mehediWithdraw += t.amount;
      } else {
        if (t.type === "Investment") raufInvest += t.amount;
        else raufWithdraw += t.amount;
      }
    });

    const mehediNet = mehediInvest - mehediWithdraw;
    const raufNet = raufInvest - raufWithdraw;
    const totalNet = mehediNet + raufNet;

    const mehediShare = totalNet > 0 ? (mehediNet / totalNet) * 100 : 0;
    const raufShare = totalNet > 0 ? (raufNet / totalNet) * 100 : 0;

    return {
      mehedi: { invest: mehediInvest, withdraw: mehediWithdraw, net: mehediNet, share: mehediShare },
      rauf: { invest: raufInvest, withdraw: raufWithdraw, net: raufNet, share: raufShare },
      total: totalNet,
    };
  }, [transactions]);

  // 2. Sales and Profit Metrics
  const salesMetrics = useMemo(() => {
    // Phone Sales Profit
    const soldPhones = sales.filter((s) => s.customerName && s.customerName.trim() !== "");
    const phoneRevenue = soldPhones.reduce((a, s) => a + s.finalPrice, 0);
    const phoneProfit = soldPhones.reduce((a, s) => a + profit(s), 0);

    // Gadget Sales Profit
    const gadgetRevenue = gadgetSales.reduce((a, s) => a + s.totalPrice, 0);
    const gadgetProfit = gadgetSales.reduce((a, s) => {
      const g = gadgets.find((item) => item.id === s.gadgetId);
      const purchaseCost = g ? g.purchasePrice * s.quantity : 0;
      return a + (s.totalPrice - purchaseCost);
    }, 0);

    const grossRevenue = phoneRevenue + gadgetRevenue;
    const grossProfit = phoneProfit + gadgetProfit;

    return {
      revenue: grossRevenue,
      grossProfit: grossProfit,
      phoneSales: soldPhones.length,
      gadgetSales: gadgetSales.reduce((a, s) => a + s.quantity, 0),
    };
  }, [sales, gadgets, gadgetSales]);

  // 3. Operating Expenses Metrics
  const expenseMetrics = useMemo(() => {
    let rent = 0;
    let salary = 0;
    let internet = 0;
    let electricity = 0;
    let others = 0;

    expenses.forEach((e) => {
      if (e.category === "Rent") rent += e.amount;
      else if (e.category === "Salary") salary += e.amount;
      else if (e.category === "Internet") internet += e.amount;
      else if (e.category === "Electricity") electricity += e.amount;
      else others += e.amount;
    });

    const total = rent + salary + internet + electricity + others;

    return { rent, salary, internet, electricity, others, total };
  }, [expenses]);

  // 4. Net Profits and Splits
  const netProfit = salesMetrics.grossProfit - expenseMetrics.total;

  const partnerProfitSplit = useMemo(() => {
    let mehediProfit = 0;
    let raufProfit = 0;

    if (profitSplitMode === "equal") {
      mehediProfit = netProfit / 2;
      raufProfit = netProfit / 2;
    } else {
      // Proportional to net capital share
      mehediProfit = netProfit * (partnerBalances.mehedi.share / 100);
      raufProfit = netProfit * (partnerBalances.rauf.share / 100);
    }

    return { mehedi: mehediProfit, rauf: raufProfit };
  }, [netProfit, profitSplitMode, partnerBalances]);

  // 5. Chart Data
  const capitalChartData = [
    { name: "Mehedi", value: Math.max(0, partnerBalances.mehedi.net) },
    { name: "Rauf", value: Math.max(0, partnerBalances.rauf.net) },
  ].filter((d) => d.value > 0);

  const expenseChartData = [
    { name: "Shop Rent", value: expenseMetrics.rent },
    { name: "Salaries", value: expenseMetrics.salary },
    { name: "Internet", value: expenseMetrics.internet },
    { name: "Electricity", value: expenseMetrics.electricity },
    { name: "Others", value: expenseMetrics.others },
  ].filter((d) => d.value > 0);

  // Handlers
  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (txForm.amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    const newTx: PartnerTransaction = {
      id: crypto.randomUUID(),
      partner: txForm.partner,
      amount: Number(txForm.amount),
      type: txForm.type,
      date: new Date(txForm.date).toISOString(),
      notes: txForm.notes,
    };

    const currentTxs = loadPartnerTransactions();
    currentTxs.unshift(newTx);
    savePartnerTransactions(currentTxs);
    refreshData();
    setTxModalOpen(false);

    // Reset Form
    setTxForm({
      partner: "Mehedi",
      amount: 0,
      type: "Investment",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newExpenses: ShopExpense[] = [];
    const dateStr = new Date(expenseDate).toISOString();

    // 1. Rent
    if (expenseRows.Rent.amount > 0) {
      newExpenses.push({
        id: crypto.randomUUID(),
        category: "Rent",
        amount: Number(expenseRows.Rent.amount),
        date: dateStr,
        notes: expenseRows.Rent.notes.trim() || "Shop Rent",
      });
    }

    // 2. Salary
    if (expenseRows.Salary.amount > 0) {
      newExpenses.push({
        id: crypto.randomUUID(),
        category: "Salary",
        amount: Number(expenseRows.Salary.amount),
        date: dateStr,
        notes: expenseRows.Salary.notes.trim() || "Staff Salary",
      });
    }

    // 3. Internet
    if (expenseRows.Internet.amount > 0) {
      newExpenses.push({
        id: crypto.randomUUID(),
        category: "Internet",
        amount: Number(expenseRows.Internet.amount),
        date: dateStr,
        notes: expenseRows.Internet.notes.trim() || "Net Bill",
      });
    }

    // 4. Electricity
    if (expenseRows.Electricity.amount > 0) {
      newExpenses.push({
        id: crypto.randomUUID(),
        category: "Electricity",
        amount: Number(expenseRows.Electricity.amount),
        date: dateStr,
        notes: expenseRows.Electricity.notes.trim() || "Current Bill",
      });
    }

    // 5. Others
    if (expenseRows.Others.amount > 0) {
      newExpenses.push({
        id: crypto.randomUUID(),
        category: "Others",
        amount: Number(expenseRows.Others.amount),
        date: dateStr,
        notes: expenseRows.Others.notes.trim() || "Others",
      });
    }

    if (newExpenses.length === 0) {
      alert("Please enter at least one expense amount greater than 0");
      return;
    }

    const currentExpenses = loadShopExpenses();
    currentExpenses.unshift(...newExpenses);
    saveShopExpenses(currentExpenses);
    refreshData();
    setExpenseModalOpen(false);

    // Reset Form
    setExpenseRows({
      Rent: { amount: 0, notes: "" },
      Salary: { amount: 0, notes: "" },
      Internet: { amount: 0, notes: "" },
      Electricity: { amount: 0, notes: "" },
      Others: { amount: 0, notes: "" },
    });
  };

  const deleteTx = (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    const next = transactions.filter((t) => t.id !== id);
    savePartnerTransactions(next);
    refreshData();
  };

  const deleteExpense = (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    const next = expenses.filter((e) => e.id !== id);
    saveShopExpenses(next);
    refreshData();
  };

  // Sliced Lists for Pagination
  const paginatedTxs = useMemo(() => {
    const start = (ledgerPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, ledgerPage]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * pageSize;
    return expenses.slice(start, start + pageSize);
  }, [expenses, expensePage]);

  const totalLedgerPages = Math.ceil(transactions.length / pageSize);
  const totalExpensePages = Math.ceil(expenses.length / pageSize);

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Partner Ledger & Expenses"
        subtitle="Manage capital contributions, shop expenses, and track net profits"
      >
        <div className="flex gap-2">
          <button
            onClick={() => setTxModalOpen(true)}
            className="px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="size-4" /> Add Partner Cash
          </button>
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="size-4" /> Add Shop Expense
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-card rounded-xl border p-5 hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Invested (Capital)</span>
            <div className="text-2xl font-extrabold text-foreground mt-1.5">{fmt(partnerBalances.total)}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-medium flex gap-2">
              <span>M: {partnerBalances.mehedi.share.toFixed(0)}%</span>
              <span>·</span>
              <span>R: {partnerBalances.rauf.share.toFixed(0)}%</span>
            </div>
          </div>
          <div className="size-11 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="size-5.5" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Gross Sales Profit</span>
            <div className="text-2xl font-extrabold text-success mt-1.5">{fmt(salesMetrics.grossProfit)}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-medium">
              Phones: {salesMetrics.phoneSales} · Gadgets: {salesMetrics.gadgetSales}
            </div>
          </div>
          <div className="size-11 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="size-5.5" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Shop Expenses</span>
            <div className="text-2xl font-extrabold text-destructive mt-1.5">{fmt(expenseMetrics.total)}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-medium">
              Rent + Salary + Bills + Misc
            </div>
          </div>
          <div className="size-11 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
            <ArrowDownRight className="size-5.5" />
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Net Take-Home Profit</span>
            <div className={`text-2xl font-extrabold mt-1.5 ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {fmt(netProfit)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 font-medium">
              Gross profit minus expenses
            </div>
          </div>
          <div className="size-11 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
            <BadgeDollarSign className="size-5.5" />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-muted mb-6 gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="size-4" /> Overview & Dividends
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ledger"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Handshake className="size-4" /> Capital Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "expenses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-4" /> Expense Records ({expenses.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & PROFIT CALCULATOR */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* left column: Partner breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profit Share Calculator */}
            <div className="bg-card rounded-xl border p-5 space-y-5">
              <div className="flex justify-between items-center border-b pb-3.5">
                <div>
                  <h3 className="font-bold text-foreground">Dividend Profit Share</h3>
                  <p className="text-xs text-muted-foreground">Estimate profit distribution shares for partners</p>
                </div>
                <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted">
                  <button
                    onClick={() => setProfitSplitMode("equal")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      profitSplitMode === "equal"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Equal Split (50/50)
                  </button>
                  <button
                    onClick={() => setProfitSplitMode("proportional")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      profitSplitMode === "proportional"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Capital Ratio
                  </button>
                </div>
              </div>

              {/* Partners details grids */}
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Mehedi info */}
                <div className="border rounded-xl p-5 bg-muted/10 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      M
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Mehedi</h4>
                      <p className="text-[10px] text-muted-foreground">Partner capital ratio: {partnerBalances.mehedi.share.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Net Capital:</span>
                      <div className="font-bold text-foreground mt-0.5">{fmt(partnerBalances.mehedi.net)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Invest:</span>
                      <div className="font-semibold text-foreground/80 mt-0.5">{fmt(partnerBalances.mehedi.invest)}</div>
                    </div>
                    <div className="col-span-2 border-t pt-2.5 flex justify-between items-center">
                      <span className="font-bold text-primary">Profit Share:</span>
                      <span className={`text-base font-extrabold ${partnerProfitSplit.mehedi >= 0 ? "text-success" : "text-destructive"}`}>
                        {fmt(partnerProfitSplit.mehedi)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rauf info */}
                <div className="border rounded-xl p-5 bg-muted/10 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold text-sm">
                      R
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Rauf</h4>
                      <p className="text-[10px] text-muted-foreground">Partner capital ratio: {partnerBalances.rauf.share.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Net Capital:</span>
                      <div className="font-bold text-foreground mt-0.5">{fmt(partnerBalances.rauf.net)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Invest:</span>
                      <div className="font-semibold text-foreground/80 mt-0.5">{fmt(partnerBalances.rauf.invest)}</div>
                    </div>
                    <div className="col-span-2 border-t pt-2.5 flex justify-between items-center">
                      <span className="font-bold text-primary">Profit Share:</span>
                      <span className={`text-base font-extrabold ${partnerProfitSplit.rauf >= 0 ? "text-success" : "text-destructive"}`}>
                        {fmt(partnerProfitSplit.rauf)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating cost category ledger */}
            <div className="bg-card rounded-xl border p-5 space-y-4">
              <h3 className="font-bold text-foreground">Expense Category Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <ExpenseCategoryCard label="Shop Rent" val={expenseMetrics.rent} percent={(expenseMetrics.rent / (expenseMetrics.total || 1)) * 100} />
                <ExpenseCategoryCard label="Salaries" val={expenseMetrics.salary} percent={(expenseMetrics.salary / (expenseMetrics.total || 1)) * 100} />
                <ExpenseCategoryCard label="Internet" val={expenseMetrics.internet} percent={(expenseMetrics.internet / (expenseMetrics.total || 1)) * 100} />
                <ExpenseCategoryCard label="Electricity" val={expenseMetrics.electricity} percent={(expenseMetrics.electricity / (expenseMetrics.total || 1)) * 100} />
                <ExpenseCategoryCard label="Others / Misc" val={expenseMetrics.others} percent={(expenseMetrics.others / (expenseMetrics.total || 1)) * 100} />
              </div>
            </div>
          </div>

          {/* right column: Visual Charts */}
          <div className="space-y-6">
            {/* Capital share piechart */}
            <div className="bg-card rounded-xl border p-5 flex flex-col justify-between h-[250px]">
              <h4 className="font-semibold text-foreground text-sm mb-1">Capital Contribution</h4>
              {capitalChartData.length > 0 ? (
                <div className="flex-grow relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={capitalChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {capitalChartData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center select-none pointer-events-none">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Net Capital</div>
                    <div className="text-lg font-extrabold text-foreground">{fmt(partnerBalances.total)}</div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground">No capital transaction registered</div>
              )}
            </div>

            {/* Expenses breakdown piechart */}
            <div className="bg-card rounded-xl border p-5 flex flex-col justify-between h-[250px]">
              <h4 className="font-semibold text-foreground text-sm mb-1">Expense Distribution</h4>
              {expenseChartData.length > 0 ? (
                <div className="flex-grow relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={2}
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center select-none pointer-events-none">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">Total Cost</div>
                    <div className="text-lg font-extrabold text-destructive">{fmt(expenseMetrics.total)}</div>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground">No expense transactions yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAPITAL LEDGER */}
      {activeTab === "ledger" && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Handshake className="size-4.5 text-primary" /> Capital Transactions
            </h3>
            <span className="text-xs text-muted-foreground">{transactions.length} entries registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Partner</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left"><Calendar className="size-3.5 inline mr-1" />Date</th>
                  <th className="p-3 text-left">Notes / Purpose</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedTxs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      No partner capital transaction registered. Click "+ Add Partner Cash" to log one.
                    </td>
                  </tr>
                )}
                {paginatedTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            t.partner === "Mehedi" ? "bg-primary/10 text-primary" : "bg-violet-500/10 text-violet-600"
                          }`}
                        >
                          {t.partner[0]}
                        </span>
                        {t.partner}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          t.type === "Investment" ? "bg-success/15 text-success" : "bg-red-500/15 text-red-600"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-foreground">
                      {t.type === "Withdrawal" ? "-" : "+"} {fmt(t.amount)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[250px] truncate" title={t.notes}>
                      {t.notes || "—"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteTx(t.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalLedgerPages > 1 && (
            <div className="px-5 py-4 border-t bg-muted/10 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Showing {(ledgerPage - 1) * pageSize + 1} to {Math.min(ledgerPage * pageSize, transactions.length)} of {transactions.length} entries
              </span>
              <AppPagination
                currentPage={ledgerPage}
                totalPages={totalLedgerPages}
                onPageChange={(p) => setLedgerPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHOP EXPENSE RECORDS */}
      {activeTab === "expenses" && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="size-4.5 text-primary" /> Shop Operating Expenses
            </h3>
            <span className="text-xs text-muted-foreground">{expenses.length} expense entries registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left"><Calendar className="size-3.5 inline mr-1" />Date</th>
                  <th className="p-3 text-left">Description / Notes</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      No expenses logged. Click "+ Add Shop Expense" to log one.
                    </td>
                  </tr>
                )}
                {paginatedExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-accent/10 transition-colors">
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          e.category === "Rent"
                            ? "bg-blue-500/10 text-blue-600"
                            : e.category === "Salary"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : e.category === "Internet"
                            ? "bg-violet-500/10 text-violet-600"
                            : e.category === "Electricity"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-destructive">
                      {fmt(e.amount)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[280px] truncate" title={e.notes}>
                      {e.notes || "—"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteExpense(e.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalExpensePages > 1 && (
            <div className="px-5 py-4 border-t bg-muted/10 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Showing {(expensePage - 1) * pageSize + 1} to {Math.min(expensePage * pageSize, expenses.length)} of {expenses.length} entries
              </span>
              <AppPagination
                currentPage={expensePage}
                totalPages={totalExpensePages}
                onPageChange={(p) => setExpensePage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: ADD PARTNER TRANSACTION ─────────────────── */}
      {txModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" onClick={() => setTxModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-emerald-500/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Handshake className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Log Partner Transaction</h2>
                    <p className="text-xs text-muted-foreground">Log cash investment or capital withdrawal</p>
                  </div>
                </div>
                <button
                  onClick={() => setTxModalOpen(false)}
                  className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="size-4 rotate-45 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Select Partner *</span>
                  <select
                    value={txForm.partner}
                    onChange={(e) => setTxForm({ ...txForm, partner: e.target.value as any })}
                    className="input cursor-pointer"
                  >
                    <option value="Mehedi">Mehedi</option>
                    <option value="Rauf">Rauf</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Transaction Type *</span>
                    <select
                      value={txForm.type}
                      onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                      className="input cursor-pointer"
                    >
                      <option value="Investment">Investment</option>
                      <option value="Withdrawal">Withdrawal</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Date *</span>
                    <input
                      type="date"
                      required
                      value={txForm.date}
                      onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                      className="input cursor-pointer"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Amount (Tk) *</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txForm.amount || ""}
                    onChange={(e) => setTxForm({ ...txForm, amount: Math.max(0, Number(e.target.value)) })}
                    placeholder="Enter amount"
                    className="input font-bold"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Notes / Remarks</span>
                  <textarea
                    value={txForm.notes}
                    onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                    placeholder="Purpose of transaction..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                  />
                </label>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-muted/50">
                  <button
                    type="button"
                    onClick={() => setTxModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Confirm Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL 2: ADD SHOP EXPENSE ─────────────────────── */}
      {expenseModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" onClick={() => setExpenseModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200 max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Add Shop Expenses</h2>
                    <p className="text-xs text-muted-foreground">Register shop bills or operating expenses</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpenseModalOpen(false)}
                  className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="size-4 rotate-45 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleExpenseSubmit} className="flex flex-col min-h-0">
                {/* Date Selection */}
                <div className="px-6 py-3.5 border-b bg-muted/20 flex items-center justify-between gap-4 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expense Date *</span>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="input max-w-[180px] cursor-pointer"
                  />
                </div>

                {/* Rows Header (MD screens) */}
                <div className="px-6 py-2.5 border-b bg-muted/30 grid grid-cols-12 gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none hidden md:grid shrink-0">
                  <div className="col-span-3">Expense Category</div>
                  <div className="col-span-3">Amount (Tk)</div>
                  <div className="col-span-6">Description / Notes</div>
                </div>

                {/* Rows List */}
                <div className="px-6 py-4 overflow-y-auto space-y-4 divide-y divide-muted/50 md:divide-none">
                  {/* Shop Rent */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center pt-3 first:pt-0">
                    <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500" />
                      Shop Rent
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount"
                        value={expenseRows.Rent.amount || ""}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Rent: { ...expenseRows.Rent, amount: Math.max(0, Number(e.target.value)) }
                        })}
                        className="input text-sm font-semibold text-destructive"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. Shop Rent for June"
                        value={expenseRows.Rent.notes}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Rent: { ...expenseRows.Rent, notes: e.target.value }
                        })}
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Staff Salary */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center pt-3">
                    <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Staff Salary
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount"
                        value={expenseRows.Salary.amount || ""}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Salary: { ...expenseRows.Salary, amount: Math.max(0, Number(e.target.value)) }
                        })}
                        className="input text-sm font-semibold text-destructive"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. Sales Assistant salary"
                        value={expenseRows.Salary.notes}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Salary: { ...expenseRows.Salary, notes: e.target.value }
                        })}
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Internet / Net Bill */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center pt-3">
                    <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-violet-500" />
                      Net Bill
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount"
                        value={expenseRows.Internet.amount || ""}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Internet: { ...expenseRows.Internet, amount: Math.max(0, Number(e.target.value)) }
                        })}
                        className="input text-sm font-semibold text-destructive"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. Broadband internet bill"
                        value={expenseRows.Internet.notes}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Internet: { ...expenseRows.Internet, notes: e.target.value }
                        })}
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Electricity / Current Bill */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center pt-3">
                    <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Current Bill
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount"
                        value={expenseRows.Electricity.amount || ""}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Electricity: { ...expenseRows.Electricity, amount: Math.max(0, Number(e.target.value)) }
                        })}
                        className="input text-sm font-semibold text-destructive"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. PDB Electricity bill"
                        value={expenseRows.Electricity.notes}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Electricity: { ...expenseRows.Electricity, notes: e.target.value }
                        })}
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Others */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center pt-3">
                    <div className="col-span-3 font-semibold text-sm text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-muted-foreground/60" />
                      Others
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Enter amount"
                        value={expenseRows.Others.amount || ""}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Others: { ...expenseRows.Others, amount: Math.max(0, Number(e.target.value)) }
                        })}
                        className="input text-sm font-semibold text-destructive"
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="e.g. Tea & snacks, cleaner wage"
                        value={expenseRows.Others.notes}
                        onChange={(e) => setExpenseRows({
                          ...expenseRows,
                          Others: { ...expenseRows.Others, notes: e.target.value }
                        })}
                        className="input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-6 border-t border-muted/50 bg-muted/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpenseModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ExpenseCategoryCard({
  label,
  val,
  percent,
}: {
  label: string;
  val: number;
  percent: number;
}) {
  return (
    <div className="border rounded-xl p-3 bg-muted/10 flex flex-col justify-between space-y-2">
      <span className="text-[10px] font-bold text-muted-foreground truncate">{label}</span>
      <div className="text-sm font-extrabold text-foreground">{fmt(val)}</div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[9px] font-bold text-muted-foreground/60 text-right">{percent.toFixed(0)}%</span>
    </div>
  );
}

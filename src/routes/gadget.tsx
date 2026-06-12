import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  TrendingUp,
  CheckCircle2,
  Search,
  Plus,
  Eye,
  ShoppingCart,
  Trash2,
  X,
  Info,
  User,
  DollarSign,
  Printer,
  FileText,
  ArrowLeft,
  Check,
  Sparkles,
  Barcode,
  Palette,
  Phone,
  NotebookTabs,
  BadgeAlert,
} from "lucide-react";
import {
  loadGadgets,
  saveGadgets,
  loadGadgetSales,
  saveGadgetSales,
  addGadget,
  deleteGadget,
  getGadgetSoldQuantity,
  getGadgetAvailableQuantity,
  nextGadgetInvoiceNumber,
  seedGadgetsIfEmpty,
  Gadget,
  GadgetSale,
} from "@/lib/gadget-store";
import { fmt, PageHeader } from "@/lib/phone-ui";

export const Route = createFileRoute("/gadget")({
  head: () => ({ meta: [{ title: "Gadget Management — PhoneTrack" }] }),
  component: GadgetPage,
});

function GadgetPage() {
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [sales, setSales] = useState<GadgetSale[]>([]);
  const [q, setQ] = useState("");
  const [salesQ, setSalesQ] = useState("");
  const [selectedTab, setSelectedTab] = useState<"inventory" | "sales">("inventory");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [memoSale, setMemoSale] = useState<GadgetSale | null>(null);

  // Focus items
  const [selectedGadget, setSelectedGadget] = useState<Gadget | null>(null);

  // Forms state
  const [addForm, setAddForm] = useState({
    supplierName: "",
    productName: "",
    quantity: 1,
    purchasePrice: 0,
    minSellingPrice: 0,
    supplierPhone: "",
    color: "",
    details: "",
  });

  const [sellForm, setSellForm] = useState({
    customerName: "",
    customerPhone: "",
    quantity: 1,
    sellingPrice: 0,
    paymentMethod: "Cash",
    notes: "",
    warrantyDays: 0,
  });

  // Load and seed initial data
  useEffect(() => {
    seedGadgetsIfEmpty();
    setGadgets(loadGadgets());
    setSales(loadGadgetSales());
  }, []);

  const refreshData = () => {
    setGadgets(loadGadgets());
    setSales(loadGadgetSales());
  };

  // Dynamic statistics
  const stats = useMemo(() => {
    // Total stock = sum of quantity of all registered gadgets
    const totalStock = gadgets.reduce((sum, g) => sum + g.quantity, 0);
    // Sold = sum of quantity sold in all transactions
    const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
    // Available = Total Stock - Sold
    const totalAvailable = Math.max(0, totalStock - totalSold);

    return { totalStock, totalSold, totalAvailable };
  }, [gadgets, sales]);

  // Filtered lists
  const filteredGadgets = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return gadgets;
    return gadgets.filter(
      (g) =>
        g.productName.toLowerCase().includes(s) ||
        g.supplierName.toLowerCase().includes(s) ||
        g.color.toLowerCase().includes(s) ||
        g.supplierPhone.includes(s)
    );
  }, [gadgets, q]);

  const filteredSales = useMemo(() => {
    const s = salesQ.trim().toLowerCase();
    if (!s) return sales;
    return sales.filter(
      (sl) =>
        sl.productName.toLowerCase().includes(s) ||
        sl.customerName.toLowerCase().includes(s) ||
        sl.invoiceNumber.toLowerCase().includes(s) ||
        sl.customerPhone.includes(s)
    );
  }, [sales, salesQ]);

  // Handlers
  const handleAddGadgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.productName || !addForm.supplierName || !addForm.supplierPhone || !addForm.color) {
      alert("Please fill in all required fields.");
      return;
    }
    if (addForm.quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }
    if (addForm.purchasePrice < 0 || addForm.minSellingPrice < 0) {
      alert("Prices cannot be negative.");
      return;
    }

    const newGadget: Gadget = {
      id: crypto.randomUUID(),
      productName: addForm.productName,
      supplierName: addForm.supplierName,
      quantity: Number(addForm.quantity),
      purchasePrice: Number(addForm.purchasePrice),
      minSellingPrice: Number(addForm.minSellingPrice),
      supplierPhone: addForm.supplierPhone,
      color: addForm.color,
      details: addForm.details || undefined,
      createdAt: new Date().toISOString(),
    };

    addGadget(newGadget);
    refreshData();
    setAddModalOpen(false);
    // Reset form
    setAddForm({
      supplierName: "",
      productName: "",
      quantity: 1,
      purchasePrice: 0,
      minSellingPrice: 0,
      supplierPhone: "",
      color: "",
      details: "",
    });
  };

  const handleSellGadgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGadget) return;
    const available = getGadgetAvailableQuantity(selectedGadget, sales);

    if (!sellForm.customerName || !sellForm.customerPhone) {
      alert("Please fill in customer details.");
      return;
    }
    if (sellForm.quantity < 1) {
      alert("Sell quantity must be at least 1.");
      return;
    }
    if (sellForm.quantity > available) {
      alert(`Cannot sell more than available stock (${available} units).`);
      return;
    }
    if (sellForm.sellingPrice < selectedGadget.minSellingPrice) {
      alert(`Selling price cannot be lower than the minimum selling price (${fmt(selectedGadget.minSellingPrice)}).`);
      return;
    }

    const price = Number(sellForm.sellingPrice);
    const qty = Number(sellForm.quantity);
    const invoice = nextGadgetInvoiceNumber();

    const warrantyExpiry = sellForm.warrantyDays > 0
      ? new Date(Date.now() + sellForm.warrantyDays * 86400000).toISOString()
      : undefined;

    const newSale: GadgetSale = {
      id: crypto.randomUUID(),
      gadgetId: selectedGadget.id,
      productName: selectedGadget.productName,
      customerName: sellForm.customerName,
      customerPhone: sellForm.customerPhone,
      saleDate: new Date().toISOString(),
      quantity: qty,
      sellingPrice: price,
      totalPrice: qty * price,
      paymentMethod: sellForm.paymentMethod,
      invoiceNumber: invoice,
      notes: sellForm.notes || undefined,
      salesPerson: "Admin",
      warrantyDays: sellForm.warrantyDays > 0 ? Number(sellForm.warrantyDays) : undefined,
      warrantyExpiry,
    };

    const currentSalesList = loadGadgetSales();
    currentSalesList.unshift(newSale);
    saveGadgetSales(currentSalesList);

    refreshData();
    setSellModalOpen(false);
    // Trigger print memo modal automatically
    setMemoSale(newSale);

    // Reset Form
    setSellForm({
      customerName: "",
      customerPhone: "",
      quantity: 1,
      sellingPrice: 0,
      paymentMethod: "Cash",
      notes: "",
      warrantyDays: 0,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from stock? This will delete all associated sales records too.`)) {
      deleteGadget(id);
      refreshData();
    }
  };

  const openSellModal = (gadget: Gadget) => {
    setSelectedGadget(gadget);
    setSellForm((f) => ({
      ...f,
      sellingPrice: gadget.minSellingPrice,
      quantity: 1,
      warrantyDays: 0,
    }));
    setSellModalOpen(true);
  };

  const openDetailModal = (gadget: Gadget) => {
    setSelectedGadget(gadget);
    setDetailModalOpen(true);
  };

  const statsConfigs = [
    {
      label: "Total Stock",
      value: stats.totalStock.toString(),
      sub: `${stats.totalAvailable} available now`,
      icon: Boxes,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Sold",
      value: stats.totalSold.toString(),
      sub: "Total gadget sales",
      icon: TrendingUp,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Available",
      value: stats.totalAvailable.toString(),
      sub: "In stock units",
      icon: CheckCircle2,
      color: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      {/* Page Header */}
      <PageHeader title="Gadget Manager" subtitle="Track and manage electronic accessory inventories and sales">
        <button
          onClick={() => setAddModalOpen(true)}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer"
        >
          <Plus className="size-4.5" />
          Add Gadget
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statsConfigs.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card rounded-xl border p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 flex items-center justify-between"
            >
              <div>
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{s.label}</span>
                <div className="text-3xl font-extrabold tracking-tight text-foreground mt-1.5">{s.value}</div>
                <div className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {s.sub}
                </div>
              </div>
              <div className={`size-12 rounded-xl ${s.color} flex items-center justify-center shadow-sm shrink-0`}>
                <Icon className="size-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-muted mb-6 gap-2">
        <button
          onClick={() => setSelectedTab("inventory")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            selectedTab === "inventory"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Boxes className="size-4" /> Gadget Stock
        </button>
        <button
          onClick={() => setSelectedTab("sales")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            selectedTab === "sales"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <NotebookTabs className="size-4" /> Sales Records ({sales.length})
        </button>
      </div>

      {/* Tab 1: Gadget Inventory */}
      {selectedTab === "inventory" && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          {/* List Toolbar */}
          <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Boxes className="size-4 text-primary" /> Active Stocks
            </h3>
            <div className="relative flex-1 max-w-sm">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, supplier, color..."
                className="w-full pl-9 pr-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <span className="text-xs text-muted-foreground">{filteredGadgets.length} gadgets listed</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Product Name</th>
                  <th className="p-3 text-left">Color</th>
                  <th className="p-3 text-left">Supplier Info</th>
                  <th className="p-3 text-right">Purchase Price</th>
                  <th className="p-3 text-right">Min Selling Price</th>
                  <th className="p-3 text-center">Stock Details</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredGadgets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground">
                      No gadgets found in stock. Click "+ Add Gadget" to insert one.
                    </td>
                  </tr>
                )}
                {filteredGadgets.map((gadget) => {
                  const sold = getGadgetSoldQuantity(gadget.id, sales);
                  const available = getGadgetAvailableQuantity(gadget, sales);

                  return (
                    <tr
                      key={gadget.id}
                      onClick={() => openDetailModal(gadget)}
                      className="hover:bg-accent/20 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-semibold text-foreground">{gadget.productName}</td>
                      <td className="p-3">{gadget.color}</td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{gadget.supplierName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Phone className="size-3 text-muted-foreground/60" /> {gadget.supplierPhone}
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium text-muted-foreground">{fmt(gadget.purchasePrice)}</td>
                      <td className="p-3 text-right font-semibold text-foreground">{fmt(gadget.minSellingPrice)}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                              available === 0
                                ? "bg-destructive/15 text-destructive"
                                : available <= 2
                                ? "bg-warning/15 text-warning"
                                : "bg-success/15 text-success"
                            }`}
                          >
                            {available} / {gadget.quantity} Available
                          </span>
                          {sold > 0 && <span className="text-[10px] text-muted-foreground mt-1">{sold} sold</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openDetailModal(gadget)}
                            className="p-1.5 rounded-md border hover:bg-accent transition-all cursor-pointer shadow-sm hover:border-primary/30"
                            title="View Details"
                          >
                            <Eye className="size-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => openSellModal(gadget)}
                            disabled={available === 0}
                            className={`p-1.5 rounded-md border transition-all cursor-pointer shadow-sm ${
                              available === 0
                                ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                                : "hover:bg-accent hover:border-primary/30 text-primary"
                            }`}
                            title="Sell Gadget"
                          >
                            <ShoppingCart className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(gadget.id, gadget.productName)}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                            title="Delete"
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
      )}

      {/* Tab 2: Sales History */}
      {selectedTab === "sales" && (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          {/* List Toolbar */}
          <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-4 bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" /> Sales Transactions
            </h3>
            <div className="relative flex-1 max-w-sm">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={salesQ}
                onChange={(e) => setSalesQ(e.target.value)}
                placeholder="Search customer, invoice, product..."
                className="w-full pl-9 pr-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <span className="text-xs text-muted-foreground">{filteredSales.length} sales found</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Invoice No</th>
                  <th className="p-3 text-left">Product Name</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Sale Date</th>
                  <th className="p-3 text-center">Qty Sold</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total Price</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-muted-foreground">
                      No sales records match this query.
                    </td>
                  </tr>
                )}
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setMemoSale(sale)}
                    className="hover:bg-accent/20 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-semibold text-primary">{sale.invoiceNumber}</td>
                    <td className="p-3 font-medium text-foreground">{sale.productName}</td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{sale.customerName}</div>
                      <div className="text-xs text-muted-foreground">{sale.customerPhone}</div>
                    </td>
                    <td className="p-3 text-xs">{new Date(sale.saleDate).toLocaleDateString()}</td>
                    <td className="p-3 text-center font-bold text-foreground">{sale.quantity}</td>
                    <td className="p-3 text-right font-medium text-muted-foreground">{fmt(sale.sellingPrice)}</td>
                    <td className="p-3 text-right font-bold text-foreground">{fmt(sale.totalPrice)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemoSale(sale);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border rounded-md hover:bg-accent font-semibold transition-all text-primary border-primary/25 cursor-pointer"
                      >
                        <Printer className="size-3.5" /> Memo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: ADD GADGET ──────────────────────────── */}
      {addModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" onClick={() => setAddModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Boxes className="size-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Add New Gadget</h2>
                    <p className="text-xs text-muted-foreground">Add new gadgets and accessory stock</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddGadgetSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-muted-foreground">Product Name *</span>
                    <input
                      type="text"
                      required
                      value={addForm.productName}
                      onChange={(e) => setAddForm({ ...addForm, productName: e.target.value })}
                      placeholder="e.g. Apple AirPods Pro 2"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Color *</span>
                    <input
                      type="text"
                      required
                      value={addForm.color}
                      onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                      placeholder="e.g. White, Black"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Quantity *</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={addForm.quantity}
                      onChange={(e) => setAddForm({ ...addForm, quantity: Math.max(1, Number(e.target.value)) })}
                      placeholder="Quantity"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Purchase Price (Tk) *</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={addForm.purchasePrice || ""}
                      onChange={(e) => setAddForm({ ...addForm, purchasePrice: Math.max(0, Number(e.target.value)) })}
                      placeholder="e.g. 22000"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Min Selling Price (Tk) *</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={addForm.minSellingPrice || ""}
                      onChange={(e) => setAddForm({ ...addForm, minSellingPrice: Math.max(0, Number(e.target.value)) })}
                      placeholder="e.g. 25000"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Supplier Name *</span>
                    <input
                      type="text"
                      required
                      value={addForm.supplierName}
                      onChange={(e) => setAddForm({ ...addForm, supplierName: e.target.value })}
                      placeholder="Wholesale supplier"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Supplier Phone *</span>
                    <input
                      type="text"
                      required
                      value={addForm.supplierPhone}
                      onChange={(e) => setAddForm({ ...addForm, supplierPhone: e.target.value })}
                      placeholder="+880..."
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-muted-foreground">Details (optional)</span>
                    <textarea
                      value={addForm.details}
                      onChange={(e) => setAddForm({ ...addForm, details: e.target.value })}
                      placeholder="Additional specs or remarks..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </label>
                </div>

                {/* Profit Estimate Summary */}
                <div className="bg-muted/30 p-3 rounded-lg border border-dashed flex justify-between text-xs mt-2">
                  <div>
                    <span className="text-muted-foreground">Target Profit margin: </span>
                    <span
                      className={`font-bold ml-1 ${
                        addForm.minSellingPrice >= addForm.purchasePrice ? "text-success" : "text-destructive"
                      }`}
                    >
                      {fmt(addForm.minSellingPrice - addForm.purchasePrice)} / unit
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Markup: </span>
                    <span className="font-bold text-foreground ml-1">
                      {addForm.minSellingPrice > 0
                        ? (((addForm.minSellingPrice - addForm.purchasePrice) / addForm.minSellingPrice) * 100).toFixed(
                            1
                          )
                        : "0.0"}
                      %
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-muted/50">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Add Gadget
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL 2: SELL GADGET ─────────────────────────── */}
      {sellModalOpen && selectedGadget && (
        <>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" onClick={() => setSellModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-success/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-success/10 flex items-center justify-center">
                    <ShoppingCart className="size-5 text-success" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Sell Gadget</h2>
                    <p className="text-xs text-muted-foreground">Register customer purchase transaction</p>
                  </div>
                </div>
                <button
                  onClick={() => setSellModalOpen(false)}
                  className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Product Info Summary */}
              <div className="bg-primary/5 border border-primary/15 mx-6 mt-4 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{selectedGadget.productName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Color: {selectedGadget.color} · Min Price: {fmt(selectedGadget.minSellingPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Available Stock</div>
                  <div className="text-sm font-extrabold text-primary">
                    {getGadgetAvailableQuantity(selectedGadget, sales)} units
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSellGadgetSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-muted-foreground">Customer Name *</span>
                    <input
                      type="text"
                      required
                      value={sellForm.customerName}
                      onChange={(e) => setSellForm({ ...sellForm, customerName: e.target.value })}
                      placeholder="e.g. Mahmudul Hasan"
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Customer Phone *</span>
                    <input
                      type="text"
                      required
                      value={sellForm.customerPhone}
                      onChange={(e) => setSellForm({ ...sellForm, customerPhone: e.target.value })}
                      placeholder="+880..."
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Quantity to Sell *</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={getGadgetAvailableQuantity(selectedGadget, sales)}
                      value={sellForm.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        const maxVal = getGadgetAvailableQuantity(selectedGadget, sales);
                        setSellForm({ ...sellForm, quantity: Math.min(val, maxVal) });
                      }}
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Selling Price (Tk / Unit) *</span>
                    <input
                      type="number"
                      required
                      min={selectedGadget.minSellingPrice}
                      value={sellForm.sellingPrice || ""}
                      onChange={(e) => setSellForm({ ...sellForm, sellingPrice: Math.max(0, Number(e.target.value)) })}
                      placeholder={String(selectedGadget.minSellingPrice)}
                      className="input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">Payment Method</span>
                    <select
                      value={sellForm.paymentMethod}
                      onChange={(e) => setSellForm({ ...sellForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer h-[38px]"
                    >
                      {["Cash", "Card", "Mobile Banking", "Bank Transfer"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-muted-foreground">Warranty (days)</span>
                    <input
                      type="number"
                      min="0"
                      value={sellForm.warrantyDays || ""}
                      onChange={(e) => setSellForm({ ...sellForm, warrantyDays: Math.max(0, Number(e.target.value)) })}
                      placeholder="e.g. 365 days (0 for no warranty)"
                      className="input"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 pl-0.5">
                      {sellForm.warrantyDays > 0 ? (
                        <span className="text-success font-medium">
                          Expires: {new Date(Date.now() + sellForm.warrantyDays * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      ) : (
                        <span>No warranty cover applicable for accessories</span>
                      )}
                    </span>
                  </label>

                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-semibold text-muted-foreground">Remarks / Notes</span>
                    <input
                      type="text"
                      value={sellForm.notes}
                      onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                      placeholder="Optional remarks"
                      className="input"
                    />
                  </label>
                </div>

                {/* Validation Warnings */}
                {sellForm.sellingPrice < selectedGadget.minSellingPrice && sellForm.sellingPrice > 0 && (
                  <div className="bg-destructive/15 text-destructive p-3 rounded-lg border border-destructive/20 text-xs flex items-center gap-2">
                    <BadgeAlert className="size-4 shrink-0" />
                    <span>Selling price is below the Minimum Selling Price of {fmt(selectedGadget.minSellingPrice)}!</span>
                  </div>
                )}

                {/* Total Invoice Estimate Summary */}
                <div className="bg-muted/30 p-4 rounded-xl border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Sale Price</span>
                    <div className="text-xl font-bold text-foreground">
                      {fmt(Number(sellForm.quantity) * Number(sellForm.sellingPrice))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Unit profit</span>
                    <div className="text-sm font-semibold text-success">
                      {fmt(Number(sellForm.sellingPrice) - selectedGadget.purchasePrice)}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setSellModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-muted text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sellForm.sellingPrice < selectedGadget.minSellingPrice}
                    className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                      sellForm.sellingPrice < selectedGadget.minSellingPrice
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50 border"
                        : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                    }`}
                  >
                    <Check className="size-4" /> Confirm Sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL 3: GADGET DETAIL VIEW ──────────────────── */}
      {detailModalOpen && selectedGadget && (
        <>
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-40" onClick={() => setDetailModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b bg-muted/20">
                <h3 className="font-semibold text-lg flex items-center gap-2.5 text-foreground">
                  <Boxes className="size-5 text-primary" />
                  Gadget Specifications
                </h3>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-lg transition-all cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      getGadgetAvailableQuantity(selectedGadget, sales) > 0
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {getGadgetAvailableQuantity(selectedGadget, sales) > 0
                      ? `${getGadgetAvailableQuantity(selectedGadget, sales)} Available in Stock`
                      : "Out of Stock"}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Info className="size-3.5 text-primary" /> Product Specs
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Product Name</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">{selectedGadget.productName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Color</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">{selectedGadget.color}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Initial Quantity</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">
                        {selectedGadget.quantity} units
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Registered on</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">
                        {new Date(selectedGadget.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details text area */}
                {selectedGadget.details && (
                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Product Details</div>
                    <div className="text-xs p-3 rounded-lg border bg-muted/20 text-foreground">
                      {selectedGadget.details}
                    </div>
                  </div>
                )}

                {/* Supplier info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <User className="size-3.5 text-primary" /> Supplier Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Supplier Name</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">{selectedGadget.supplierName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Supplier Contact</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">
                        {selectedGadget.supplierPhone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <DollarSign className="size-3.5 text-primary" /> Pricing Sheet
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Purchase Cost</div>
                      <div className="text-sm font-bold text-foreground mt-1">{fmt(selectedGadget.purchasePrice)}</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Min Sell Price</div>
                      <div className="text-sm font-bold text-foreground mt-1">
                        {fmt(selectedGadget.minSellingPrice)}
                      </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Profit/Unit</div>
                      <div className="text-sm font-bold text-success mt-1">
                        {fmt(selectedGadget.minSellingPrice - selectedGadget.purchasePrice)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t bg-muted/10 flex justify-end gap-2">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-5 py-2 text-sm rounded-lg border hover:bg-muted font-semibold transition-all cursor-pointer"
                >
                  Close
                </button>
                {getGadgetAvailableQuantity(selectedGadget, sales) > 0 && (
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openSellModal(selectedGadget);
                    }}
                    className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                  >
                    <ShoppingCart className="size-4" /> Sell Gadget
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL 4: INVOICE / MEMO PRINT DIALOG ─────────── */}
      {memoSale && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-transparent"
          onClick={() => setMemoSale(null)}
        >
          <div
            className="bg-card rounded-xl max-w-2xl w-full max-h-[92vh] overflow-auto shadow-2xl border print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:static"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toolbar - hidden during print */}
            <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 print:hidden">
              <h3 className="font-semibold flex items-center gap-2">
                <Printer className="size-4 text-primary" /> Invoice Memo
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all cursor-pointer"
                >
                  <Printer className="size-3.5" /> Print Memo
                </button>
                <button
                  onClick={() => setMemoSale(null)}
                  className="p-1.5 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Printable Memo Area */}
            <div className="p-8 space-y-6 print:p-6 print-area">
              <div className="flex justify-between items-start border-b pb-5">
                <div>
                  <div className="text-2xl font-bold tracking-tight">IMEI GUARDIAN PRO</div>
                  <div className="text-xs text-muted-foreground">Premium Smart Device & Accessories Store</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-muted-foreground font-bold">Sales Invoice Memo</div>
                  <div className="font-mono font-bold text-foreground text-sm">{memoSale.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(memoSale.saleDate).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs uppercase text-muted-foreground font-bold mb-1.5">Billed To:</div>
                  <div className="font-bold text-sm text-foreground">{memoSale.customerName}</div>
                  <div className="text-xs text-muted-foreground mt-1">{memoSale.customerPhone}</div>
                  <div className="text-xs text-muted-foreground">Customer</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground font-bold mb-1.5">Payment Details:</div>
                  <div className="text-xs flex justify-between gap-3 border-b pb-1">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-bold text-foreground">{memoSale.paymentMethod}</span>
                  </div>
                  <div className="text-xs flex justify-between gap-3 border-b py-1">
                    <span className="text-muted-foreground">Invoice Status</span>
                    <span className="font-bold text-success">Paid</span>
                  </div>
                  <div className="text-xs flex justify-between gap-3 border-b py-1">
                    <span className="text-muted-foreground">Warranty Cover</span>
                    <span className="font-medium">
                      {memoSale.warrantyDays && memoSale.warrantyDays > 0 && memoSale.warrantyExpiry ? (
                        `Active (${memoSale.warrantyDays} Days — Expires ${new Date(memoSale.warrantyExpiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })})`
                      ) : (
                        "No warranty cover applicable for accessories"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-sm border-t border-b">
                <thead>
                  <tr className="text-xs uppercase text-muted-foreground">
                    <th className="text-left py-2.5">Gadget Description</th>
                    <th className="text-center py-2.5">Qty</th>
                    <th className="text-right py-2.5">Unit Price</th>
                    <th className="text-right py-2.5">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-4">
                      <div className="font-bold text-foreground text-sm">{memoSale.productName}</div>
                    </td>
                    <td className="py-4 text-center font-bold text-foreground">{memoSale.quantity}</td>
                    <td className="py-4 text-right font-medium text-muted-foreground">{fmt(memoSale.sellingPrice)}</td>
                    <td className="py-4 text-right font-bold text-foreground">{fmt(memoSale.totalPrice)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between font-bold text-base border-t pt-2.5">
                    <span className="text-foreground">Total Billed Price</span>
                    <span className="text-primary">{fmt(memoSale.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Remarks / Notes */}
              {memoSale.notes && (
                <div className="text-xs text-muted-foreground border-t pt-4">
                  <span className="font-semibold text-foreground">Memo Notes: </span>
                  {memoSale.notes}
                </div>
              )}

              {/* Invoice footer */}
              <div className="text-center text-[10px] text-muted-foreground pt-6 border-t border-dashed">
                This is a system generated e-invoice. Thank you for choosing IMEI Guardian Pro!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

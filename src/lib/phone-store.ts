export type Sale = {
  id: string;
  // phone
  imei: string;
  barcode: string;
  brand: string;
  model: string;
  variant: string;
  color: string;
  ram: string;
  storage: string;
  purchasePrice: number;
  sellingPrice: number;
  // customer
  customerName: string;
  customerPhone: string;
  altPhone: string;
  email: string;
  nid: string;
  address: string;
  // sale
  invoiceNumber: string;
  saleDate: string; // ISO
  quantity: number;
  discount: number;
  finalPrice: number;
  paymentMethod: string;
  salesPerson: string;
  warrantyExpiry: string; // ISO date
  notes: string;
  // ownership history
  ownership: { owner: string; phone: string; transferDate: string; note: string }[];
};

const KEY = "phone_sales_v1";

export function loadSales(): Sale[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveSales(sales: Sale[]) {
  localStorage.setItem(KEY, JSON.stringify(sales));
}
export function addSale(sale: Sale) {
  const all = loadSales();
  all.unshift(sale);
  saveSales(all);
}
export function updateSale(id: string, patch: Partial<Sale>) {
  const all = loadSales().map((s) => (s.id === id ? { ...s, ...patch } : s));
  saveSales(all);
}

export function profit(s: Sale) {
  return s.finalPrice - s.purchasePrice;
}

export function warrantyStatus(s: Sale) {
  const exp = new Date(s.warrantyExpiry).getTime();
  const now = Date.now();
  const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return { active: days >= 0, days };
}

export function nextInvoiceNumber() {
  const all = loadSales();
  const n = all.length + 1;
  return `INV-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`;
}

export function seedIfEmpty() {
  if (loadSales().length > 0) return;
  const demo: Sale[] = [
    {
      id: crypto.randomUUID(),
      imei: "356789012345678", barcode: "BC0001",
      brand: "Apple", model: "iPhone 15 Pro", variant: "Pro", color: "Titanium Blue",
      ram: "8GB", storage: "256GB", purchasePrice: 115000, sellingPrice: 135000,
      customerName: "John Doe", customerPhone: "+8801711111111", altPhone: "",
      email: "john@example.com", nid: "1990123456", address: "Dhaka, BD",
      invoiceNumber: "INV-2026-00001", saleDate: new Date(Date.now() - 86400000 * 30).toISOString(),
      quantity: 1, discount: 2000, finalPrice: 133000, paymentMethod: "Card",
      salesPerson: "Rahim", warrantyExpiry: new Date(Date.now() + 86400000 * 335).toISOString(),
      notes: "Original box included.",
      ownership: [{ owner: "John Doe", phone: "+8801711111111", transferDate: new Date(Date.now() - 86400000 * 30).toISOString(), note: "First buyer" }],
    },
    {
      id: crypto.randomUUID(),
      imei: "987654321098765", barcode: "BC0002",
      brand: "Samsung", model: "Galaxy S25 Ultra", variant: "Ultra", color: "Phantom Black",
      ram: "12GB", storage: "512GB", purchasePrice: 140000, sellingPrice: 165000,
      customerName: "John Doe", customerPhone: "+8801711111111", altPhone: "",
      email: "john@example.com", nid: "1990123456", address: "Dhaka, BD",
      invoiceNumber: "INV-2026-00002", saleDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      quantity: 1, discount: 0, finalPrice: 165000, paymentMethod: "Cash",
      salesPerson: "Karim", warrantyExpiry: new Date(Date.now() + 86400000 * 360).toISOString(),
      notes: "",
      ownership: [{ owner: "John Doe", phone: "+8801711111111", transferDate: new Date(Date.now() - 86400000 * 5).toISOString(), note: "First buyer" }],
    },
    ...inStockDemoItems(),
  ];
  saveSales(demo);
}

/** Append in-stock demo items if none exist yet (safe to call any time) */
export function ensureInStockDemo() {
  const all = loadSales();
  const hasStock = all.some((s) => !s.customerName);
  if (hasStock) return;
  saveSales([...inStockDemoItems(), ...all]);
}

function inStockDemoItems(): Sale[] {
  return [
    {
      id: "demo-stock-001",
      imei: "111222333444555", barcode: "BC0003",
      brand: "Samsung", model: "Galaxy A55", variant: "Global", color: "Awesome Iceblue",
      ram: "8GB", storage: "128GB", purchasePrice: 38000, sellingPrice: 45000,
      customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
      invoiceNumber: "INV-2026-00003", saleDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
      salesPerson: "Rahim", warrantyExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
      notes: "Brand new, sealed box.",
      ownership: [],
    },
    {
      id: "demo-stock-002",
      imei: "222333444555666", barcode: "BC0004",
      brand: "Xiaomi", model: "14 Ultra", variant: "Global", color: "Titanium Gray",
      ram: "16GB", storage: "512GB", purchasePrice: 95000, sellingPrice: 112000,
      customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
      invoiceNumber: "INV-2026-00004", saleDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
      salesPerson: "Karim", warrantyExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
      notes: "",
      ownership: [],
    },
    {
      id: "demo-stock-003",
      imei: "333444555666777", barcode: "BC0005",
      brand: "OnePlus", model: "12R", variant: "Global", color: "Iron Gray",
      ram: "8GB", storage: "256GB", purchasePrice: 42000, sellingPrice: 52000,
      customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
      invoiceNumber: "INV-2026-00005", saleDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
      salesPerson: "Rahim", warrantyExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
      notes: "Comes with original charger.",
      ownership: [],
    },
    {
      id: "demo-stock-004",
      imei: "444555666777888", barcode: "BC0006",
      brand: "Apple", model: "iPhone 14", variant: "USA", color: "Midnight",
      ram: "6GB", storage: "128GB", purchasePrice: 72000, sellingPrice: 88000,
      customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
      invoiceNumber: "INV-2026-00006", saleDate: new Date(Date.now() - 86400000 * 10).toISOString(),
      quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
      salesPerson: "Karim", warrantyExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
      notes: "",
      ownership: [],
    },
    {
      id: "demo-stock-005",
      imei: "555666777888999", barcode: "BC0007",
      brand: "Google", model: "Pixel 8 Pro", variant: "Global", color: "Porcelain",
      ram: "12GB", storage: "256GB", purchasePrice: 85000, sellingPrice: 99000,
      customerName: "", customerPhone: "", altPhone: "", email: "", nid: "", address: "",
      invoiceNumber: "INV-2026-00007", saleDate: new Date(Date.now() - 86400000 * 1).toISOString(),
      quantity: 1, discount: 0, finalPrice: 0, paymentMethod: "Cash",
      salesPerson: "Rahim", warrantyExpiry: new Date(Date.now() + 86400000 * 365).toISOString(),
      notes: "7 years of OS updates guaranteed.",
      ownership: [],
    },
  ];
}

export type PartnerTransaction = {
  id: string;
  partner: "Mehedi" | "Rauf";
  amount: number;
  type: "Investment" | "Withdrawal";
  date: string; // ISO date string
  notes: string;
};

export type ShopExpense = {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO date string
  notes: string;
};

const PARTNER_KEY = "partner_transactions_v1";
const EXPENSE_KEY = "shop_expenses_v1";

export function loadPartnerTransactions(): PartnerTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PARTNER_KEY);
    if (!data) {
      const initial: PartnerTransaction[] = [
        { id: "p1", partner: "Mehedi", amount: 500000, type: "Investment", date: "2026-05-01T10:00:00.000Z", notes: "Initial shop setup capital" },
        { id: "p2", partner: "Rauf", amount: 400000, type: "Investment", date: "2026-05-02T10:00:00.000Z", notes: "Initial shop setup capital" },
        { id: "p3", partner: "Mehedi", amount: 100000, type: "Investment", date: "2026-05-15T14:30:00.000Z", notes: "Extra inventory purchase" },
        { id: "p4", partner: "Rauf", amount: 200000, type: "Investment", date: "2026-05-20T11:15:00.000Z", notes: "Extra inventory purchase" },
        { id: "p5", partner: "Mehedi", amount: 50000, type: "Withdrawal", date: "2026-06-05T18:00:00.000Z", notes: "Personal emergency withdrawal" },
        { id: "p6", partner: "Rauf", amount: 30000, type: "Withdrawal", date: "2026-06-06T15:45:00.000Z", notes: "Personal utility payment" },
      ];
      localStorage.setItem(PARTNER_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function savePartnerTransactions(txs: PartnerTransaction[]) {
  localStorage.setItem(PARTNER_KEY, JSON.stringify(txs));
}

export function loadShopExpenses(): ShopExpense[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(EXPENSE_KEY);
    if (!data) {
      const initial: ShopExpense[] = [
        { id: "e1", category: "Rent", amount: 20000, date: "2026-05-01T09:00:00.000Z", notes: "Shop Rent (May)" },
        { id: "e2", category: "Internet", amount: 1500, date: "2026-05-05T12:00:00.000Z", notes: "Broadband Bill (May)" },
        { id: "e3", category: "Electricity", amount: 4500, date: "2026-05-10T16:00:00.000Z", notes: "PDB Electricity Bill (May)" },
        { id: "e4", category: "Salary", amount: 10000, date: "2026-05-28T18:00:00.000Z", notes: "Sales Assistant salary (May)" },
        { id: "e5", category: "Others", amount: 2000, date: "2026-05-12T14:00:00.000Z", notes: "Tea & snacks for customers" },
        { id: "e6", category: "Rent", amount: 20000, date: "2026-06-01T09:00:00.000Z", notes: "Shop Rent (June)" },
        { id: "e7", category: "Internet", amount: 1500, date: "2026-06-05T12:00:00.000Z", notes: "Broadband Bill (June)" },
        { id: "e8", category: "Electricity", amount: 4800, date: "2026-06-10T15:30:00.000Z", notes: "PDB Electricity Bill (June)" },
        { id: "e9", category: "Salary", amount: 12000, date: "2026-06-11T18:00:00.000Z", notes: "Sales Assistant salary + sales commission (June)" },
      ];
      localStorage.setItem(EXPENSE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveShopExpenses(exps: ShopExpense[]) {
  localStorage.setItem(EXPENSE_KEY, JSON.stringify(exps));
}

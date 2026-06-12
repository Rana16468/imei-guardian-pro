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

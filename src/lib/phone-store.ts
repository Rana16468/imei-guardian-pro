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
  ];
  saveSales(demo);
}

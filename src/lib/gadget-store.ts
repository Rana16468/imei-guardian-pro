export type Gadget = {
  id: string;
  supplierName: string;
  productName: string;
  quantity: number; // original total stock registered
  purchasePrice: number;
  minSellingPrice: number;
  supplierPhone: string;
  color: string;
  details?: string;
  createdAt: string; // ISO Date
};

export type GadgetSale = {
  id: string;
  gadgetId: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  saleDate: string; // ISO
  quantity: number; // quantity sold in this transaction
  sellingPrice: number; // selling price per unit
  totalPrice: number;
  paymentMethod: string;
  invoiceNumber: string;
  notes?: string;
  salesPerson?: string;
  warrantyDays?: number;
  warrantyExpiry?: string;
};

const GADGETS_KEY = "gadgets_v1";
const SALES_KEY = "gadget_sales_v1";

export function loadGadgets(): Gadget[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GADGETS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGadgets(gadgets: Gadget[]) {
  localStorage.setItem(GADGETS_KEY, JSON.stringify(gadgets));
}

export function loadGadgetSales(): GadgetSale[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SALES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveGadgetSales(sales: GadgetSale[]) {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function addGadget(gadget: Gadget) {
  const all = loadGadgets();
  all.unshift(gadget);
  saveGadgets(all);
}

export function deleteGadget(id: string) {
  const all = loadGadgets().filter((g) => g.id !== id);
  saveGadgets(all);
  // Also clean up sales of this gadget if any
  const sales = loadGadgetSales().filter((s) => s.gadgetId !== id);
  saveGadgetSales(sales);
}

export function updateGadget(id: string, patch: Partial<Gadget>) {
  const all = loadGadgets().map((g) => (g.id === id ? { ...g, ...patch } : g));
  saveGadgets(all);
}

export function getGadgetSoldQuantity(gadgetId: string, sales: GadgetSale[]): number {
  return sales
    .filter((s) => s.gadgetId === gadgetId)
    .reduce((sum, s) => sum + s.quantity, 0);
}

export function getGadgetAvailableQuantity(gadget: Gadget, sales: GadgetSale[]): number {
  const sold = getGadgetSoldQuantity(gadget.id, sales);
  return Math.max(0, gadget.quantity - sold);
}

export function nextGadgetInvoiceNumber(): string {
  const all = loadGadgetSales();
  const n = all.length + 1;
  return `G-INV-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`;
}

export function seedGadgetsIfEmpty() {
  if (typeof window === "undefined") return;
  const currentGadgets = loadGadgets();
  const currentSales = loadGadgetSales();

  if (currentGadgets.length > 0) return;

  const gadget1Id = "gadget-seed-001";
  const gadget2Id = "gadget-seed-002";

  // Seeding 7 original stock total
  const seededGadgets: Gadget[] = [
    {
      id: gadget1Id,
      supplierName: "Apple Wholesale Ltd",
      productName: "AirPods Pro 2 (USB-C)",
      quantity: 5,
      purchasePrice: 22000,
      minSellingPrice: 25000,
      supplierPhone: "+8801823456789",
      color: "White",
      details: "MagSafe Charging Case (USB‑C) with speaker and lanyard loop",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: gadget2Id,
      supplierName: "Galaxy Distributors",
      productName: "Samsung Galaxy Watch 6 (44mm)",
      quantity: 2,
      purchasePrice: 28000,
      minSellingPrice: 31000,
      supplierPhone: "+8801912345678",
      color: "Graphite",
      details: "Super AMOLED screen, Body composition analysis, Sleep tracking",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Seeding 2 sales of AirPods Pro 2, leaving 3 AirPods + 2 Galaxy Watches = 5 available stock.
  const seededSales: GadgetSale[] = [
    {
      id: "sale-seed-001",
      gadgetId: gadget1Id,
      productName: "AirPods Pro 2 (USB-C)",
      customerName: "Mahmudul Hasan",
      customerPhone: "+8801712345678",
      saleDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 1,
      sellingPrice: 26000,
      totalPrice: 26000,
      paymentMethod: "Cash",
      invoiceNumber: "G-INV-2026-00001",
      notes: "Original seal-broken memo issued.",
      salesPerson: "Rahim",
    },
    {
      id: "sale-seed-002",
      gadgetId: gadget1Id,
      productName: "AirPods Pro 2 (USB-C)",
      customerName: "Farhana Yasmin",
      customerPhone: "+8801598765432",
      saleDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 1,
      sellingPrice: 26500,
      totalPrice: 26500,
      paymentMethod: "Mobile Banking",
      invoiceNumber: "G-INV-2026-00002",
      notes: "Paid via bKash.",
      salesPerson: "Karim",
    },
  ];

  saveGadgets(seededGadgets);
  saveGadgetSales(seededSales);
}

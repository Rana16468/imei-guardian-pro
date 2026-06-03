import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadSales, seedIfEmpty, Sale } from "@/lib/phone-store";
import { fmt, PageHeader } from "@/lib/phone-ui";
import { Package } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — PhoneTrack" }] }),
  component: Inventory,
});

function Inventory() {
  const [sales, setSales] = useState<Sale[]>([]);
  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, []);

  // Group by brand+model: count sold, revenue
  const stock = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; sold: number; revenue: number; profit: number }>();
    sales.forEach((s) => {
      const key = `${s.brand}::${s.model}`;
      const existing = map.get(key) || { brand: s.brand, model: s.model, sold: 0, revenue: 0, profit: 0 };
      existing.sold += s.quantity;
      existing.revenue += s.finalPrice;
      existing.profit += s.finalPrice - s.purchasePrice;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.sold - a.sold);
  }, [sales]);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Inventory Insights" subtitle="Aggregated movement by brand and model" />
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Phone</th>
              <th className="text-right p-3">Units Sold</th>
              <th className="text-right p-3">Total Revenue</th>
              <th className="text-right p-3">Total Profit</th>
              <th className="text-right p-3">Avg. Margin</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.brand + s.model} className="border-t hover:bg-accent/30">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Package className="size-4" />
                    </div>
                    <div>
                      <div className="font-medium">{s.model}</div>
                      <div className="text-xs text-muted-foreground">{s.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-semibold">{s.sold}</td>
                <td className="p-3 text-right">{fmt(s.revenue)}</td>
                <td className="p-3 text-right text-success">{fmt(s.profit)}</td>
                <td className="p-3 text-right">{s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : "0"}%</td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No inventory data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

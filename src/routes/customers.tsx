import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadSales, seedIfEmpty, Sale, warrantyStatus } from "@/lib/phone-store";
import { fmt, PageHeader, DetailModal } from "@/lib/phone-ui";
import { User } from "lucide-react";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — PhoneTrack" }] }),
  component: Customers,
});

function Customers() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Sale[]>();
    sales.forEach((s) => {
      const key = s.customerPhone || s.customerName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    let arr = Array.from(map.values());
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter((g) => g[0].customerName.toLowerCase().includes(t) || g[0].customerPhone.toLowerCase().includes(t));
    }
    return arr;
  }, [sales, q]);

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Customers" subtitle={`${groups.length} customers tracked`}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Filter customers..."
          className="input w-64"
        />
      </PageHeader>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map((g) => {
          const c = g[0];
          const spent = g.reduce((a, s) => a + s.finalPrice, 0);
          return (
            <div key={c.customerPhone + c.customerName} className="bg-card rounded-xl border p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  <User className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.customerName}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.customerPhone}</div>
                  {c.email && <div className="text-xs text-muted-foreground truncate">{c.email}</div>}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{g.length}×</span>
              </div>
              <div className="space-y-2 border-t pt-3">
                {g.map((s) => {
                  const w = warrantyStatus(s);
                  return (
                    <button key={s.id} onClick={() => setSelected(s)} className="w-full flex items-center justify-between text-sm hover:bg-accent/40 rounded p-1.5 -mx-1.5 text-left">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.brand} {s.model}</div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">IMEI: {s.imei}</div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs">{new Date(s.saleDate).toLocaleDateString()}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                          {w.active ? `${w.days}d` : "Expired"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-semibold">{fmt(spent)}</span>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && <div className="text-muted-foreground text-sm col-span-full text-center py-12">No customers found.</div>}
      </div>
      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadSales, seedIfEmpty, Sale, warrantyStatus } from "@/lib/phone-store";
import { PageHeader, DetailModal } from "@/lib/phone-ui";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/warranty")({
  head: () => ({ meta: [{ title: "Warranty — PhoneTrack" }] }),
  component: Warranty,
});

function Warranty() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "expiring" | "expired">("all");
  const [selected, setSelected] = useState<Sale | null>(null);
  useEffect(() => { seedIfEmpty(); setSales(loadSales()); }, []);

  const data = useMemo(() => sales.map((s) => ({ s, w: warrantyStatus(s) })), [sales]);
  const active = data.filter((d) => d.w.active);
  const expiring = data.filter((d) => d.w.active && d.w.days <= 30);
  const expired = data.filter((d) => !d.w.active);

  const filtered = filter === "active" ? active : filter === "expiring" ? expiring : filter === "expired" ? expired : data;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      <PageHeader title="Warranty Tracking" subtitle="Monitor active coverage and expirations" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FilterCard active={filter === "all"} onClick={() => setFilter("all")} label="All" value={data.length} icon={Shield} tone="primary" />
        <FilterCard active={filter === "active"} onClick={() => setFilter("active")} label="Active" value={active.length} icon={ShieldCheck} tone="success" />
        <FilterCard active={filter === "expiring"} onClick={() => setFilter("expiring")} label="Expiring (≤30d)" value={expiring.length} icon={ShieldAlert} tone="warning" />
        <FilterCard active={filter === "expired"} onClick={() => setFilter("expired")} label="Expired" value={expired.length} icon={ShieldAlert} tone="destructive" />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">IMEI</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Expiry</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ s, w }) => (
              <tr key={s.id} onClick={() => setSelected(s)} className="border-t hover:bg-accent/30 cursor-pointer">
                <td className="p-3 font-mono text-xs">{s.imei}</td>
                <td className="p-3">{s.brand} {s.model}</td>
                <td className="p-3">{s.customerName}</td>
                <td className="p-3 text-xs">{new Date(s.warrantyExpiry).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    !w.active ? "bg-destructive/15 text-destructive" :
                    w.days <= 30 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
                  }`}>
                    {w.active ? `${w.days} days left` : "Expired"}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No items.</td></tr>}
          </tbody>
        </table>
      </div>
      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterCard({ active, onClick, label, value, icon: Icon, tone }: any) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <button onClick={onClick} className={`text-left bg-card rounded-xl border p-4 transition ${active ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`size-8 rounded-md flex items-center justify-center ${tones[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </button>
  );
}

import { Sale, profit, warrantyStatus } from "./phone-store";
import React from "react";
import { Receipt, Users, Wallet, Shield, X, Printer } from "lucide-react";

export function fmt(n: number) {
  return "Tk " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}
export function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function SalesTable({ sales, onSelect, compact }: { sales: Sale[]; onSelect?: (s: Sale) => void; compact?: boolean }) {
  if (sales.length === 0) return <div className="p-10 text-center text-sm text-muted-foreground">No sales found.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="text-left p-3">Invoice</th>
            {!compact && <th className="text-left p-3">IMEI</th>}
            <th className="text-left p-3">Phone</th>
            <th className="text-left p-3">Customer</th>
            <th className="text-left p-3">Date</th>
            <th className="text-right p-3">Price</th>
            {!compact && <th className="text-right p-3">Profit</th>}
            <th className="text-left p-3">Warranty</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => {
            const w = warrantyStatus(s);
            return (
              <tr key={s.id} onClick={() => onSelect?.(s)}
                className={`border-t hover:bg-accent/40 ${onSelect ? "cursor-pointer" : ""}`}>
                <td className="p-3 font-mono text-xs">{s.invoiceNumber}</td>
                {!compact && <td className="p-3 font-mono text-xs">{s.imei}</td>}
                <td className="p-3">{s.brand} {s.model}</td>
                <td className="p-3"><div className="font-medium">{s.customerName}</div><div className="text-xs text-muted-foreground">{s.customerPhone}</div></td>
                <td className="p-3 text-xs">{new Date(s.saleDate).toLocaleDateString()}</td>
                <td className="p-3 text-right font-medium">{fmt(s.finalPrice)}</td>
                {!compact && <td className="p-3 text-right text-success">{fmt(profit(s))}</td>}
                <td className="p-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {w.active ? `${w.days}d` : "Expired"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DetailModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const w = warrantyStatus(sale);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
          <h3 className="font-semibold flex items-center gap-2"><Receipt className="size-4 text-primary" /> {sale.invoiceNumber}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="IMEI" value={sale.imei} mono />
            <InfoRow label="Barcode" value={sale.barcode || "—"} />
            <InfoRow label="Brand / Model" value={`${sale.brand} ${sale.model}`} />
            <InfoRow label="Variant" value={`${sale.variant || "—"} · ${sale.color || "—"}`} />
            <InfoRow label="RAM / Storage" value={`${sale.ram} / ${sale.storage}`} />
            <InfoRow label="Sale Date" value={new Date(sale.saleDate).toLocaleString()} />
          </div>
          <Divider icon={Users} label="Customer" />
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Name" value={sale.customerName} />
            <InfoRow label="Phone" value={sale.customerPhone} />
            <InfoRow label="Email" value={sale.email || "—"} />
            <InfoRow label="Address" value={sale.address || "—"} />
          </div>
          <Divider icon={Wallet} label="Pricing" />
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Purchase" value={fmt(sale.purchasePrice)} />
            <Metric label="Final Price" value={fmt(sale.finalPrice)} />
            <Metric label="Profit" value={fmt(profit(sale))} positive={profit(sale) >= 0} />
          </div>
          <Divider icon={Shield} label="Warranty" />
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${w.active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {w.active ? `Active — ${w.days} days remaining` : "Warranty Expired"}
            <span className="text-xs opacity-70">until {new Date(sale.warrantyExpiry).toLocaleDateString()}</span>
          </div>
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">Ownership History</h4>
            <div className="space-y-2">
              {sale.ownership.map((o, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded bg-muted/40">
                  <div>
                    <div className="text-sm font-medium">{o.owner} <span className="text-xs text-muted-foreground">({o.note})</span></div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(o.transferDate).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <Icon className="size-3.5 text-primary" />
      <span className="text-xs uppercase text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
export function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

export function CustomerMemoModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const finalPrice = sale.finalPrice || sale.sellingPrice;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-transparent" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[92vh] overflow-auto shadow-2xl border print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none print:static" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card print:hidden">
          <h3 className="font-semibold flex items-center gap-2">
            <Receipt className="size-4 text-primary" /> Customer Memo
          </h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all cursor-pointer">
              <Printer className="size-3.5" /> Print Memo
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg cursor-pointer"><X className="size-4" /></button>
          </div>
        </div>
        <div className="p-8 space-y-6 print:p-6 print-area">
          <div className="flex justify-between items-start border-b pb-5">
            <div>
              <div className="text-2xl font-bold tracking-tight">IMEI GUARDIAN PRO</div>
              <div className="text-xs text-muted-foreground">Premium Smart Device Store</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground">Sales Memo</div>
              <div className="font-mono font-semibold">{sale.invoiceNumber}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(sale.saleDate).toLocaleString("en-GB", {
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
              <div className="text-xs uppercase text-muted-foreground mb-1.5">Customer Details</div>
              <div className="font-medium text-sm">{sale.customerName || "—"}</div>
              <div className="text-xs text-muted-foreground mt-1">{sale.customerPhone}</div>
              {sale.email && <div className="text-xs text-muted-foreground">{sale.email}</div>}
              {sale.address && <div className="text-xs text-muted-foreground">{sale.address}</div>}
              {sale.nid && <div className="text-[10px] text-muted-foreground mt-1 font-mono">NID: {sale.nid}</div>}
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground mb-1.5">Sale Info</div>
              <div className="text-xs flex justify-between gap-3 border-b pb-1"><span className="text-muted-foreground">Payment Method</span><span className="font-medium">{sale.paymentMethod}</span></div>
              <div className="text-xs flex justify-between gap-3 border-b py-1"><span className="text-muted-foreground">Warranty Period</span><span className="font-medium">Active (Expires {new Date(sale.warrantyExpiry).toLocaleDateString()})</span></div>
              <div className="text-xs flex justify-between gap-3 border-b py-1"><span className="text-muted-foreground">Invoice Date</span><span className="font-medium">{new Date(sale.saleDate).toLocaleDateString()}</span></div>
            </div>
          </div>

          <table className="w-full text-sm border-t border-b">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="text-left py-2.5">Device Description</th>
                <th className="text-left py-2.5">IMEI</th>
                <th className="text-center py-2.5">Qty</th>
                <th className="text-right py-2.5">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-3.5">
                  <div className="font-semibold text-sm">{sale.brand} {sale.model}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sale.variant} · {sale.color} · {sale.ram} / {sale.storage}</div>
                </td>
                <td className="py-3.5 font-mono text-xs">{sale.imei}</td>
                <td className="py-3.5 text-center">1</td>
                <td className="py-3.5 text-right font-semibold">{fmt(finalPrice)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between font-bold text-base border-t pt-2.5"><span className="text-foreground">Total Buying Price</span><span className="text-primary">{fmt(finalPrice)}</span></div>
            </div>
          </div>

          {sale.notes && (
            <div className="text-xs text-muted-foreground border-t pt-4">
              <span className="font-semibold">Declaration/Notes: </span>{sale.notes}
            </div>
          )}
          <div className="text-center text-[10px] text-muted-foreground pt-6 border-t border-dashed">This is a system generated e-invoice. Thank you for choosing IMEI Guardian Pro!</div>
        </div>
      </div>
    </div>
  );
}

export function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${positive === false ? "text-destructive" : positive ? "text-success" : ""}`}>{value}</div>
    </div>
  );
}

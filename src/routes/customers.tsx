import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadSales, seedIfEmpty, Sale, warrantyStatus } from "@/lib/phone-store";
import { fmt, PageHeader, DetailModal } from "@/lib/phone-ui";
import { AppPagination } from "@/components/ui/pagination";
import {
  User, LayoutGrid, List, Search, Calendar,
  CreditCard, Smartphone, Shield, Eye, UserCheck
} from "lucide-react";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — PhoneTrack" }] }),
  component: Customers,
});

function Customers() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    seedIfEmpty();
    setSales(loadSales());
  }, []);

  // Reset pagination on filter or view mode change
  useEffect(() => {
    setPage(1);
  }, [q, viewMode]);

  // Only consider items that have actually been sold
  const soldSales = useMemo(() => {
    return sales.filter((s) => s.customerName && s.customerName.trim() !== "");
  }, [sales]);

  // Grouped by customer (for Grid View)
  const groups = useMemo(() => {
    const map = new Map<string, Sale[]>();
    soldSales.forEach((s) => {
      const key = s.customerPhone?.trim() || s.customerName.trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });

    let arr = Array.from(map.values());
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter((g) =>
        g[0].customerName.toLowerCase().includes(t) ||
        g[0].customerPhone.toLowerCase().includes(t) ||
        g[0].email?.toLowerCase().includes(t) ||
        g.some((s) =>
          s.brand.toLowerCase().includes(t) ||
          s.model.toLowerCase().includes(t) ||
          s.imei.toLowerCase().includes(t)
        )
      );
    }

    // Sort by latest purchase date
    return arr.sort((a, b) => {
      const dateA = new Date(a[0].saleDate).getTime();
      const dateB = new Date(b[0].saleDate).getTime();
      return dateB - dateA;
    });
  }, [soldSales, q]);

  // Flat list of sales (for Table View)
  const flatSales = useMemo(() => {
    let arr = [...soldSales];
    if (q.trim()) {
      const t = q.toLowerCase();
      arr = arr.filter((s) =>
        s.customerName.toLowerCase().includes(t) ||
        s.customerPhone.toLowerCase().includes(t) ||
        s.email?.toLowerCase().includes(t) ||
        s.brand.toLowerCase().includes(t) ||
        s.model.toLowerCase().includes(t) ||
        s.imei.toLowerCase().includes(t) ||
        s.invoiceNumber.toLowerCase().includes(t) ||
        (s.salesPerson && s.salesPerson.toLowerCase().includes(t))
      );
    }
    // Sort by date descending
    return arr.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
  }, [soldSales, q]);

  // Pagination calculations
  const pageSize = viewMode === "grid" ? 6 : 10;
  const totalItems = viewMode === "grid" ? groups.length : flatSales.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedGroups = useMemo(() => {
    const start = (page - 1) * pageSize;
    return groups.slice(start, start + pageSize);
  }, [groups, page, pageSize]);

  const paginatedFlatSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return flatSales.slice(start, start + pageSize);
  }, [flatSales, page, pageSize]);

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Customers & Sales Info"
        subtitle={`${soldSales.length} total transactions · ${groups.length} customers tracked`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Bar */}
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by client, number, email, device, imei..."
              className="input w-64 pl-9"
            />
          </div>

          {/* Grid/Table Toggle Button */}
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </PageHeader>

      {/* Grid View rendering */}
      {viewMode === "grid" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedGroups.map((g) => {
              const c = g[0];
              const spent = g.reduce((a, s) => a + s.finalPrice, 0);
              return (
                <div
                  key={c.customerPhone + c.customerName}
                  className="bg-card rounded-xl border p-5 flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-4">
                      <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        <User className="size-5.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-base truncate">{c.customerName}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.customerPhone}</div>
                        {c.email && (
                          <div className="text-xs text-muted-foreground/80 truncate mt-0.5">{c.email}</div>
                        )}
                        {c.address && (
                          <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{c.address}</div>
                        )}
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {g.length} unit{g.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2.5 border-t pt-3.5">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Purchased Devices</div>
                      {g.map((s) => {
                        const w = warrantyStatus(s);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelected(s)}
                            className="w-full flex items-center justify-between text-sm hover:bg-accent/40 rounded-lg p-2 -mx-2 text-left border border-transparent hover:border-border/30 transition-all"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground truncate">
                                {s.brand} {s.model}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                                IMEI: {s.imei}
                              </div>
                              <div className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                                <UserCheck className="size-3" /> Salesperson: {s.salesPerson || "—"}
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3 flex flex-col items-end gap-1">
                              <div className="font-bold text-foreground">{fmt(s.finalPrice)}</div>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                                  w.active
                                    ? "bg-success/15 text-success"
                                    : "bg-destructive/15 text-destructive"
                                }`}
                              >
                                {w.active ? `${w.days}d left` : "Expired"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t flex justify-between items-center text-sm">
                    <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Total Spent</span>
                    <span className="font-extrabold text-foreground text-base">{fmt(spent)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {groups.length === 0 && (
            <div className="text-muted-foreground text-sm text-center py-16 border rounded-xl bg-card border-dashed">
              No customers found. Try a different search query.
            </div>
          )}
        </div>
      )}

      {/* Table View rendering */}
      {viewMode === "table" && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="p-3.5 text-left font-bold">Invoice</th>
                    <th className="p-3.5 text-left font-bold">Client / Contact</th>
                    <th className="p-3.5 text-left font-bold">Device specs</th>
                    <th className="p-3.5 text-left font-bold">IMEI</th>
                    <th className="p-3.5 text-left font-bold flex items-center gap-1"><Calendar className="size-3.5" /> Date</th>
                    <th className="p-3.5 text-right font-bold">Price</th>
                    <th className="p-3.5 text-left font-bold"><UserCheck className="size-3.5 inline mr-1" />Salesperson</th>
                    <th className="p-3.5 text-center font-bold"><Shield className="size-3.5 inline mr-1" />Warranty</th>
                    <th className="p-3.5 text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedFlatSales.map((s) => {
                    const w = warrantyStatus(s);
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className="hover:bg-accent/20 cursor-pointer transition-colors"
                      >
                        <td className="p-3.5 font-mono text-xs font-bold text-primary">
                          {s.invoiceNumber}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">{s.customerName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{s.customerPhone}</div>
                          {s.email && (
                            <div className="text-[10px] text-muted-foreground/80 truncate max-w-[160px] mt-0.5">{s.email}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-foreground">
                            {s.brand} {s.model}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.ram || "—"} / {s.storage || "—"} · {s.color || "—"}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-xs text-foreground">
                          {s.imei}
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground">
                          {new Date(s.saleDate).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="font-bold text-foreground">{fmt(s.finalPrice)}</div>
                          <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">{s.paymentMethod}</div>
                        </td>
                        <td className="p-3.5 text-sm text-muted-foreground">
                          {s.salesPerson || "—"}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                              w.active
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {w.active ? `${w.days}d` : "Expired"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelected(s)}
                            className="p-1.5 rounded-md border hover:bg-accent hover:text-foreground text-muted-foreground transition-all cursor-pointer shadow-sm"
                            title="View Memo Detail"
                          >
                            <Eye className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {flatSales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-16 text-center text-muted-foreground">
                        No sales found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalItems)} of {totalItems} items
          </div>
          <AppPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {selected && <DetailModal sale={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

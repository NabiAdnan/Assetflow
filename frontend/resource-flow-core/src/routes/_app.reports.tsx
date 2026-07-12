import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileText, Download, Loader2, Table, LayoutList, PieChart, FileSpreadsheet
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Exports — AssetFlow" },
      { name: "description", content: "Generate and export reports for assets, bookings, transfers, and maintenance logs." },
    ],
  }),
  component: ReportsPage,
});

type ReportType = "assets" | "bookings" | "transfers" | "maintenance";

function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("assets");

  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery<any[]>({
    queryKey: ["report", reportType],
    queryFn: async () => {
      const res = await api.get(`/reports/${reportType}`);
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (payload && typeof payload === "object") {
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.items)) return payload.items;
      }
      return [];
    },
    retry: false,
  });

  // Convert JSON data to CSV and trigger download
  function handleExportCsv() {
    if (!reportData || reportData.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    try {
      const headers = Object.keys(reportData[0]);
      const csvRows = [
        headers.join(","), // Header row
        ...reportData.map((row) =>
          headers
            .map((header) => {
              const val = row[header];
              // Escape double quotes and wrap in quotes if commas/newlines exist
              const escaped = ("" + (val === null || val === undefined ? "" : val))
                .replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(",")
        ),
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `assetflow_${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Export downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate CSV file.");
    }
  }

  // Column labels for report tables
  const columnHeaders: Record<ReportType, string[]> = {
    assets: ["Asset Tag", "Name", "Status", "Dept ID", "Holder ID", "Location"],
    bookings: ["ID", "Resource ID", "Employee ID", "Start Time", "End Time", "Purpose", "Status"],
    transfers: ["ID", "Asset ID", "From Employee", "To Employee", "Request Date", "Status"],
    maintenance: ["ID", "Asset ID", "Reported By", "Issue", "Technician", "Status"],
  };

  const dataKeys: Record<ReportType, string[]> = {
    assets: ["asset_tag", "name", "status", "department", "holder", "location"],
    bookings: ["id", "resource_id", "employee_id", "start_time", "end_time", "purpose", "status"],
    transfers: ["id", "asset_id", "from_employee", "to_employee", "request_date", "status"],
    maintenance: ["id", "asset_id", "reported_by", "issue", "technician", "status"],
  };

  return (
    <div className="mx-auto max-w-300 space-y-6">
      {/* Title Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analytics</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Reports & Exports</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Aggregate transactional and inventory history to review audits and compliance data.
          </p>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-surface border border-border p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Label htmlFor="report-select" className="text-sm font-semibold shrink-0">Report Type:</Label>
          <Select value={reportType} onValueChange={(val) => setReportType(val as ReportType)}>
            <SelectTrigger id="report-select" className="w-50 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assets">Assets Inventory</SelectItem>
              <SelectItem value="bookings">Resource Bookings</SelectItem>
              <SelectItem value="transfers">Holdings Transfers</SelectItem>
              <SelectItem value="maintenance">Maintenance Logs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExportCsv}
          className="gap-2 h-10"
          variant="default"
          disabled={!reportData || reportData.length === 0 || isLoading}
        >
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      {/* Report Data Preview Table */}
      <div className="surface-card p-0 overflow-hidden border border-border rounded-xl">
        <div className="bg-muted/40 p-4 border-b border-border flex items-center gap-2">
          <Table className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Data Preview Table</h3>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            Failed to retrieve report data. Please check backend status.
          </div>
        ) : !reportData || reportData.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <FileSpreadsheet className="size-12 opacity-30 mb-2 text-muted-foreground" />
            <p className="text-sm">No records found for this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  {columnHeaders[reportType].map((header, idx) => (
                    <th key={idx} className="p-3.5 font-semibold text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.slice(0, 10).map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border last:border-0 hover:bg-muted/10">
                    {dataKeys[reportType].map((key, keyIdx) => {
                      const val = row[key];
                      let displayVal = "";
                      if (val === true) displayVal = "Yes";
                      else if (val === false) displayVal = "No";
                      else if (val === null || val === undefined) displayVal = "—";
                      else if (typeof val === "string" && (val.includes("T") || val.includes("-"))) {
                        // Check if looks like ISO datetime
                        const d = new Date(val);
                        if (!isNaN(d.getTime()) && val.length > 8) {
                          displayVal = d.toLocaleString();
                        } else {
                          displayVal = val;
                        }
                      } else {
                        displayVal = String(val);
                      }

                      return (
                        <td key={keyIdx} className="p-3.5 text-foreground truncate max-w-50">
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {reportData.length > 10 && (
              <div className="bg-muted/20 p-3 text-center text-muted-foreground border-t border-border">
                Showing top 10 preview rows. Download CSV to access the full {reportData.length} records.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

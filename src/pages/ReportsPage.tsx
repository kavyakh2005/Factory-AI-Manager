import React, { useState, useEffect } from 'react';
import {
  ReportService,
  SalesReportData,
  ProductionReportData,
  InventoryReportData,
  CashflowReportData,
} from '../services/reports/reportService';
import { Button } from '../components/common/Button';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  IndianRupee,
  Factory,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SALES' | 'PRODUCTION' | 'INVENTORY' | 'CASHFLOW'>('SALES');
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  const [salesReport, setSalesReport] = useState<SalesReportData | null>(null);
  const [prodReport, setProdReport] = useState<ProductionReportData | null>(null);
  const [invReport, setInvReport] = useState<InventoryReportData | null>(null);
  const [cashflowReport, setCashflowReport] = useState<CashflowReportData | null>(null);

  useEffect(() => {
    loadAllReports();
  }, [startDate, endDate]);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const [sales, prod, inv, cash] = await Promise.all([
        ReportService.getSalesReport({ startDate, endDate }),
        ReportService.getProductionReport(),
        ReportService.getInventoryReport(),
        ReportService.getCashflowReport({ startDate, endDate }),
      ]);
      setSalesReport(sales);
      setProdReport(prod);
      setInvReport(inv);
      setCashflowReport(cash);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'SALES' && salesReport) {
      ReportService.exportToCSV('sales_by_customer_report', salesReport.customerWise);
    } else if (activeTab === 'PRODUCTION' && prodReport) {
      ReportService.exportToCSV('production_stage_report', prodReport.stageWiseOutput);
    } else if (activeTab === 'INVENTORY' && invReport) {
      ReportService.exportToCSV('inventory_valuation_report', invReport.topConsumedItems);
    } else if (activeTab === 'CASHFLOW' && cashflowReport) {
      ReportService.exportToCSV('cashflow_summary_report', [
        {
          Total_Collections: cashflowReport.totalCollections,
          Supplier_Payouts: cashflowReport.totalSupplierPayouts,
          Factory_Expenses: cashflowReport.totalExpenses,
          Net_Cashflow: cashflowReport.netCashflow,
          Receivables: cashflowReport.receivablesOutstanding,
          Payables: cashflowReport.payablesOutstanding,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Factory Business Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Live management reports for Shree Raas Krishnam Creation based on real transactional data
          </p>
        </div>
        <Button
          variant="secondary"
          className="flex items-center gap-2"
          onClick={handleExportCSV}
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </Button>
      </div>

      {/* Date Filter Strip */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date Period:
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1.5 ml-auto">
          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
              setEndDate(new Date().toISOString().slice(0, 10));
            }}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
              setEndDate(new Date().toISOString().slice(0, 10));
            }}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              setStartDate('2026-01-01');
              setEndDate(new Date().toISOString().slice(0, 10));
            }}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition"
          >
            Year to Date
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('SALES')}
          className={`pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'SALES'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          Sales & Order Volume
        </button>
        <button
          onClick={() => setActiveTab('PRODUCTION')}
          className={`pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'PRODUCTION'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Factory className="w-4 h-4 shrink-0" />
          Production & Defects
        </button>
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'INVENTORY'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          Inventory Valuation
        </button>
        <button
          onClick={() => setActiveTab('CASHFLOW')}
          className={`pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'CASHFLOW'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <IndianRupee className="w-4 h-4 shrink-0" />
          Cashflow & Profitability
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Computing analytics from database...</div>
      ) : (
        <>
          {/* TAB 1: SALES & ORDERS */}
          {activeTab === 'SALES' && salesReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Total Orders in Range</p>
                  <p className="text-2xl font-bold text-white mt-1">{salesReport.totalOrders}</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Total Garments Ordered</p>
                  <p className="text-2xl font-bold text-indigo-300 mt-1">
                    {salesReport.totalPieces.toLocaleString('en-IN')} pcs
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Gross Sales Revenue</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ₹{salesReport.totalOrderValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Avg. Order Value (AOV)</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ₹{salesReport.averageOrderValue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer-wise sales table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <div className="p-4 border-b border-slate-800 font-semibold text-white text-sm">
                  Customer-Wise Revenue Breakdown
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="p-3">Customer / Buyer</th>
                      <th className="p-3 text-right">Orders Placed</th>
                      <th className="p-3 text-right">Total Pieces</th>
                      <th className="p-3 text-right">Total Revenue (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {salesReport.customerWise.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-white">{c.customerName}</td>
                        <td className="p-3 text-right">{c.orderCount}</td>
                        <td className="p-3 text-right font-medium text-indigo-300">
                          {c.pieces.toLocaleString('en-IN')} pcs
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400">
                          ₹{c.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTION */}
          {activeTab === 'PRODUCTION' && prodReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Total Planned Output</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {prodReport.totalPlanned.toLocaleString('en-IN')} pcs
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Total Finished Production</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {prodReport.totalProduced.toLocaleString('en-IN')} pcs
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">QC Rejections / Wastage</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {prodReport.totalRejected.toLocaleString('en-IN')} pcs
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Overall Rejection Rate</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    {prodReport.overallRejectionRate}%
                  </p>
                </div>
              </div>

              {/* Stage-wise table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <div className="p-4 border-b border-slate-800 font-semibold text-white text-sm">
                  Stage-Wise Production Output
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="p-3">Production Stage</th>
                      <th className="p-3 text-right">Processed Quantity</th>
                      <th className="p-3 text-right">Rejected Quantity</th>
                      <th className="p-3 text-right">Quality Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {prodReport.stageWiseOutput.map((stg, idx) => {
                      const total = stg.produced + stg.rejected;
                      const passRate = total > 0 ? Math.round((stg.produced / total) * 100) : 100;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="p-3 font-semibold text-white">{stg.stage}</td>
                          <td className="p-3 text-right font-medium text-emerald-400">
                            {stg.produced.toLocaleString('en-IN')} pcs
                          </td>
                          <td className="p-3 text-right font-medium text-red-400">
                            {stg.rejected.toLocaleString('en-IN')} pcs
                          </td>
                          <td className="p-3 text-right font-bold text-indigo-300">{passRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'INVENTORY' && invReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Total Inventory Valuation</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ₹{invReport.totalValuation.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Raw Material Stock Value</p>
                  <p className="text-2xl font-bold text-indigo-300 mt-1">
                    ₹{invReport.rawMaterialValuation.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Finished Garments Stock</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    ₹{invReport.finishedGoodsValuation.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Critical Low Stock SKUs</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    {invReport.lowStockItemsCount} SKUs
                  </p>
                </div>
              </div>

              {/* Top inventory items valuation */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <div className="p-4 border-b border-slate-800 font-semibold text-white text-sm">
                  SKU-Wise Stock Balance & Valuation
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-xs uppercase font-medium text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="p-3">Item / Material Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Available Stock</th>
                      <th className="p-3 text-right">Total Valuation (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invReport.topConsumedItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="p-3 font-semibold text-white">{it.itemName}</td>
                        <td className="p-3 text-xs text-slate-400">{it.category}</td>
                        <td className="p-3 text-right font-medium text-white">
                          {it.stock.toLocaleString('en-IN')} {it.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400">
                          ₹{it.valuation.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CASHFLOW & PROFITABILITY */}
          {activeTab === 'CASHFLOW' && cashflowReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Total Customer Collections (+)</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ₹{cashflowReport.totalCollections.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Supplier Disbursements (-)</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">
                    ₹{cashflowReport.totalSupplierPayouts.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Factory Operational Expenses (-)</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    ₹{cashflowReport.totalExpenses.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Net Operational Cash Balance</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Calculated as (Collections - Supplier Payouts - Factory Overhead Expenses)
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-3xl font-extrabold ${
                      cashflowReport.netCashflow >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    ₹{cashflowReport.netCashflow.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Uncollected Market Receivables</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    ₹{cashflowReport.receivablesOutstanding.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Pending payments due from customers</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400">Pending Mill / Vendor Payables</p>
                  <p className="text-2xl font-bold text-indigo-300 mt-1">
                    ₹{cashflowReport.payablesOutstanding.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Outstanding bills due to raw material suppliers</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

# 🎨 Factory AI Manager — UI & UX Design System Specification

> **Identity**: Shree Raas Krishnam Creation — Industrial Modern High-Contrast Theme  
> **Target Viewports**: Mobile Phones (320px–430px), Tablets (768px–1024px), Desktop & 4K Displays (1280px–1920px+)  
> **Key Metric**: Zero Page-Level Horizontal Overflow & Full Touch Target Accessibility ($\ge 44\text{px}$).

---

## 1. Responsive Layout & Navigation Architecture

```
+-------------------------------------------------------------------------------------------------+
|  [ ☰ Menu ] 🏭 FACTORY AI PRO     [ 🔍 Search (Ctrl K) ]   [ 📶 Online ] [ 🔔 Alerts ] [ 👤 User ]|
+---------------------+---------------------------------------------------------------------------+
|  [Desktop Sidebar]  |                                                                           |
|  - Dashboard        |                               MAIN VIEWPORT                               |
|  - Orders           |                                                                           |
|  - Production       |   - Responsive KPI Cards (1-col mobile, 2-col tablet, 4-col desktop)      |
|  - Inventory        |   - Adaptive Size Matrices (Horizontal internal scroll / dynamic wrap)    |
|  - Purchases        |   - 7-Stage Pipeline Kanban / Table                                       |
|  - Dispatch         |   - Tabular Data wrapped in internal scroll containers                    |
|  - Products         |   - Conversational AI Shell & Executive Briefing                          |
|  - Sets & Sizes     |                                                                           |
|  - Customers        |                                                                           |
|  - Suppliers        |                                                                           |
|  - Payments         |                                                                           |
|  - Expenses         |                                                                           |
|  - Reports          |                                                                           |
|  - AI Manager (✨)  |                                                                           |
|  - Notifications    |                                                                           |
|  - Settings         |                                                                           |
+---------------------+---------------------------------------------------------------------------+
|  [Mobile Drawer] ➔ Slides out smoothly on < 1024px screens with backdrop & auto-close on select |
+-------------------------------------------------------------------------------------------------+
```

---

## 2. Design Tokens & Color Palette

- **Background Palette**:
  - `factory-950`: `#080C14` (Deepest canvas)
  - `factory-900`: `#0F172A` (Surface & Card backgrounds)
  - `factory-800`: `#1E293B` (Input fields & borders)
- **Accent & State Colors**:
  - **Primary Indigo**: `#6366F1` (Primary buttons, active states, branding)
  - **Success Emerald**: `#10B981` (Completed batches, positive cashflow, passing QC)
  - **Warning Amber**: `#F59E0B` (Pending batches, uncollected receivables, delay warnings)
  - **Danger Rose**: `#EF4444` (Defects, QC rejections, overdue dates, low stock alerts)
  - **AI Sparkle Gradient**: `from-indigo-600 via-purple-600 to-pink-500`

---

## 3. Responsive Breakpoint Rules

| Device Class | Viewport Range | Navigation Mode | Form / Grid Behavior | Table Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (Compact)** | `320px` – `430px` | Overlay Drawer (Hamburger) | Single-column stacked forms | Internal `overflow-x-auto` |
| **Tablet** | `768px` – `1024px` | Responsive Drawer / Compact | 2-column grid layouts | Optimized width table |
| **Desktop / Wide** | `1280px` – `1920px+` | Persistent Left Sidebar | Multi-column full layout | Full expansive data table |

---

## 4. Complete Screen Specifications (All 17 Modules)

1. **Dashboard (`/dashboard`)**: KPI metric cards, AI Executive Briefing summary, live streams for recent orders and shop-floor batches.
2. **Orders (`/orders`)**: 2D size-matrix piece booking, automatic tax and line totals, status filters, and order details view.
3. **Production (`/production`)**: 7-stage pipeline Kanban/Table switcher, bottleneck delay alert banner, size-wise piece output and QC defect logger modal.
4. **Inventory (`/inventory`)**: Live stock balance tabs (Raw Materials, WIP, Finished Goods), In/Out stock adjustment modal, and immutable movement ledger.
5. **Purchases (`/purchases`)**: Supplier procurement PO generator, line items, and dock receiving modal.
6. **Dispatch (`/dispatch`)**: Delivery manifests, carton counts, tracking LR numbers, and transporter logs.
7. **Products (`/products`)**: Style catalog, tech-pack specs, fabric details, cost/selling price margins, and assigned sets.
8. **Sets & Sizes (`/sets-sizes`)**: Garment sets manager with 1-click presets (`Standard 38-46`, `Plus 48-52`, `Kids 24-32`, `Alpha S-XXL`), inline custom size adder, and size dimensions master.
9. **Customers (`/customers`)**: Wholesale buyer directory, credit terms, and GST details with full CRUD.
10. **Suppliers (`/suppliers`)**: Raw material mill vendors, material categories, and bank accounts with full CRUD.
11. **Payments (`/payments`)**: Financial cashflow ledger for customer receipts and supplier disbursements.
12. **Expenses (`/expenses`)**: Factory overhead voucher logging across categories with total cost summaries.
13. **Reports (`/reports`)**: Executive analytics for sales, production output, inventory valuation, and cash balance with CSV export.
14. **AI Manager (`/ai-manager`)**: Gemini 1.5 Flash grounded assistant, Executive Daily Briefing, Fabric Lay Plan Estimator, QC Defect Root-Cause Analyzer, and RAG Context Inspector.
15. **Notifications (`/notifications`)**: Real-time operational warnings for low stock, delays, and receivables.
16. **Settings (`/settings`)**: Factory profile, GSTIN, currency, tax rates, staff RBAC directory, and audit logs.
17. **Login (`/login`)**: Centered authentication card with pre-configured Factory Owner quick-fill button.

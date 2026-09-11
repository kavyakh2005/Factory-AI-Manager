# 🎨 Factory AI Manager — UI & UX Specification

> **Design System**: Industrial Modern / High-Contrast Dark Theme  
> **Target Devices**: Desktop Monitors, Laptops, and Tablet Shop-Floor Terminals

---

## 1. Design Principles & Aesthetics

- **Industrial Dark-Mode Palette**: Deep slate background (`#0B0F17`, `#0F172A`, `#1E293B`) with emerald, amber, and indigo accents.
- **High-Contrast Typography**: Clean sans-serif typography (Inter / Outfit) with bold metric indicators.
- **Shop-Floor Usability**:
  - High-visibility quantity cells with numeric matrix steppers.
  - Color-coded badges for statuses (`CONFIRMED`, `IN_PRODUCTION`, `READY_FOR_DISPATCH`, `COMPLETED`, `CANCELLED`).
  - Real-time search filters on every master directory.
  - Keyboard accessible modal dialogs with escape handling.

---

## 2. Global Navigation & Layout Architecture

```
+---------------------------------------------------------------------------------------+
|  🏭 FACTORY AI MANAGER       [ 🔍 Global Search ]    [ 🔔 Live Alerts (4) ] [ 👤 Owner ]|
+-------------------+-------------------------------------------------------------------+
|  📊 Dashboard     |                                                                   |
|  👥 Customers     |                                                                   |
|  🏭 Suppliers     |                         MAIN VIEWPORT                             |
|  📐 Sets & Sizes  |                                                                   |
|  👔 Products      |          - Real-Time KPI Cards                                    |
|  📝 Orders        |          - Interactive Size Matrices                              |
|  ⚙️ Production    |          - 5-Stage Floor Tracking                                 |
|  📦 Inventory     |          - Stock Transaction Ledger                               |
|  🛒 Purchases     |          - Financial Summaries & CSV Export                       |
|  🚚 Dispatch      |                                                                   |
|  💳 Payments      |                                                                   |
|  📑 Expenses      |                                                                   |
|  📈 Reports       |                                                                   |
|  ⚙️ Settings       |                                                                   |
+-------------------+-------------------------------------------------------------------+
```

---

## 3. Screen-by-Screen Specifications

### 3.1. 📊 Executive Dashboard (`/dashboard`)
- **Top Metric Cards**:
  - Active Orders & Orders Due Today / Delayed.
  - Today's Planned vs Produced Quantities.
  - Current Stock Alerts count.
  - Net Receivables (Customer Inflows) vs Net Payables (Supplier Outflows).
- **AI Daily Briefing**: Live rule-based natural language summaries highlighting operational priorities.
- **Recent Activity Feeds**: Direct view of newest orders and active production batches.

### 3.2. 👥 Customer Management (`/customers`)
- **Searchable Directory**: Customer code, company name, contact person, phone, email, GSTIN, credit limits.
- **Add / Edit Modal**: Form validating phone numbers, GST numbers, payment terms (`Net 30 Days`), and billing/shipping addresses.
- **Full CRUD Capabilities**: Add new customers, Edit existing details with live modal pre-filling, and Delete customer records with safety confirmation.

### 3.3. 🏭 Supplier Management (`/suppliers`)
- **Vendor Directory**: Material categories (Fabric, Trims, Packaging), contact details, GST numbers, pending balances.
- **Add / Edit / Delete**: Full supplier profiling with material category tags, live editing, and single-click deletion.

### 3.4. 📐 Sets & Sizes Master (`/sets-sizes`)
- **Sets Manager**: Create, edit, and delete custom sets (e.g. Standard Set, Extra Set, Kids Set, Plus Set).
- **Smart Quick Presets**: 1-click auto-selection buttons for rapid set configuration:
  - ⚡ **Standard (38-46)**: Automatically selects sizes 38, 40, 42, 44, 46.
  - ⚡ **Plus Size (48-52)**: Automatically selects sizes 48, 50, 52.
  - ⚡ **Kids Run (24-32)**: Automatically selects sizes 24, 26, 28, 30, 32.
  - ⚡ **Alpha (S-XXL)**: Automatically selects sizes S, M, L, XL, XXL.
- **Inline Custom Size Creator**: Add custom sizes on the fly directly inside the Set Creation modal without navigating away.
- **Sizes Master Table**: Configure individual size labels with Chest, Waist, and Length dimensions, with Edit and Delete options.
- **Auto-Seeded Standard Catalog**: 22 standard factory sizes available out-of-the-box.

### 3.5. 👔 Products Master (`/products`)
- **Catalog Grid**: Thumbnail, SKU code, category, fabric composition, cost price, selling price, gross margin %, and linked sets.
- **Product Creator & Editor**: Links one or multiple sets to each apparel style.
- **Full Lifecycle Operations**: Create, Edit, View Set Breakdown, and Delete products with relational cleanup.

### 3.6. 📝 Orders & Size Matrix (`/orders`)
- **Interactive 2D Matrix Booking**:
  - Customer selection and dynamic pricing.
  - Dynamic rendering of size input fields based on the selected set:
    ```
    [ Size 38: (50) ] [ Size 40: (100) ] [ Size 42: (150) ] [ Size 44: (100) ] [ Size 46: (50) ]
    ```
  - Instant automatic calculation of Total Pieces, Subtotal, GST (5% / 12% / 18%), and Grand Total.
- **Order Lifecycle & Management**: Progress orders across stages, edit order details, or delete canceled/obsolete orders.

### 3.7. ⚙️ Production Floor Tracking (`/production`)
- **Batch Management**: Production orders tied to confirmed customer orders.
- **5-Stage Pipeline**:
  ```
  [1. Cutting] ➔ [2. Stitching] ➔ [3. Finishing] ➔ [4. Quality Check (QC)] ➔ [5. Packing]
  ```
- **Piece Logging Modal**: Records passed quantity and rejected pieces with operator notes and timestamps.

### 3.8. 📦 Inventory & Stock Ledger (`/inventory`)
- **Categorized Tabs**: Raw Materials (Fabrics), Trims & Accessories, Packaging, Finished Goods.
- **Stock Management**: Add item, Edit item specifications & thresholds, Delete item, and record inward/outward adjustments.
- **Low Stock Warnings**: Visual high-contrast badges for items below minimum safety thresholds.
- **Append-Only Stock Ledger**: Complete chronological ledger of stock movements.

### 3.9. 🛒 Purchase Orders (`/purchases`)
- **PO Workflow**: Create, edit, and delete procurement orders for raw materials and trims.
- **Stock Inward**: Receive shipments directly into factory inventory with automatic ledger entry.

### 3.10. 🚚 Dispatch & Shipping (`/dispatch`)
- **Shipment Logging**: Record carrier name, vehicle number, LR/Bilty tracking number, and package count.
- **Order Fulfillment**: Automatically updates order statuses to `COMPLETED`.

### 3.11. 💳 Payments & Ledger (`/payments`)
- **Inflows & Outflows**: Log customer payments received and supplier payouts disbursed.
- **Financial Balances**: Real-time summary of net receivables and payables.

### 3.12. 📑 Factory Overheads & Expenses (`/expenses`)
- **Operational Expense Tracker**: Utilities, machine servicing, rent, packaging supplies, and staff welfare.

### 3.13. 📈 Reports & Analytics (`/reports`)
- **Comprehensive Reports**: Sales summary, production efficiency, inventory valuation, and cashflow.
- **1-Click CSV Export**: Downloads formatted `.csv` spreadsheets for accounting.

### 3.14. ⚙️ Settings & System Admin (`/settings`)
- **Factory Profile**: Legal name, address, GSTIN, currency symbol (`₹`), tax percentage with persistent sync (`localStorage` + Supabase `factory_settings`).
- **RBAC & User Management**:
  - Live Owner Account: `kavyakhandelwal57@gmail.com`
  - Multi-user directory with role assignment (Owner, Production Manager, Inventory Manager, Viewer).
  - Add New Team Member and Delete User accounts (with master owner deletion protection).
- **Audit Trail**: Immutable chronological log of all create, update, and delete actions across the factory system.

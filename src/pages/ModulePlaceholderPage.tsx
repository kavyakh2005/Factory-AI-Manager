import React from 'react';
import { ComingSoon } from '../components/common/ComingSoon';
import {
  ShoppingCart,
  Factory,
  Boxes,
  ShoppingBag,
  Truck,
  Package,
  Layers,
  Users,
  Building2,
  CreditCard,
  Receipt,
  BarChart3,
  Bot,
  Bell,
} from 'lucide-react';

interface ModuleConfig {
  name: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
  requiredRole?: string;
}

const MODULE_DATA: Record<string, ModuleConfig> = {
  orders: {
    name: 'Garment Order Management & Size Matrix',
    description: 'Capture wholesale garment orders with multi-set and multi-size matrix breakdown.',
    icon: <ShoppingCart className="w-8 h-8" />,
    highlights: [
      'Interactive 2D Size Matrix Grid for bulk entry across Standard & Extra sets',
      'Automatic calculation of piece totals, tax amounts, and payment reconciliations',
      'Real-time order stage tracker from Draft to Dispatched',
      'Direct order-to-production batch generation without manual data re-entry',
    ],
    requiredRole: 'Owner, Admin, Manager, Production Manager',
  },
  production: {
    name: 'Shop-Floor Production Pipeline & Stages',
    description: 'Visual garment production tracking across all 9 manufacturing stages.',
    icon: <Factory className="w-8 h-8" />,
    highlights: [
      'Kanban stage progression: Planning → Cutting → Stitching → Finishing → QC → Packing',
      'Per-size piece acceptance and rejection logger with defect reason categorisation',
      'Team & line operator productivity tracking and bottleneck detection',
      'Automatic work-in-progress (WIP) stock ledger updates upon stage completion',
    ],
    requiredRole: 'Owner, Admin, Manager, Production Manager, Staff',
  },
  inventory: {
    name: 'Transactional Stock Ledger & Warehouse',
    description: 'Immutable ledger tracking raw fabrics, trims, WIP, and finished garments.',
    icon: <Boxes className="w-8 h-8" />,
    highlights: [
      'Double-entry transaction audit: Purchase, Consumption, Production Output, Dispatch',
      'Zero stock overwrites: complete chronological running balances for every SKU',
      'Low-stock and safety threshold reorder triggers',
      'Fabric roll tracking and accessory spool balance management',
    ],
    requiredRole: 'Owner, Admin, Manager, Inventory Manager',
  },
  purchases: {
    name: 'Purchase Orders & Supplier Requisitions',
    description: 'Procurement of fabric rolls, threads, buttons, packaging, and raw materials.',
    icon: <ShoppingBag className="w-8 h-8" />,
    highlights: [
      'PO generation linked directly to low-stock alerts and order fabric demands',
      'Material receiving verification with partial delivery logging',
      'Automatic stock ledger ingestion upon goods arrival',
      'Supplier payment tracking and payment milestone management',
    ],
    requiredRole: 'Owner, Admin, Manager, Inventory Manager',
  },
  dispatch: {
    name: 'Dispatch, Logistics & Transporter Manifest',
    description: 'Manage garment packing, cartons, courier manifests, and customer delivery slips.',
    icon: <Truck className="w-8 h-8" />,
    highlights: [
      'Packing checklist and carton labeling by set and size',
      'Transport vehicle, LR number, and courier tracking details',
      'One-click Dispatch Note and Delivery Challan PDF generation',
      'Automatic deduction of finished goods from warehouse stock ledger',
    ],
    requiredRole: 'Owner, Admin, Manager, Inventory Manager',
  },
  products: {
    name: 'Product Master & Variant Management',
    description: 'Garment style master, fabric specifications, colorways, and cost-to-retail pricing.',
    icon: <Package className="w-8 h-8" />,
    highlights: [
      'Product master catalog with high-resolution garment imagery',
      'Variant SKU generator combining style, color swatch, and fabric type',
      'Dynamic linkage to one or multiple Sets (e.g. Standard Set + Extra Set)',
      'Cost price vs wholesale selling price margin analysis',
    ],
    requiredRole: 'Owner, Admin, Manager',
  },
  'sets-sizes': {
    name: 'Sets & Sizes Hierarchy Master',
    description: 'First-class garment business entities configured without hardcoded sizes.',
    icon: <Layers className="w-8 h-8" />,
    highlights: [
      'Create custom sets: Standard Set (38-46), Extra Set (48-52), Kids Set (24-32)',
      'Drag-and-drop size sequencing and garment measurement chart association',
      'Dynamic size matrix generation throughout Orders, Production, and Inventory',
      'Zero hardcoded sizes: fully configurable by Factory Administrator',
    ],
    requiredRole: 'Owner, Admin',
  },
  customers: {
    name: 'Customer Master & Retail Accounts',
    description: 'Wholesale buyers, retail chains, credit limits, and purchase histories.',
    icon: <Users className="w-8 h-8" />,
    highlights: [
      'Customer directory with GST compliance and credit limit controls',
      'Order history with most-purchased sets and sizes analysis',
      'Payment aging breakdown (0-30 days, 31-60 days, 60+ days)',
      'Direct customer statement generation and ledger export',
    ],
    requiredRole: 'Owner, Admin, Manager, Accountant',
  },
  suppliers: {
    name: 'Supplier Master & Textile Mills',
    description: 'Fabric mills, dye houses, accessory vendors, and delivery ratings.',
    icon: <Building2 className="w-8 h-8" />,
    highlights: [
      'Supplier catalog categorized by fabric types and materials supplied',
      'Procurement history and supplier on-time delivery performance scoring',
      'Payables ledger and pending purchase invoices',
    ],
    requiredRole: 'Owner, Admin, Manager, Inventory Manager, Accountant',
  },
  payments: {
    name: 'Payments, Receivables & Payables',
    description: 'Reconciliation of customer remittances, supplier payouts, and bank transfers.',
    icon: <CreditCard className="w-8 h-8" />,
    highlights: [
      'Multi-mode transaction recording: Bank Transfer, UPI, Cheque, Cash',
      'Direct order and purchase invoice reconciliation',
      'Overdue payment reminders and debtor aging ledger',
    ],
    requiredRole: 'Owner, Admin, Accountant',
  },
  expenses: {
    name: 'Factory Operational Expenses',
    description: 'Track plant electricity, maintenance, packaging supplies, and labor overtime.',
    icon: <Receipt className="w-8 h-8" />,
    highlights: [
      'Cost-center expense categorization with receipt attachment support',
      'Daily and monthly factory burn-rate analytics',
      'Approval workflows for high-value plant expenditure',
    ],
    requiredRole: 'Owner, Admin, Accountant',
  },
  reports: {
    name: 'Executive Analytics & BI Reports',
    description: 'Comprehensive factory reports with multi-dimensional date, set, and size filters.',
    icon: <BarChart3 className="w-8 h-8" />,
    highlights: [
      'Sales reports by Product, Set type, and individual Size breakdown',
      'Production line efficiency and defect rejection rates by stage',
      'Stock velocity and slow-moving fabric inventory analysis',
      'Instant Export to Excel (XLSX) and PDF report formats',
    ],
    requiredRole: 'Owner, Admin, Manager, Accountant',
  },
  'ai-manager': {
    name: 'Factory AI Manager Studio',
    description: 'Conversational factory copilot powered by deterministic backend analytical tools.',
    icon: <Bot className="w-8 h-8" />,
    highlights: [
      'Sandboxed tool calling: queries real database metrics without hallucinations',
      'Intelligent delay forecasting: identifies bottlenecks in cutting and stitching',
      'Size demand velocity: forecasts upcoming size shortages before stockouts happen',
      'Action Proposals: suggest priority cutting batches with user approval modals',
    ],
    requiredRole: 'Owner, Admin, Manager, Production Manager',
  },
  notifications: {
    name: 'Notifications & Shop-Floor Alerts',
    description: 'Real-time alert dispatch for delayed orders, low stock, and payment milestones.',
    icon: <Bell className="w-8 h-8" />,
    highlights: [
      'Critical alerts: delivery due tomorrow, fabric below safety threshold',
      'Warning alerts: production delay on line 2, payment overdue',
      'Success alerts: batch completed quality check, PO received',
    ],
    requiredRole: 'All Authorized Roles',
  },
};

interface ModulePlaceholderPageProps {
  moduleKey: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({ moduleKey }) => {
  const config = MODULE_DATA[moduleKey] || {
    name: 'Factory Module',
    description: 'Advanced garment manufacturing module.',
    icon: <Factory className="w-8 h-8" />,
    highlights: ['Database model established in Phase 1', 'UI and API planned for Phase 2'],
    requiredRole: 'Owner, Admin',
  };

  return (
    <ComingSoon
      moduleName={config.name}
      description={config.description}
      icon={config.icon}
      highlights={config.highlights}
      requiredRole={config.requiredRole}
    />
  );
};

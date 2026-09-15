import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  Layers,
  Package,
  ShoppingCart,
  Factory,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  Building2,
  CreditCard,
  Receipt,
  BarChart3,
  Bot,
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Smartphone,
  ChevronRight,
  ClipboardList,
  Check,
  Zap,
} from 'lucide-react';

interface GuideChapter {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: string;
  badge?: string;
  content: {
    summary: string;
    steps?: { step: number; title: string; desc: string; tip?: string; link?: { label: string; url: string } }[];
    rules?: { title: string; desc: string; iconType?: 'check' | 'alert' | 'info' }[];
    example?: { title: string; body: string };
    faqs?: { q: string; a: string }[];
  };
}

const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'quick-start',
    title: '1. Quick Start & Onboarding Roadmap',
    subtitle: 'Step-by-step setup order to make the entire factory operational in 5 minutes',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    category: 'GETTING STARTED',
    badge: 'Must Read First',
    content: {
      summary:
        'To prevent empty dropdowns and ensure all production and order calculations run smoothly, setup your factory data in this exact sequential order:',
      steps: [
        {
          step: 1,
          title: 'Create Size Sets & Measurements (/sets-sizes)',
          desc: 'First, define standard garment size sets (e.g. Standard Set: 38, 40, 42, 44, 46; Kids Set: 24, 26, 28, 30, 32). Without size sets, styles and production cannot calculate size breakdown.',
          link: { label: 'Go to Sets & Sizes', url: '/sets-sizes' },
        },
        {
          step: 2,
          title: 'Register Garment Styles in Product Master (/products)',
          desc: 'Create your permanent styles (e.g. Cotton Coord Set, SKU: CCS-101, Fabric: 100% Cotton, Cost: ₹450, Wholesale: ₹850) and link them to the size sets created in Step 1.',
          link: { label: 'Go to Product Master', url: '/products' },
        },
        {
          step: 3,
          title: 'Add B2B Customers & Suppliers (/customers & /suppliers)',
          desc: 'Add your wholesale retail buyers, shop owners, fabric mills, and yarn suppliers with credit limits and GST numbers.',
          link: { label: 'Go to Customers', url: '/customers' },
        },
        {
          step: 4,
          title: 'Plan Production or Book Orders (/production & /orders)',
          desc: 'Now you can book customer orders (which auto-reserve stock) or create Standalone Production Work Orders to manufacture garments on the floor.',
          link: { label: 'Go to Production', url: '/production' },
        },
      ],
      example: {
        title: 'Factory Flow Pipeline',
        body: 'SETS & SIZES → PRODUCT MASTER → PRODUCTION PIPELINE (Cutting → Stitching → Finishing → QC → Packing → Ready) → FINISHED GOODS READY STOCK → CUSTOMER ORDERS → DISPATCH & INVOICING',
      },
    },
  },
  {
    id: 'product-master-ready-stock',
    title: '2. Product Master & Ready Stock Connection',
    subtitle: 'How styles are registered permanently and completed production becomes Ready Stock',
    icon: <Package className="w-5 h-5 text-emerald-400" />,
    category: 'CORE CONCEPTS',
    badge: 'Critical Concept',
    content: {
      summary:
        'Product Master is the permanent catalog of your factory. When a production batch is finished, the completed pieces automatically become Ready Stock under that same product without creating duplicate product entries.',
      rules: [
        {
          title: 'Product Master Records are Permanent',
          desc: 'Never delete or re-create a product when production finishes. The product remains in the catalog, while its Ready Stock quantity automatically increases.',
          iconType: 'check',
        },
        {
          title: 'Size-Wise Ready Stock Tracking',
          desc: 'Stock is always tracked precisely by: Product → Set → Size → Quantity (e.g. Cotton Coord Set → Standard Set → 38: 15, 40: 20, 42: 25, 44: 22, 46: 18 = Total 100 sets).',
          iconType: 'check',
        },
        {
          title: 'Strict QC Pass Rule',
          desc: 'Only pieces that pass Quality Check and are packed enter Ready Stock. Rejected pieces (defects) are logged for QC analytics and never added to saleable stock.',
          iconType: 'alert',
        },
        {
          title: 'Partial Batch Support',
          desc: 'If a 500-piece batch produces 120 ready pieces today, they are immediately credited to Ready Stock. When the remaining 380 finish later, they add to stock without waiting.',
          iconType: 'info',
        },
      ],
      faqs: [
        {
          q: 'Where can I see live Ready Stock?',
          a: 'Open Product Master (/products). You will see Total Ready Stock KPI, size-wise badges on cards, and clicking any product opens the live Size Matrix and Stock Movement Ledger.',
        },
      ],
    },
  },
  {
    id: 'production-pipeline',
    title: '3. Production Pipeline & Floor Execution',
    subtitle: 'Managing batches across Planning, Cutting, Stitching, Finishing, QC, Packing & Ready',
    icon: <Factory className="w-5 h-5 text-blue-400" />,
    category: 'MANUFACTURING',
    content: {
      summary:
        'The Production module tracks garment batches as they move physically across factory workstations with real-time bottleneck detection.',
      steps: [
        {
          step: 1,
          title: 'Create Production Work Order Plan',
          desc: 'Select Product Style, Garment Set, Colorway, and enter planned targets for each size. Optionally link to an active customer order.',
          tip: 'If dropdowns are empty, create a set in /sets-sizes and style in /products first!',
        },
        {
          step: 2,
          title: 'Advance Batches Across Pipeline Stages',
          desc: 'Move cards on the Kanban board: Planning → Cutting → Stitching → Finishing → Quality Check → Packing → Ready.',
        },
        {
          step: 3,
          title: 'Log Stage Output & Defect Rejections',
          desc: 'Click "Log Stage Output" on any active batch. Enter pieces passed and pieces rejected with reason (e.g. Staining, Stitch Skip, Measurement Mismatch).',
        },
        {
          step: 4,
          title: 'Automatic Transfer to Ready Stock',
          desc: 'When batch reaches PACKING / READY, the system automatically logs immutable ledger entries and updates Finished Goods Ready Stock.',
        },
      ],
    },
  },
  {
    id: 'inventory-ledger',
    title: '4. Inventory Architecture & Aging Control',
    subtitle: 'Physical vs Reserved vs Dispatchable Stock, Raw Materials, and 90+ Day Aging',
    icon: <Boxes className="w-5 h-5 text-teal-400" />,
    category: 'INVENTORY',
    content: {
      summary:
        'The inventory system maintains 100% accuracy using a triple-quantity model and immutable transaction ledgers.',
      rules: [
        {
          title: 'Triple-Quantity Stock Formula',
          desc: '1. Physical Stock = Total pieces in warehouse.\n2. Reserved Stock = Pieces committed to active customer orders.\n3. Dispatchable Stock = Physical - Reserved (Available to sell right now).',
          iconType: 'check',
        },
        {
          title: 'No Negative Stock Allowed',
          desc: 'The system protects against overselling by validating dispatchable quantities before booking or dispatch.',
          iconType: 'alert',
        },
        {
          title: 'Stock Aging & Movement Velocity',
          desc: 'Finished goods are categorized into age brackets: 0-30 Days (Fast), 31-60 Days (Medium), 61-90 Days (Slow), and 90+ Days (Dead Stock warning).',
          iconType: 'info',
        },
      ],
    },
  },
  {
    id: 'orders-sales',
    title: '5. Customer Orders & Stock Reservation',
    subtitle: 'Wholesale order booking, automated stock hold, and invoice generation',
    icon: <ShoppingCart className="w-5 h-5 text-amber-400" />,
    category: 'COMMERCE',
    content: {
      summary:
        'When wholesale buyers place orders, the system automatically checks stock availability and reserves pieces so they cannot be sold to other clients.',
      steps: [
        {
          step: 1,
          title: 'Create Customer Order (/orders)',
          desc: 'Select Customer, Delivery Date, and add garment styles with size quantities.',
        },
        {
          step: 2,
          title: 'Stock Allocation Check',
          desc: 'If Ready Stock exists, pieces are immediately RESERVED. If insufficient stock exists, the order flags "Production Required".',
        },
        {
          step: 3,
          title: 'Print Invoice / Delivery Challan',
          desc: 'Click "Print Invoice" on any confirmed order to generate GST-compliant wholesale tax invoices.',
        },
      ],
    },
  },
  {
    id: 'dispatch-shipping',
    title: '6. Dispatch, Carton Packing & Logistics',
    subtitle: 'Packing slips, courier tracking, and double-deduction prevention',
    icon: <Truck className="w-5 h-5 text-cyan-400" />,
    category: 'LOGISTICS',
    content: {
      summary:
        'Once orders are packed, the Dispatch module handles delivery challans, transporter LR numbers, and records stock deductions.',
      rules: [
        {
          title: 'Idempotent Dispatch Deductions',
          desc: 'Executing a dispatch decreases Physical Stock and releases Reserved Stock simultaneously without creating duplicate deductions.',
          iconType: 'check',
        },
        {
          title: 'Customer Return & QC Restocking',
          desc: 'If a customer returns goods, log a Return under Inventory. Pieces that pass return QC are safely added back into Ready Stock with audit logs.',
          iconType: 'info',
        },
      ],
    },
  },
  {
    id: 'purchases-sourcing',
    title: '7. Purchases & Raw Material Sourcing',
    subtitle: 'Fabric procurement, trims inventory, and supplier purchase orders',
    icon: <ShoppingBag className="w-5 h-5 text-purple-400" />,
    category: 'PROCUREMENT',
    content: {
      summary:
        'Keep fabric mills, yarn suppliers, and accessory vendors organized. Create POs and receive fabric inward with meter/kg tracking.',
      steps: [
        {
          step: 1,
          title: 'Create Purchase Order (/purchases)',
          desc: 'Select Supplier Mill, Material Category (Fabric, Trims, Thread, Labels), rate, and expected arrival date.',
        },
        {
          step: 2,
          title: 'Receive Material Inward',
          desc: 'When goods arrive at the factory gate, click "Receive Goods", verify quantity, and update raw material stock.',
        },
      ],
    },
  },
  {
    id: 'financials-expenses',
    title: '8. Financials, Payments & Ledger',
    subtitle: 'Receivables, supplier payments, operating overheads, and P&L',
    icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
    category: 'FINANCE',
    content: {
      summary:
        'Monitor cash flow, outstanding market payments, worker piece-rate payouts, and electricity/rent overheads.',
      steps: [
        {
          step: 1,
          title: 'Record Customer Payments (/payments)',
          desc: 'Log cash, bank NEFT/RTGS, or cheque payments against customer invoices to reduce outstanding receivables.',
        },
        {
          step: 2,
          title: 'Log Factory Expenses (/expenses)',
          desc: 'Track operational costs: Stitching Master wages, fabric dyeing, machinery maintenance, thread purchases, and factory rent.',
        },
      ],
    },
  },
  {
    id: 'team-roles-rbac',
    title: '9. Owner Custom Roles & Granular Permissions',
    subtitle: 'How the Owner controls custom designations and grants specific module access',
    icon: <Shield className="w-5 h-5 text-primary-400" />,
    category: 'ADMINISTRATION',
    badge: 'Owner Control',
    content: {
      summary:
        'The Owner has 100% control over the software. You can create custom designations (e.g. Cutting Master, Floor Supervisor, Accountant) and choose exactly which modules each user can access.',
      steps: [
        {
          step: 1,
          title: 'Open Settings → Team & Permissions (/settings)',
          desc: 'Click "Add Factory User". Enter the staff member\'s Name, Email, Phone, and Password.',
        },
        {
          step: 2,
          title: 'Enter Custom Role Designation',
          desc: 'Type any custom designation (e.g. "Store Incharge") or click a quick suggestion preset.',
        },
        {
          step: 3,
          title: 'Select Granular Module Checkboxes',
          desc: 'Tick only the modules this staff needs (e.g. tick only "Production" & "Products" for floor masters; tick "Payments" & "Orders" for billing staff).',
        },
        {
          step: 4,
          title: 'Dynamic User Sidebar & Security',
          desc: 'When that user logs in, their sidebar only shows the modules you approved. Unapproved modules are completely hidden and blocked.',
        },
      ],
    },
  },
  {
    id: 'ai-manager-pwa',
    title: '10. AI Assistant & Native PWA Installation',
    subtitle: 'AI Floor Insights, offline resilience, and browser address bar app installation',
    icon: <Bot className="w-5 h-5 text-teal-400" />,
    category: 'ADVANCED',
    content: {
      summary:
        'Use Google Gemini AI intelligence for automated bottleneck advice and install the app natively on Windows/Mac/Android/iOS.',
      rules: [
        {
          title: 'Native Browser PWA Installation',
          desc: 'Open the app in Google Chrome or Microsoft Edge. Click the native "Install App" icon located in the browser address bar (top-right) to install Factory AI Manager as a native desktop application with offline support.',
          iconType: 'check',
        },
        {
          title: 'AI Floor Assistant (/ai-manager)',
          desc: 'The AI analyzes your live production numbers, calculates daily factory yield, alerts you to delayed batches, and suggests production priority adjustments.',
          iconType: 'info',
        },
        {
          title: '7-Day Isolated Local Retention',
          desc: 'Local testing stays fast and isolated with 7-day auto-purge, while production connects directly to Supabase cloud database.',
          iconType: 'check',
        },
      ],
    },
  },
];

export const GuidePage: React.FC = () => {
  const [activeChapterId, setActiveChapterId] = useState<string>('quick-start');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeChapter = GUIDE_CHAPTERS.find((c) => c.id === activeChapterId) || GUIDE_CHAPTERS[0];

  const filteredChapters = GUIDE_CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-factory-900 to-indigo-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold border border-primary-500/30">
              <BookOpen className="w-3.5 h-3.5" />
              Factory Standard Operating Procedure (SOP) & Documentation
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Factory AI Manager User Guide & Operations Manual
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Complete written tutorial on how to operate every module of the garment manufacturing software — from Size Sets & Product Master to Production, Ready Stock, Orders, and Dispatch.
            </p>
          </div>

          <div className="w-full md:w-80 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tutorials, rules, SOPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Guide Layout: Sidebar Index + Active Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Chapters Navigation Index */}
        <div className="lg:col-span-4 space-y-2 sticky top-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Tutorial Modules ({filteredChapters.length})
          </div>

          <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
            {filteredChapters.map((ch) => {
              const isActive = ch.id === activeChapter.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapterId(ch.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-950/60 to-slate-900 border-primary-500/50 shadow-md ring-1 ring-primary-500/30'
                      : 'bg-factory-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-factory-900 text-slate-400'
                  }`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${isActive ? 'bg-primary-900/40 border-primary-500/40 text-primary-300' : 'bg-slate-950 border-slate-800'}`}>
                    {ch.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {ch.category}
                      </span>
                      {ch.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {ch.badge}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-bold truncate mt-0.5 ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>
                      {ch.title}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {ch.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Chapter Details Card */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 sm:p-8 border-slate-800 space-y-6 bg-factory-900/90 shadow-xl">
            {/* Chapter Header */}
            <div className="border-b border-slate-800 pb-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  {activeChapter.category}
                </span>
                {activeChapter.badge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeChapter.badge}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-white flex items-center gap-2.5">
                {activeChapter.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {activeChapter.subtitle}
              </p>
            </div>

            {/* Chapter Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
              {activeChapter.content.summary}
            </div>

            {/* Step-by-Step Flow */}
            {activeChapter.content.steps && (
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                  Step-by-Step Instructions
                </h3>

                <div className="space-y-3">
                  {activeChapter.content.steps.map((st) => (
                    <div
                      key={st.step}
                      className="p-4 rounded-2xl bg-factory-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/40 text-xs font-black flex items-center justify-center shrink-0">
                            {st.step}
                          </span>
                          <span className="font-bold text-slate-100 text-xs sm:text-sm">
                            {st.title}
                          </span>
                        </div>

                        {st.link && (
                          <Link to={st.link.url}>
                            <Button size="sm" variant="outline" className="text-[11px] shrink-0 py-1 h-auto">
                              {st.link.label}
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                        {st.desc}
                      </p>

                      {st.tip && (
                        <div className="ml-8 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{st.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business Rules & Key Knowledge */}
            {activeChapter.content.rules && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Core Business Rules & Specifications
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeChapter.content.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-factory-950 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        {rule.iconType === 'alert' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : rule.iconType === 'info' ? (
                          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <h4 className="font-bold text-slate-200 text-xs">{rule.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 whitespace-pre-line leading-relaxed pl-6">
                        {rule.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow Diagram Box */}
            {activeChapter.content.example && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  {activeChapter.content.example.title}
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-900/60 font-mono text-[11px] text-indigo-200 font-semibold tracking-wide overflow-x-auto">
                  {activeChapter.content.example.body}
                </div>
              </div>
            )}

            {/* FAQs */}
            {activeChapter.content.faqs && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2.5">
                  {activeChapter.content.faqs.map((faq, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-factory-950 border border-slate-800 space-y-1">
                      <div className="font-bold text-xs text-slate-200 flex items-center gap-2">
                        <span className="text-primary-400 font-bold">Q:</span> {faq.q}
                      </div>
                      <div className="text-[11px] text-slate-400 pl-4">
                        <span className="text-emerald-400 font-bold">A:</span> {faq.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

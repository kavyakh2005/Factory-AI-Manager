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
  Globe,
  Languages,
} from 'lucide-react';

type Language = 'EN' | 'HI';

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

const GUIDE_CHAPTERS_EN: GuideChapter[] = [
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
        title: 'Factory Operational Flow Pipeline',
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
    subtitle: 'Managing batches, stage skipping, over-logging protection, fast-track, and size audit',
    icon: <Factory className="w-5 h-5 text-blue-400" />,
    category: 'MANUFACTURING',
    content: {
      summary:
        'The Production module tracks garment batches across 7 stages with instant 1-click stage jumping, skipping, strict over-logging limits, and detailed size-wise audit logs.',
      steps: [
        {
          step: 1,
          title: 'Create Production Work Order Plan',
          desc: 'Select Product Style, Garment Set, Colorway, and enter planned targets for each size. Optionally link to an active customer order.',
          tip: 'If dropdowns are empty, create a size set in /sets-sizes and style in /products first!',
        },
        {
          step: 2,
          title: 'Direct Stage Skipping & Progression Stepper',
          desc: 'You can directly click any stage in the Pipeline Progression stepper to jump or skip intermediate steps (e.g. pre-cut job work skipping cutting directly to stitching).',
        },
        {
          step: 3,
          title: 'Over-Logging Protection & Remaining Quantity Validation',
          desc: 'The system strictly caps logged passed pieces to remaining planned targets per size (e.g., if target is 10 pcs, supervisor cannot log 16 passed pieces), preventing false inventory inflation.',
        },
        {
          step: 4,
          title: '1-Click Fast-Track to READY',
          desc: 'Click "⚡ Fast-Track to READY" in the batch modal to instantly mark 100% planned pieces as QC-Passed and credit them directly into Ready Stock.',
        },
        {
          step: 5,
          title: 'Print Route Traveler Slip & Size Audit Logs',
          desc: 'Generate physical job cards for cutting masters and view chronological audit trails showing exact sizes (e.g., Size 38, Size 40) rather than generic labels.',
        },
      ],
    },
  },
  {
    id: 'inventory-ledger',
    title: '4. Inventory Architecture & Stock Aging Control',
    subtitle: 'Physical vs Reserved vs Dispatchable Stock, and 90+ Day Dead Stock Control',
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
    subtitle: 'Packing slips, carton boxes, transporter LR tracking, and double-deduction prevention',
    icon: <Truck className="w-5 h-5 text-cyan-400" />,
    category: 'LOGISTICS',
    content: {
      summary:
        'Once orders are ready, the Dispatch module manages carton packing, gross weight calculations, transporter LR numbers, and records instant stock deductions.',
      rules: [
        {
          title: 'Carton Packing & Transport Challans',
          desc: 'Pack garments into numbered cartons, calculate shipment weights, and print Transport Slips with transporter names and LR / Bilty tracking numbers.',
          iconType: 'check',
        },
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
    id: 'custom-roles',
    title: '7. Custom Roles & Granular Permissions',
    subtitle: 'Owner-defined roles with feature-by-feature access control',
    icon: <Shield className="w-5 h-5 text-indigo-400" />,
    category: 'SECURITY',
    content: {
      summary:
        'The factory owner has complete authority to create custom roles (e.g. Floor Master, Billing Operator) and grant exact View/Create/Edit/Delete permissions per module.',
      rules: [
        {
          title: 'Owner Unrestricted Master Access',
          desc: 'The Owner role retains full unrestricted access across all modules, settings, database operations, and user audits.',
          iconType: 'check',
        },
        {
          title: 'Custom Staff Roles (/settings)',
          desc: 'Create new roles like "Cutting Supervisor" with access only to Production, or "Accountant" with access only to Payments & Expenses.',
          iconType: 'info',
        },
      ],
    },
  },
  {
    id: 'ai-manager',
    title: '8. AI Manager & Automation Engine',
    subtitle: 'Gemini AI intelligence for demand forecasting and floor optimization',
    icon: <Bot className="w-5 h-5 text-emerald-400" />,
    category: 'INTELLIGENCE',
    content: {
      summary:
        'Ask the AI Assistant natural-language questions to analyze factory performance, calculate fabric consumption, and detect production bottlenecks.',
      rules: [
        {
          title: 'Natural Language Voice & Text Chat',
          desc: 'Ask: "Which products have high dead stock over 60 days?" or "Generate a cutting order for 500 pcs Cotton Kurti".',
          iconType: 'check',
        },
        {
          title: 'Fabric Requirement Calculator',
          desc: 'AI computes exact fabric meterage required based on garment style consumption and ordered size ratios.',
          iconType: 'info',
        },
      ],
    },
  },
];

const GUIDE_CHAPTERS_HI: GuideChapter[] = [
  {
    id: 'quick-start',
    title: '1. शुरुआती सेटअप और रोडमैप (Quick Start)',
    subtitle: '5 मिनट में अपनी पूरी गारमेंट फैक्ट्री को सिस्टम पर चालू करने का सही क्रम',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    category: 'शुरुआत करें',
    badge: 'सबसे पहले पढ़ें',
    content: {
      summary:
        'सॉफ्टवेयर में खाली ड्रॉपडाउन से बचने और सभी ऑर्डर्स और प्रोडक्शन के सही कैलकुलेशन के लिए अपनी फैक्ट्री का डेटा इस क्रम में सेट करें:',
      steps: [
        {
          step: 1,
          title: 'साइज सेट और माप बनाएं (/sets-sizes)',
          desc: 'सबसे पहले अपने गारमेंट के साइज सेट बनाएं (जैसे Standard Set: 38, 40, 42, 44, 46; Kids Set: 24, 26, 28, 30, 32). बिना साइज सेट के प्रोडक्ट और प्रोडक्शन साइज ब्रेकडाउन नहीं निकाल सकते।',
          link: { label: 'Sets & Sizes पर जाएं', url: '/sets-sizes' },
        },
        {
          step: 2,
          title: 'प्रोडक्ट मास्टर में गारमेंट स्टाइल रजिस्टर करें (/products)',
          desc: 'अपनी फैक्ट्री के परमानेंट स्टाइल्स बनाएं (जैसे Cotton Coord Set, SKU: CCS-101, फैब्रिक: 100% Cotton, लागत: ₹450, होलसेल रेट: ₹850) और स्टेप 1 में बनाए गए साइज सेट से लिंक करें।',
          link: { label: 'Product Master पर जाएं', url: '/products' },
        },
        {
          step: 3,
          title: 'कस्टमर्स और सप्लायर्स जोड़ें (/customers & /suppliers)',
          desc: 'अपने होलसेल खरीदार, रिटेलर्स, फैब्रिक मिल्स और धागे/बटन सप्लायर्स को क्रेडिट लिमिट और GST नंबर के साथ जोड़ें।',
          link: { label: 'Customers पर जाएं', url: '/customers' },
        },
        {
          step: 4,
          title: 'प्रोडक्शन प्लान करें या ऑर्डर बुक करें (/production & /orders)',
          desc: 'अब आप कस्टमर ऑर्डर बुक कर सकते हैं (जो स्टॉक को ऑटो-रिज़र्व करता है) या फ्लोर पर कपड़े सिलने के लिए प्रोडक्शन वर्क ऑर्डर बना सकते हैं।',
          link: { label: 'Production पर जाएं', url: '/production' },
        },
      ],
      example: {
        title: 'फैक्ट्री ऑपरेशन का पूरा फ्लो',
        body: 'साइज सेट (SETS & SIZES) → प्रोडक्ट मास्टर (PRODUCTS) → प्रोडक्शन वर्कफ़्लो (कटिंग → सिलाई → फिनिशिंग → QC → पैकिंग → रेडी) → फिनिश्ड गुड्स रेडी स्टॉक → कस्टमर ऑर्डर → डिस्पैच और इनवॉइस',
      },
    },
  },
  {
    id: 'product-master-ready-stock',
    title: '2. प्रोडक्ट मास्टर और रेडी स्टॉक कनेक्शन',
    subtitle: 'स्टाइल परमानेंट रजिस्टर होती है और तैयार माल अपने आप रेडी स्टॉक बन जाता है',
    icon: <Package className="w-5 h-5 text-emerald-400" />,
    category: 'मुख्य नियम',
    badge: 'महत्वपूर्ण नियम',
    content: {
      summary:
        'Product Master आपकी फैक्ट्री का परमानेंट कैटलॉग है। जब भी प्रोडक्शन बैच तैयार होता है, तैयार पीस अपने आप उसी प्रोडक्ट के तहत रेडी स्टॉक में जुड़ जाते हैं (बिना कोई डुप्लीकेट प्रोडक्ट बनाए)।',
      rules: [
        {
          title: 'प्रोडक्ट मास्टर रिकॉर्ड परमानेंट होता है',
          desc: 'प्रोडक्शन खत्म होने पर प्रोडक्ट को कभी डिलीट या दोबारा न बनाएं। प्रोडक्ट कैटलॉग में रहता है और उसकी तैयार स्टॉक क्वांटिटी अपने आप बढ़ जाती है।',
          iconType: 'check',
        },
        {
          title: 'साइज-वाइज़ रेडी स्टॉक ट्रैकिंग',
          desc: 'स्टॉक हमेशा बिल्कुल सटीक ट्रैक होता है: प्रोडक्ट → साइज सेट → साइज → पीस (जैसे Cotton Coord Set → Standard Set → 38: 15, 40: 20, 42: 25, 44: 22, 46: 18 = कुल 100 सेट)।',
          iconType: 'check',
        },
        {
          title: 'सख्त QC पास नियम',
          desc: 'केवल वही पीस रेडी स्टॉक में जाते हैं जो क्वालिटी चेक पास करते हैं और पैक होते हैं। रिजेक्टेड (खराब) पीस डिफेक्ट एनालिसिस में जाते हैं और बिक्री योग्य स्टॉक में नहीं जुड़ते।',
          iconType: 'alert',
        },
        {
          title: 'पार्टीअल (आधा) बैच सपोर्ट',
          desc: 'अगर 500 पीस के बैच में से आज 120 पीस तैयार हो गए, तो वे तुरंत रेडी स्टॉक में जुड़ जाते हैं। बाकी 380 पीस जब बाद में बनेंगे तब जुड़ जाएंगे (पूरे बैच का इंतज़ार नहीं करना पड़ता)।',
          iconType: 'info',
        },
      ],
      faqs: [
        {
          q: 'लाइव रेडी स्टॉक कहां देखें?',
          a: 'Product Master (/products) खोलें। आपको कुल रेडी स्टॉक, हर कार्ड पर साइज बैज दिखेंगे, और किसी भी प्रोडक्ट पर क्लिक करने से साइज मैट्रिक्स और स्टॉक लेजर खुल जाएगा।',
        },
      ],
    },
  },
  {
    id: 'production-pipeline',
    title: '3. प्रोडक्शन वर्कफ़्लो और फ्लोर ट्रैकिंग',
    subtitle: 'बैच मैनेज करना, स्टेप स्किप करना, ओवर-लॉगिंग सुरक्षा, 1-क्लिक फास्ट-ट्रैक और साइज ऑडिट',
    icon: <Factory className="w-5 h-5 text-blue-400" />,
    category: 'मैन्युफैक्चरिंग',
    content: {
      summary:
        'प्रोडक्शन मॉड्यूल कपड़ों के बैच को 7 स्टेजों में ट्रैक करता है — जिसमें 1-क्लिक में किसी भी स्टेज पर कूदना (Jump/Skip), ओवर-लॉगिंग पर पक्की रोक और हर साइज का ऑडिट ट्रेल शामिल है।',
      steps: [
        {
          step: 1,
          title: 'प्रोडक्शन वर्क ऑर्डर प्लान बनाएं',
          desc: 'स्टाइल, साइज सेट, कलर चुनें और हर साइज के टारगेट पीस डालें। चाहें तो इसे किसी कस्टमर ऑर्डर से लिंक करें।',
          tip: 'अगर ड्रॉपडाउन खाली दिखें, तो पहले /sets-sizes में साइज सेट और /products में स्टाइल बनाएं!',
        },
        {
          step: 2,
          title: 'स्टेज जंप और स्किप करें (Direct Stage Switch)',
          desc: 'आप प्रोग्रेशन बार में किसी भी स्टेज (जैसे Planning, Cutting, Stitching) पर डायरेक्ट क्लिक करके बैच को वहां शिफ्ट या बीच के स्टेप्स स्किप कर सकते हैं।',
        },
        {
          step: 3,
          title: 'ओवर-लॉगिंग सुरक्षा (Over-logging Prevention)',
          desc: 'सिस्टम हर साइज के टारगेट पीस से ज्यादा पास करने की अनुमति नहीं देता (जैसे अगर 10 पीस प्लान थे, तो कोई गलती से 16 पास नहीं कर सकता)। यह स्टॉक के आंकड़ों को 100% सही रखता है।',
        },
        {
          step: 4,
          title: '1-क्लिक Fast-Track to READY',
          desc: 'बैच मोडल में "⚡ Fast-Track to READY" दबाएं — यह 1 सेकंड में 100% माल को QC पास करके सीधे गोदाम के रेडी स्टॉक में जमा कर देता है।',
        },
        {
          step: 5,
          title: 'प्रिंट रूट स्लिप और सटीक साइज ऑडिट लॉग',
          desc: '"Print Route Slip" बटन दबाकर कटिंग मास्टर और सुपरवाइजर के लिए पेपर स्लिप प्रिंट करें, और ऑडिट हिस्ट्री में हर पीस का साइज (जैसे Size 38, Size 40) स्पष्ट देखें।',
        },
      ],
    },
  },
  {
    id: 'inventory-ledger',
    title: '4. इन्वेंटरी स्टॉक और 90+ दिन एजिंग कंट्रोल',
    subtitle: 'फिजिकल स्टॉक, रिज़र्व्ड स्टॉक, बेचने योग्य स्टॉक और डेड स्टॉक अलर्ट',
    icon: <Boxes className="w-5 h-5 text-teal-400" />,
    category: 'इन्वेंटरी',
    content: {
      summary:
        'इन्वेंटरी सिस्टम 3-क्वांटिटी मॉडल और पक्के लेजर रिकॉर्ड्स के साथ काम करता है ताकि कभी गलत स्टॉक न दिखे।',
      rules: [
        {
          title: '3-क्वांटिटी स्टॉक फॉर्मूला',
          desc: '1. Physical Stock = गोदाम में रखा कुल माल।\n2. Reserved Stock = जो माल ग्राहकों के ऑर्डर के लिए बुक/होल्ड है।\n3. Dispatchable Stock = Physical - Reserved (जो अभी तुरंत नया बेचा जा सकता है)।',
          iconType: 'check',
        },
        {
          title: 'नेगेटिव स्टॉक नहीं हो सकता',
          desc: 'सिस्टम बिना माल के ओवर-सेलिंग रोकने के लिए ऑर्डर बुक या डिस्पैच करने से पहले स्टॉक चेक करता है।',
          iconType: 'alert',
        },
        {
          title: 'स्टॉक एजिंग और डेड स्टॉक ट्रैकिंग',
          desc: 'गोदाम के माल को दिनों के हिसाब से बांटा जाता है: 0-30 दिन (फास्ट), 31-60 दिन (मीडियम), 61-90 दिन (धीमा), और 90+ दिन (डेड स्टॉक चेतावनी)।',
          iconType: 'info',
        },
      ],
    },
  },
  {
    id: 'orders-sales',
    title: '5. कस्टमर ऑर्डर्स और स्टॉक रिज़र्वेशन',
    subtitle: 'होलसेल ऑर्डर बुकिंग, ऑटो-स्टॉक होल्ड और GST टैक्स इनवॉइस',
    icon: <ShoppingCart className="w-5 h-5 text-amber-400" />,
    category: 'बिक्री और ऑर्डर्स',
    content: {
      summary:
        'जब कोई खरीदार ऑर्डर देता है, सिस्टम तुरंत रेडी स्टॉक चेक करके पीस रिज़र्व कर लेता है ताकि वही माल किसी दूसरे ग्राहक को न बिक जाए।',
      steps: [
        {
          step: 1,
          title: 'कस्टमर ऑर्डर बनाएं (/orders)',
          desc: 'ग्राहक चुनें, डिलीवरी तारीख डालें और स्टाइल के साइज-वाइज़ पीस भरें।',
        },
        {
          step: 2,
          title: 'ऑटो स्टॉक अलोकेशन',
          desc: 'अगर गोदाम में माल तैयार है, तो वह तुरंत RESERVED हो जाता है। अगर माल कम है, तो ऑर्डर पर "Production Required" का टैग लग जाता है।',
        },
        {
          step: 3,
          title: 'इनवॉइस और चालान प्रिंट करें',
          desc: 'ऑर्डर पर "Print Invoice" दबाकर पक्का GST टैक्स इनवॉइस और डिलीवरी चालान निकालें।',
        },
      ],
    },
  },
  {
    id: 'dispatch-shipping',
    title: '6. डिस्पैच, कार्टन पैकिंग और ट्रांसपोर्ट',
    subtitle: 'कार्टन बॉक्स पैकिंग, ग्रॉस वजन, ट्रांसपोर्ट LR नंबर और सटीक स्टॉक कटौती',
    icon: <Truck className="w-5 h-5 text-cyan-400" />,
    category: 'लॉजिस्टिक्स',
    content: {
      summary:
        'माल तैयार होने पर डिस्पैच मॉड्यूल कार्टन बॉक्स पैकिंग, ट्रांसपोर्ट LR बिल्टी नंबर और गोदाम से माल घटाने का काम संभालता है।',
      rules: [
        {
          title: 'कार्टन पैकिंग और ट्रांसपोर्ट चालान',
          desc: 'कपड़ों को नंबर वाले कार्टन में पैक करें, कुल वजन दर्ज करें और ट्रांसपोर्टर का नाम व LR / बिल्टी नंबर के साथ स्लिप प्रिंट करें।',
          iconType: 'check',
        },
        {
          title: 'सटीक डिस्पैच कटौती',
          desc: 'डिस्पैच होते ही गोदाम से फिजिकल स्टॉक कम होता है और रिज़र्व्ड स्टॉक रिलीज हो जाता है।',
          iconType: 'check',
        },
        {
          title: 'कस्टमर रिटर्न और QC री-स्टॉकिंग',
          desc: 'अगर ग्राहक माल लौटाता है, तो इन्वेंटरी में Return दर्ज करें। जो पीस QC पास करते हैं वे वापस रेडी स्टॉक में जुड़ जाते हैं।',
          iconType: 'info',
        },
      ],
    },
  },
  {
    id: 'custom-roles',
    title: '7. कस्टम रोल्स और परमिशन कंट्रोल',
    subtitle: 'ओनर द्वारा बनाए गए रोल्स और हर मॉड्यूल की अलग-अलग परमिशन',
    icon: <Shield className="w-5 h-5 text-indigo-400" />,
    category: 'सिक्योरिटी',
    content: {
      summary:
        'फैक्ट्री ओनर के पास पूरा अधिकार है कि वह अपनी मर्जी से नए रोल्स (जैसे कटिंग मास्टर, बिलिंग ऑपरेटर) बनाए और तय करे कि कौन क्या देख या बदल सकता है।',
      rules: [
        {
          title: 'ओनर को पूरा अधिकार',
          desc: 'Owner रोल के पास सभी फीचर्स, सेटिंग्स, यूजर परमिशन और डेटाबेस पर पूरा कंट्रोल रहता है।',
          iconType: 'check',
        },
        {
          title: 'स्टाफ के लिए रोल बनाएं (/settings)',
          desc: 'सेटिंग्स में जाकर नया रोल बनाएं (जैसे केवल प्रोडक्शन देखने वाला सुपरवाइजर या केवल पेमेंट देखने वाला अकाउंटेंट)।',
          iconType: 'info',
        },
      ],
    },
  },
  {
    id: 'ai-manager',
    title: '8. AI मैनेजर और स्मार्ट असिस्टेंट',
    subtitle: 'Google Gemini AI द्वारा डिमांड फोरकास्टिंग और प्रोडक्शन सलाह',
    icon: <Bot className="w-5 h-5 text-emerald-400" />,
    category: 'AI इंटेलिजेंस',
    content: {
      summary:
        'AI असिस्टेंट से आसान भाषा में सवाल पूछकर फैक्ट्री की परफॉरमेंस, कपड़े की खपत (Fabric Meterage) और प्रोडक्शन अड़चनें जान सकते हैं।',
      rules: [
        {
          title: 'आसान भाषा में बातचीत',
          desc: 'पूछें: "कौन से प्रोडक्ट 60 दिन से ज्यादा पुराने गोदाम में पड़े हैं?" या "500 पीस कुर्ती के लिए कितना कपड़ा लगेगा?"',
          iconType: 'check',
        },
        {
          title: 'फैब्रिक कैलकुलेटर',
          desc: 'AI हर गारमेंट साइज के हिसाब से कुल लगने वाले कपड़े का सही मीटर हिसाब लगा देता है।',
          iconType: 'info',
        },
      ],
    },
  },
];

export const GuidePage: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('factory_guide_language');
      return saved === 'EN' || saved === 'HI' ? saved : 'HI';
    } catch {
      return 'HI';
    }
  });

  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('factory_guide_active_chapter');
      return saved || 'quick-start';
    } catch {
      return 'quick-start';
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('factory_guide_language', lang);
    } catch {
      // ignore
    }
  };

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    try {
      localStorage.setItem('factory_guide_active_chapter', chapterId);
    } catch {
      // ignore
    }
  };

  const currentChapters = language === 'HI' ? GUIDE_CHAPTERS_HI : GUIDE_CHAPTERS_EN;

  const filteredChapters = currentChapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChapter = currentChapters.find((c) => c.id === activeChapterId) || currentChapters[0];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-factory-950 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                {language === 'HI' ? 'फैक्ट्री AI मैनेजर — यूज़र गाइड और SOP' : 'Factory AI Manager — User Guide & SOP'}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {language === 'HI' ? 'मैनुअल v2.0' : 'Manual v2.0'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {language === 'HI'
                  ? 'फैक्ट्री ऑपरेशन्स, साइज सेट, प्रोडक्शन, इन्वेंटरी और डिस्पैच की संपूर्ण गाइड'
                  : 'Complete standard operating procedures for garment manufacturing, inventory, and sales'}
              </p>
            </div>
          </div>
        </div>

        {/* Language Selector & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Switcher Button Group */}
          <div className="flex items-center p-1 bg-factory-900 border border-slate-700/80 rounded-2xl shadow-inner">
            <button
              type="button"
              onClick={() => handleSetLanguage('HI')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                language === 'HI'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇮🇳 हिंदी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => handleSetLanguage('EN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                language === 'EN'
                  ? 'bg-primary-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'HI' ? 'गाइड में खोजें...' : 'Search tutorial topics...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-factory-900 border border-slate-700 text-xs text-slate-100 focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Navigation + Detailed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Chapters List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
            {language === 'HI' ? 'अध्याय सूची (Chapters)' : 'Table of Contents'}
          </div>

          <div className="space-y-1.5">
            {filteredChapters.map((ch) => {
              const isActive = ch.id === activeChapter.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(ch.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all duration-150 flex items-start gap-3 group ${
                    isActive
                      ? 'bg-primary-950/60 border-primary-500/80 shadow-lg shadow-primary-500/10 ring-1 ring-primary-500/30'
                      : 'bg-factory-950/80 border-slate-800 hover:bg-factory-900/60 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'bg-primary-600/30 border border-primary-500/40' : 'bg-factory-900 border border-slate-800'
                    }`}
                  >
                    {ch.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {ch.category}
                      </span>
                      {ch.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          {ch.badge}
                        </span>
                      )}
                    </div>
                    <div className={`text-xs font-bold truncate mt-0.5 ${isActive ? 'text-primary-200' : 'text-slate-200'}`}>
                      {ch.title}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {ch.subtitle}
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-primary-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Active Chapter Detail Reader */}
        <div className="lg:col-span-8">
          <Card className="p-6 border-slate-800 bg-factory-950/90 space-y-6">
            {/* Header of Active Chapter */}
            <div className="pb-5 border-b border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-500/10 text-primary-300 border border-primary-500/30">
                  {activeChapter.category}
                </span>
                {activeChapter.badge && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {activeChapter.badge}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2.5">
                {activeChapter.icon}
                <span>{activeChapter.title}</span>
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                {activeChapter.subtitle}
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-2xl bg-factory-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-primary-300 font-bold block mb-1">
                {language === 'HI' ? '📌 मुख्य उद्देश्य (Summary):' : '📌 Overview:'}
              </strong>
              {activeChapter.content.summary}
            </div>

            {/* Step-by-Step Walkthrough */}
            {activeChapter.content.steps && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-primary-400" />
                  {language === 'HI' ? 'स्टेप-बाय-स्टेप गाइड (Step-by-Step)' : 'Sequential Operating Steps'}
                </h3>

                <div className="space-y-3">
                  {activeChapter.content.steps.map((st) => (
                    <div
                      key={st.step}
                      className="p-4 rounded-2xl bg-factory-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
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
                  {language === 'HI' ? 'महत्वपूर्ण नियम और स्पेसिफिकेशन्स (Business Rules)' : 'Core Business Rules & Specifications'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeChapter.content.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-factory-950 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        {rule.iconType === 'alert' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
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
                  {language === 'HI' ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'Frequently Asked Questions'}
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

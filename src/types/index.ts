export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

export interface Role {
  id: string;
  name: 'OWNER' | 'ADMIN' | 'MANAGER' | 'PRODUCTION_MANAGER' | 'INVENTORY_MANAGER' | 'ACCOUNTANT' | 'STAFF' | string;
  displayName: string;
  description?: string;
  permissions?: Permission[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}

// ==========================================
// MASTER ENTITIES: CUSTOMER, PRODUCT, SET, SIZE
// ==========================================

export interface Customer {
  id: string;
  customerCode?: string;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Size {
  id: string;
  name: string; // e.g. "38", "40", "42", "44", "46", "48", "50", "52", "XS", "S", "M", "L", "XL", "Kids 24"
  code?: string;
  chestMeasure?: number;
  waistMeasure?: number;
  lengthMeasure?: number;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SetSize {
  id: string;
  setId: string;
  sizeId: string;
  sequence: number;
  ratio: number;
  size: Size;
}

export interface Set {
  id: string;
  name: string; // e.g. "Standard Set", "Extra Set", "Kids Set"
  code: string;
  type: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder: number;
  setSizes?: SetSize[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSet {
  id: string;
  productId: string;
  setId: string;
  isDefault?: boolean;
  set?: Set;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  colorCode?: string;
  additionalCost?: number;
  sellingPriceOverride?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory?: string;
  fabric: string;
  pattern?: string;
  description?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  retailPrice?: number;
  taxRate?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  imageUrl?: string;
  images?: string[];
  variants?: ProductVariant[];
  productSets?: ProductSet[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  code: string;
  category: string;
  subcategory?: string;
  fabric: string;
  pattern?: string;
  description?: string;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  retailPrice?: number;
  taxRate?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  imageUrl?: string;
  setIds?: string[];
  variants?: Array<{ id?: string; color: string; sku?: string; colorCode?: string }>;
}

export interface CreateSetInput {
  name: string;
  code: string;
  type?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
  sizeIds?: string[];
}

export interface CreateSizeInput {
  name: string;
  code?: string;
  chestMeasure?: number;
  waistMeasure?: number;
  lengthMeasure?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
}

// ==========================================
// ORDER & SIZE MATRIX MODELS
// ==========================================

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_FOR_DISPATCH' | 'PARTIALLY_DISPATCHED' | 'COMPLETED' | 'CANCELLED';
export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  setId: string;
  set?: Set;
  sizeId: string;
  size?: Size;
  quantity: number;
  unitRate: number;
  discount?: number;
  taxRate?: number;
  lineTotal: number;
  producedQuantity?: number;
  dispatchedQuantity?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  customerName?: string;
  orderDate: string;
  deliveryDate: string;
  status: OrderStatus;
  priority: OrderPriority;
  paymentStatus: PaymentStatus;
  totalQuantity: number;
  totalAmount?: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  notes?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  items?: OrderItem[];
}

// Line item draft for Size Matrix Entry
export interface OrderItemDraft {
  productId: string;
  variantId?: string;
  setId: string;
  unitRate: number;
  taxRate: number;
  discount: number;
  sizeQuantities: Record<string, number>;
}

// ==========================================
// PRODUCTION MANAGEMENT MODELS (PHASE 3)
// ==========================================

export type ProductionOrderStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export interface ProductionStage {
  id: string;
  name: string; // PLANNING, CUTTING, STITCHING, FINISHING, QUALITY CHECK, PACKING, READY, DISPATCHED
  sequence: number;
  description?: string;
  colorCode?: string;
  isSystem: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductionEntry {
  id?: string;
  productionOrderId: string;
  stageId: string;
  stage?: ProductionStage;
  sizeId: string;
  size?: Size;
  quantityPassed: number;
  quantityRejected: number;
  rejectionReason?: string;
  operatorName?: string;
  loggedById?: string;
  entryDate: string;
  notes?: string;
}

export interface ProductionOrder {
  id: string;
  productionNumber: string;
  orderNumber?: string;
  orderId?: string;
  order?: Order;
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  setId: string;
  set?: Set;
  currentStageId: string;
  currentStage?: ProductionStage;
  totalPlannedQty: number;
  totalCompletedQty: number;
  totalRejectedQty: number;
  plannedQuantity?: number;
  producedQuantity?: number;
  rejectedQuantity?: number;
  remainingQuantity?: number;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  status: ProductionOrderStatus;
  assignedTeam?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  entries?: ProductionEntry[];
  // Size-wise planned targets: { [sizeId]: quantity }
  plannedSizes?: Record<string, number>;
}

export interface SizeWiseProductionSummary {
  sizeId: string;
  sizeName: string;
  sequence: number;
  orderedQuantity: number;
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  goodQuantity: number; // produced - rejected
  remainingQuantity: number; // planned - good
}

export interface RejectionReason {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductionDashboardData {
  metrics: {
    totalActiveOrders: number;
    todayPlannedQty: number;
    todayProducedQty: number;
    totalPendingQty: number;
    totalRejectedQty: number;
    delayedCount: number;
    stageCounts: Record<string, number>;
  };
  stages: ProductionStage[];
  productionOrders: ProductionOrder[];
  delayedOrders: ProductionOrder[];
}

// ==========================================
// DASHBOARD & SETTINGS
// ==========================================

export interface DashboardMetrics {
  todayProductionPassed: number;
  todayProductionRejected: number;
  pendingOrders: number;
  ordersDueToday: number;
  ordersDueSoon: number;
  delayedOrders: number;
  todayDispatchesCount: number;
  todayDispatchesPcs: number;
  lowStockCount: number;
  outstandingReceivables: number;
  bottlenecksCount: number;
  totalProducts: number;
  totalSets: number;
}

export interface AIFactorySummary {
  headline: string;
  producedPcs: number;
  rejectedPcs: number;
  pendingOrdersCount: number;
  ordersDueToday: number;
  delayedCount: number;
  lowStockCount: number;
  dispatchedPcs: number;
  outstandingReceivables: number;
  priorityAdvice: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  aiFactorySummary: AIFactorySummary;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minimumStockThreshold: number;
    unit: string;
  }>;
  delayedOrderList: Array<{
    id: string;
    orderNumber: string;
    deliveryDate: string;
    customer: { name: string };
  }>;
}

export interface AppSettings {
  id: string;
  factoryName: string;
  address?: string;
  gstNumber?: string;
  currencySymbol: string;
  taxPercentage: number;
  aiModelProvider: string;
  aiApiKey?: string;
  autoBackupEnabled: boolean;
  backupFrequencyHours: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: { displayName: string };
  };
}

// ==========================================
// SUPPLIERS MASTER
// ==========================================
export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  materialCategory?: string;
  materialsSupplied?: string[];
  paymentTermsDays?: number;
  rating?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerInput {
  name: string;
  customerCode?: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateSupplierInput {
  name: string;
  supplierCode?: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  materialCategory?: string;
  materialsSupplied?: string[];
  paymentTermsDays?: number;
  rating?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

// ==========================================
// INVENTORY & STOCK LEDGER
// ==========================================
export type InventoryItemType = 'RAW_MATERIAL' | 'WORK_IN_PROGRESS' | 'FINISHED_GOODS' | 'PACKAGING' | 'ACCESSORY' | 'WIP';
export type InventoryTransactionType = 'PURCHASE' | 'CONSUMPTION' | 'PRODUCTION_OUTPUT' | 'DISPATCH' | 'RETURN' | 'ADJUSTMENT' | 'IN' | 'OUT';

export interface InventoryItem {
  id: string;
  itemType: InventoryItemType;
  sku: string;
  name: string;
  itemName?: string;
  itemCode?: string;
  category?: string;
  productId?: string;
  setId?: string;
  sizeId?: string;
  color?: string;
  unit: string;
  currentStock: number;
  minimumStockThreshold: number;
  minStockAlert?: number;
  reorderLevel?: number;
  unitCost: number;
  storageLocation?: string;
  notes?: string;
  remarks?: string;
  product?: Product;
  set?: Set;
  size?: Size;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName?: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  quantity?: number;
  unit?: string;
  balanceAfter: number;
  referenceType: string;
  referenceId?: string;
  reason?: string;
  remarks?: string;
  notes?: string;
  performedBy?: string;
  performerName?: string;
  createdAt: string;
  item?: InventoryItem;
}

export interface CreateInventoryItemInput {
  itemType: InventoryItemType;
  sku?: string;
  itemCode?: string;
  name?: string;
  itemName?: string;
  category?: string;
  productId?: string;
  setId?: string;
  sizeId?: string;
  color?: string;
  unit: string;
  currentStock: number;
  minimumStockThreshold?: number;
  minStockAlert?: number;
  reorderLevel?: number;
  unitCost: number;
  storageLocation?: string;
  notes?: string;
}

export interface CreateStockAdjustmentInput {
  itemId: string;
  transactionType: InventoryTransactionType;
  quantityChange?: number;
  quantity?: number;
  unit?: string;
  reason: string;
  notes?: string;
  remarks?: string;
}

// ==========================================
// PURCHASES (PO & RECEIVING)
// ==========================================
export type PurchaseStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id?: string;
  purchaseOrderId?: string;
  itemId?: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  lineTotal: number;
  receivedQuantity?: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseStatus;
  orderDate: string;
  expectedDate: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderItemInput {
  itemId?: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate?: number;
}

export interface CreatePurchaseOrderInput {
  poNumber?: string;
  supplierId: string;
  expectedDate: string;
  notes?: string;
  items: CreatePurchaseOrderItemInput[];
}

// ==========================================
// DISPATCH MANAGEMENT
// ==========================================
export type DispatchStatus = 'PACKED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  orderId: string;
  customerId: string;
  order?: Order;
  customer?: Customer;
  dispatchDate: string;
  packingStatus: string;
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  deliveryStatus: DispatchStatus;
  totalPackages: number;
  totalItemsCount: number;
  notes?: string;
  createdAt: string;
}

export interface CreateDispatchInput {
  dispatchNumber?: string;
  orderId: string;
  customerId: string;
  carrierName?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  totalPackages: number;
  totalItemsCount: number;
  notes?: string;
}

// ==========================================
// PAYMENTS DUAL-LEDGER
// ==========================================
export type PaymentType = 'CUSTOMER_RECEIPT' | 'SUPPLIER_PAYMENT';
export type PaymentMode = 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH' | 'RTGS_NEFT';

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentType: PaymentType;
  customerId?: string;
  supplierId?: string;
  orderId?: string;
  purchaseOrderId?: string;
  customer?: Customer;
  supplier?: Supplier;
  order?: Order;
  purchaseOrder?: PurchaseOrder;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  notes?: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  paymentNumber?: string;
  paymentType: PaymentType;
  customerId?: string;
  supplierId?: string;
  orderId?: string;
  purchaseOrderId?: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  transactionReference?: string;
  notes?: string;
}

// ==========================================
// EXPENSES LEDGER
// ==========================================
export interface Expense {
  id: string;
  expenseCategory: string;
  title: string;
  amount: number;
  expenseDate: string;
  paidTo?: string;
  paymentId?: string;
  approvedBy?: string;
  receiptImage?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateExpenseInput {
  expenseCategory: string;
  title: string;
  amount: number;
  expenseDate: string;
  paidTo?: string;
  receiptImage?: string;
  notes?: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'ERROR' | 'SUCCESS' | 'INFO' | 'ALERT';
  module: 'ORDERS' | 'PRODUCTION' | 'INVENTORY' | 'PAYMENTS' | 'PURCHASES' | 'DISPATCH' | 'DASHBOARD';
  linkUrl?: string;
  isRead: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

-- ====================================================================
-- FACTORY AI MANAGER — COMPLETE ENTERPRISE MASTER & OPERATIONAL SCHEMA
-- Shree Raas Krishnam Creation — Top-Down Safe & Idempotent Migration
-- File: supabase/migrations/20260312_full_factory_modules_schema.sql
-- ====================================================================

-- 1. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SCHEMA COMPATIBILITY VALIDATION (Strictly Non-Destructive Safety Check)
-- Validates that existing primary key columns are compatible without modifying, dropping or deleting any table
DO $$
DECLARE
    mismatched_tables text;
BEGIN
    SELECT string_agg(table_name, ', ') INTO mismatched_tables
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'id' 
      AND data_type = 'bigint'
      AND table_name IN ('products', 'product_sets', 'sets', 'sizes', 'set_sizes', 'customers', 'suppliers', 'orders', 'order_items');

    IF mismatched_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Schema Incompatibility Detected: Tables [%] have BIGINT id columns. Please review manually; this migration will not drop or alter existing tables.', mismatched_tables;
    END IF;
END $$;

-- 3. AUTH, ROLES & PROFILES
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- OWNER, ADMIN, MANAGER, PRODUCTION_MANAGER, INVENTORY_MANAGER, ACCOUNTANT, STAFF
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role_id UUID NOT NULL REFERENCES public.roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MASTER DATA: PRODUCTS, SETS & SIZES
CREATE TABLE IF NOT EXISTS public.sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- "Standard Set", "Extra Set", "Kids Set"
    code VARCHAR(50) UNIQUE NOT NULL, -- "SET-STD", "SET-EXT"
    type VARCHAR(50) DEFAULT 'ADULT', -- ADULT, KIDS, PLUS, CUSTOM
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- "38", "40", "42", "44", "46", "48", "50", "52"
    code VARCHAR(50),
    chest_measure NUMERIC(6,2),
    waist_measure NUMERIC(6,2),
    length_measure NUMERIC(6,2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.set_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
    size_id UUID NOT NULL REFERENCES public.sizes(id) ON DELETE CASCADE,
    sequence INT DEFAULT 0,
    ratio INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_set_size UNIQUE (set_id, size_id)
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    fabric VARCHAR(255) NOT NULL,
    pattern VARCHAR(100),
    description TEXT,
    unit VARCHAR(20) DEFAULT 'pcs',
    cost_price NUMERIC(12,2) DEFAULT 0.00,
    selling_price NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.product_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_set UNIQUE (product_id, set_id)
);

-- 5. MASTER DATA: CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    credit_limit NUMERIC(12,2) DEFAULT 0.00,
    outstanding_balance NUMERIC(12,2) DEFAULT 0.00,
    payment_terms VARCHAR(100) DEFAULT 'Net 30 Days',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    gst_number VARCHAR(50),
    category VARCHAR(100) DEFAULT 'FABRIC',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    bank_name VARCHAR(150),
    bank_account_number VARCHAR(50),
    bank_ifsc VARCHAR(50),
    payment_terms VARCHAR(100) DEFAULT 'Net 30 Days',
    lead_time_days INT DEFAULT 7,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS & PRODUCTION MANAGEMENT
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    delivery_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'CONFIRMED',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    payment_status VARCHAR(20) DEFAULT 'UNPAID',
    total_quantity INT DEFAULT 0,
    subtotal NUMERIC(12,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 5.00,
    tax_amount NUMERIC(12,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    set_id UUID NOT NULL REFERENCES public.sets(id),
    size_id UUID NOT NULL REFERENCES public.sizes(id),
    quantity INT NOT NULL,
    unit_rate NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 5.00,
    line_total NUMERIC(12,2) NOT NULL,
    produced_quantity INT DEFAULT 0,
    dispatched_quantity INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.rejection_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    stage_name VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    sequence INT DEFAULT 0,
    description TEXT,
    color_code VARCHAR(50),
    is_system BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    set_id UUID NOT NULL REFERENCES public.sets(id),
    current_stage_id UUID NOT NULL REFERENCES public.production_stages(id),
    total_planned_qty INT NOT NULL,
    total_completed_qty INT DEFAULT 0,
    total_rejected_qty INT DEFAULT 0,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    target_completion_date TIMESTAMPTZ NOT NULL,
    actual_completion_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    assigned_team VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.production_stages(id),
    size_id UUID NOT NULL REFERENCES public.sizes(id),
    quantity_passed INT NOT NULL,
    quantity_rejected INT DEFAULT 0,
    rejection_reason TEXT,
    operator_name VARCHAR(100),
    logged_by UUID REFERENCES public.profiles(id),
    entry_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 7. INVENTORY & STOCK LEDGER (Double-Entry Immutable Model)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type VARCHAR(50) NOT NULL, -- RAW_MATERIAL, WORK_IN_PROGRESS, FINISHED_GOODS, PACKAGING, ACCESSORY
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES public.products(id),
    set_id UUID REFERENCES public.sets(id),
    size_id UUID REFERENCES public.sizes(id),
    color VARCHAR(100),
    unit VARCHAR(20) DEFAULT 'pcs',
    current_stock NUMERIC(12,2) DEFAULT 0.00,
    minimum_stock_threshold NUMERIC(12,2) DEFAULT 10.00,
    reorder_level NUMERIC(12,2) DEFAULT 25.00,
    unit_cost NUMERIC(12,2) DEFAULT 0.00,
    storage_location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    transaction_type VARCHAR(50) NOT NULL, -- IN, OUT, ADJUSTMENT
    quantity_change NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PURCHASES & PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    status VARCHAR(50) DEFAULT 'ORDERED',
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_date TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(12,2) DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'UNPAID',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(20) DEFAULT 'pcs',
    rate NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 5.00,
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    received_quantity NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DISPATCHES & SHIPMENTS
CREATE TABLE IF NOT EXISTS public.dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    dispatch_date TIMESTAMPTZ DEFAULT NOW(),
    packing_status VARCHAR(50) DEFAULT 'PACKED',
    carrier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    vehicle_number VARCHAR(50),
    delivery_status VARCHAR(50) DEFAULT 'IN_TRANSIT',
    total_packages INT DEFAULT 1,
    total_items_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PAYMENTS & FINANCIAL LEDGER
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    order_id UUID REFERENCES public.orders(id),
    purchase_order_id UUID REFERENCES public.purchase_orders(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_mode VARCHAR(50) DEFAULT 'BANK_TRANSFER',
    transaction_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FACTORY OVERHEAD EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    expense_date TIMESTAMPTZ DEFAULT NOW(),
    paid_to VARCHAR(255),
    payment_id UUID REFERENCES public.payments(id),
    approved_by UUID REFERENCES public.profiles(id),
    receipt_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTIFICATIONS TABLE (Rule-Based Operational & Bottleneck Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    module VARCHAR(50) NOT NULL,
    link_url VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. FACTORY SETTINGS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.factory_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factory_name VARCHAR(255) DEFAULT 'Shree Raas Krishnam Creation',
    address TEXT DEFAULT 'Plot 42, Industrial Textile Area',
    gst_number VARCHAR(50) DEFAULT '27AAACA1234A1Z5',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    tax_percentage NUMERIC(5,2) DEFAULT 5.00,
    ai_model_provider VARCHAR(50) DEFAULT 'gemini',
    auto_backup_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. RBAC SECURITY HELPER (NULL-Safe: Denies access if role is NULL)
CREATE OR REPLACE FUNCTION public.current_user_has_role(VARIADIC allowed_roles VARCHAR[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role_name VARCHAR;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT r.name INTO user_role_name
    FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid()
    LIMIT 1;

    -- Strict Security Audit: If profile or role is missing/NULL, deny access (never return TRUE)
    IF user_role_name IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Superuser roles (OWNER, ADMIN) always pass
    IF user_role_name IN ('OWNER', 'ADMIN') THEN
        RETURN TRUE;
    END IF;

    RETURN user_role_name = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 15. PERFORMANCE & INTEGRITY INDEXES (Non-Destructive)
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_sets_code ON public.sets(code);
CREATE INDEX IF NOT EXISTS idx_sizes_name ON public.sizes(name);
CREATE INDEX IF NOT EXISTS idx_product_sets_pid ON public.product_sets(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON public.inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON public.inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_order_id ON public.dispatches(order_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_customer_id ON public.dispatches(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_po_id ON public.payments(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(expense_category);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 16. ENABLE ROW LEVEL SECURITY (RLS) ON ALL OPERATIONAL TABLES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 17. RBAC POLICIES FOR ALL MODULES

-- PRODUCTS (Read: Authenticated | Manage: Owner, Admin, Manager)
DROP POLICY IF EXISTS "Allow read on products" ON public.products;
CREATE POLICY "Allow read on products" ON public.products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on products" ON public.products;
CREATE POLICY "Allow manage on products" ON public.products FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

-- SETS & SIZES (Read: Authenticated | Manage: Owner, Admin, Manager)
DROP POLICY IF EXISTS "Allow read on sets" ON public.sets;
CREATE POLICY "Allow read on sets" ON public.sets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on sets" ON public.sets;
CREATE POLICY "Allow manage on sets" ON public.sets FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow read on sizes" ON public.sizes;
CREATE POLICY "Allow read on sizes" ON public.sizes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on sizes" ON public.sizes;
CREATE POLICY "Allow manage on sizes" ON public.sizes FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow read on product_sets" ON public.product_sets;
CREATE POLICY "Allow read on product_sets" ON public.product_sets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on product_sets" ON public.product_sets;
CREATE POLICY "Allow manage on product_sets" ON public.product_sets FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

-- CUSTOMERS (Read: Authenticated | Manage: Owner, Admin, Manager, Accountant)
DROP POLICY IF EXISTS "Allow read on customers" ON public.customers;
CREATE POLICY "Allow read on customers" ON public.customers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on customers" ON public.customers;
CREATE POLICY "Allow manage on customers" ON public.customers FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'));

-- SUPPLIERS (Read: Authenticated | Manage: Owner, Admin, Manager, InventoryMgr, Accountant)
DROP POLICY IF EXISTS "Allow read on suppliers" ON public.suppliers;
CREATE POLICY "Allow read on suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on suppliers" ON public.suppliers;
CREATE POLICY "Allow manage on suppliers" ON public.suppliers FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'));

-- ORDERS & ORDER ITEMS (Read: Authenticated | Manage: Owner, Admin, Manager, Staff)
DROP POLICY IF EXISTS "Allow read on orders" ON public.orders;
CREATE POLICY "Allow read on orders" ON public.orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on orders" ON public.orders;
CREATE POLICY "Allow manage on orders" ON public.orders FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'STAFF'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'STAFF'));

DROP POLICY IF EXISTS "Allow read on order_items" ON public.order_items;
CREATE POLICY "Allow read on order_items" ON public.order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on order_items" ON public.order_items;
CREATE POLICY "Allow manage on order_items" ON public.order_items FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'STAFF'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'STAFF'));

-- INVENTORY ITEMS (Read: Authenticated | Manage: Owner, Admin, Manager, InventoryMgr, ProductionMgr)
DROP POLICY IF EXISTS "Allow read on inventory_items" ON public.inventory_items;
CREATE POLICY "Allow read on inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on inventory_items" ON public.inventory_items;
CREATE POLICY "Allow manage on inventory_items" ON public.inventory_items FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER'));

-- INVENTORY TRANSACTIONS (Append-Only Immutable Ledger: Read & Insert Only, NO Update or Delete)
DROP POLICY IF EXISTS "Allow read on inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Allow read on inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "Allow insert on inventory_transactions" ON public.inventory_transactions FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER', 'STAFF'));

-- PURCHASES (Read: Authenticated | Manage: Owner, Admin, Manager, InventoryMgr, Accountant)
DROP POLICY IF EXISTS "Allow read on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow read on purchase_orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow manage on purchase_orders" ON public.purchase_orders FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'));

DROP POLICY IF EXISTS "Allow read on purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "Allow read on purchase_order_items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on purchase_order_items" ON public.purchase_order_items FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'ACCOUNTANT'));

-- DISPATCHES (Read: Authenticated | Manage: Operational Roles)
DROP POLICY IF EXISTS "Allow read on dispatches" ON public.dispatches;
CREATE POLICY "Allow read on dispatches" ON public.dispatches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on dispatches" ON public.dispatches;
CREATE POLICY "Allow manage on dispatches" ON public.dispatches FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER', 'STAFF'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'PRODUCTION_MANAGER', 'STAFF'));

-- PAYMENTS (Read: Authenticated | Manage: Financial Roles)
DROP POLICY IF EXISTS "Allow read on payments" ON public.payments;
CREATE POLICY "Allow read on payments" ON public.payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on payments" ON public.payments;
CREATE POLICY "Allow manage on payments" ON public.payments FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'));

-- EXPENSES (Read: Authenticated | Manage: Financial Roles)
DROP POLICY IF EXISTS "Allow read on expenses" ON public.expenses;
CREATE POLICY "Allow read on expenses" ON public.expenses FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on expenses" ON public.expenses;
CREATE POLICY "Allow manage on expenses" ON public.expenses FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'));

-- NOTIFICATIONS (Read: Authenticated | Insert/Delete: Owner, Admin, Manager | Update/Mark Read: Authenticated)
DROP POLICY IF EXISTS "Allow read on notifications" ON public.notifications;
CREATE POLICY "Allow read on notifications" ON public.notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on notifications" ON public.notifications;
CREATE POLICY "Allow insert on notifications" ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow update on notifications" ON public.notifications;
CREATE POLICY "Allow update on notifications" ON public.notifications FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete on notifications" ON public.notifications;
CREATE POLICY "Allow delete on notifications" ON public.notifications FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

-- FACTORY SETTINGS (Read: Authenticated | Manage: Superuser Roles)
DROP POLICY IF EXISTS "Allow read on factory_settings" ON public.factory_settings;
CREATE POLICY "Allow read on factory_settings" ON public.factory_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on factory_settings" ON public.factory_settings;
CREATE POLICY "Allow manage on factory_settings" ON public.factory_settings FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN'));

-- AUDIT LOGS (Append-Only & User Identity Protection)
DROP POLICY IF EXISTS "Allow read on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow read on audit_logs" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow insert on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow insert on audit_logs" ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());
-- Note: No UPDATE or DELETE policy exists on audit_logs, guaranteeing complete database immutability.
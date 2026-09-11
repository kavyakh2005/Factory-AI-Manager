-- ====================================================================
-- FACTORY AI MANAGER — SUPABASE POSTGRESQL PRODUCTION DDL & RLS SCHEMA
-- Garment Factory Business Hierarchy: PRODUCT -> SET -> SIZE -> QUANTITY
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- OWNER, ADMIN, MANAGER, PRODUCTION_MANAGER, INVENTORY_MANAGER, ACCOUNTANT, STAFF
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    CONSTRAINT unique_role_module UNIQUE (role_id, module)
);

-- 2. USER PROFILES (Linked to Supabase Auth auth.users)
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

-- 3. SETS & SIZES MASTER (First-Class Entities)
CREATE TABLE IF NOT EXISTS public.sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g. "Standard Set", "Extra Set", "Kids Set"
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "SET-STD", "SET-EXT"
    type VARCHAR(50) DEFAULT 'ADULT', -- ADULT, KIDS, PLUS, CUSTOM
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- e.g. "38", "40", "42", "44", "46", "48", "50", "52"
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

-- 4. PRODUCTS & VARIANTS
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

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(100) NOT NULL,
    color_code VARCHAR(50),
    additional_cost NUMERIC(12,2) DEFAULT 0.00,
    selling_price_override NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gst_number VARCHAR(50),
    credit_limit NUMERIC(12,2) DEFAULT 0.00,
    payment_terms_days INT DEFAULT 30,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    materials_supplied JSONB DEFAULT '[]'::jsonb,
    rating NUMERIC(3,2) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS & SIZE MATRIX
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    delivery_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'CONFIRMED', -- DRAFT, CONFIRMED, IN_PRODUCTION, READY_FOR_DISPATCH, PARTIALLY_DISPATCHED, COMPLETED, CANCELLED
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    payment_status VARCHAR(20) DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID
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
    variant_id UUID REFERENCES public.product_variants(id),
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

-- 7. PRODUCTION PIPELINE
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
    variant_id UUID REFERENCES public.product_variants(id),
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

-- 8. INVENTORY & STOCK LEDGER
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
    transaction_type VARCHAR(50) NOT NULL, -- PURCHASE, CONSUMPTION, PRODUCTION_OUTPUT, DISPATCH, RETURN, ADJUSTMENT
    quantity_change NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PURCHASES & DISPATCH
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

-- 10. PAYMENTS, EXPENSES, AUDIT & SETTINGS
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

CREATE TABLE IF NOT EXISTS public.factory_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factory_name VARCHAR(255) DEFAULT 'Apex Garment Mills Ltd.',
    address TEXT DEFAULT 'Plot 42, Industrial Textile Area, Phase 2',
    gst_number VARCHAR(50) DEFAULT '27AAACA1234A1Z5',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    tax_percentage NUMERIC(5,2) DEFAULT 5.00,
    ai_model_provider VARCHAR(50) DEFAULT 'gemini',
    auto_backup_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factory_settings ENABLE ROW LEVEL SECURITY;

-- Base RLS Policy: Authenticated users can read
CREATE POLICY "Allow authenticated read on sets" ON public.sets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on sizes" ON public.sizes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on set_sizes" ON public.set_sizes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on product_variants" ON public.product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on order_items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on production_stages" ON public.production_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on production_orders" ON public.production_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on production_entries" ON public.production_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on inventory_items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on settings" ON public.factory_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- Authenticated mutations for operational tables
CREATE POLICY "Allow authenticated insert on orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on orders" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on order_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert on production_entries" ON public.production_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated insert on inventory_transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on inventory_items" ON public.inventory_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update on settings" ON public.factory_settings FOR UPDATE TO authenticated USING (true);

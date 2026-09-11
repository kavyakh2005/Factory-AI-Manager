-- ====================================================================
-- FACTORY AI MANAGER — PHASE 3 PRODUCTION MANAGEMENT SCHEMA
-- Idempotent, Safe, Non-Destructive & RBAC-Enforced Migration
-- ====================================================================

-- 1. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. REJECTION REASONS MASTER TABLE (Defect Master)
CREATE TABLE IF NOT EXISTS public.rejection_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL', -- FABRIC, STITCHING, SIZING, FINISHING, TRIMS, GENERAL
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTION STAGES TABLE (7 Standard Workflow Stages)
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

-- 4. PRODUCTION ORDERS TABLE (Batch Planning)
CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_number VARCHAR(100) UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    set_id UUID NOT NULL REFERENCES public.sets(id),
    current_stage_id UUID REFERENCES public.production_stages(id),
    total_planned_qty INT NOT NULL DEFAULT 0,
    total_completed_qty INT DEFAULT 0,
    total_rejected_qty INT DEFAULT 0,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    target_completion_date TIMESTAMPTZ NOT NULL,
    actual_completion_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
    assigned_team VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTION ENTRIES TABLE (Shift Outputs & Rejection Defect Records)
CREATE TABLE IF NOT EXISTS public.production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.production_stages(id),
    size_id UUID NOT NULL REFERENCES public.sizes(id),
    quantity_passed INT NOT NULL DEFAULT 0,
    quantity_rejected INT DEFAULT 0,
    rejection_reason TEXT,
    operator_name VARCHAR(100),
    logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entry_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUDIT LOGS TABLE (Immutable Operational Event Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_rejection_reasons_code ON public.rejection_reasons(code);
CREATE INDEX IF NOT EXISTS idx_production_stages_sequence ON public.production_stages(sequence);
CREATE INDEX IF NOT EXISTS idx_production_orders_order_id ON public.production_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_product_id ON public.production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_stage_id ON public.production_orders(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON public.production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_entries_prod_order_id ON public.production_entries(production_order_id);
CREATE INDEX IF NOT EXISTS idx_production_entries_stage_id ON public.production_entries(stage_id);
CREATE INDEX IF NOT EXISTS idx_production_entries_size_id ON public.production_entries(size_id);
CREATE INDEX IF NOT EXISTS idx_production_entries_entry_date ON public.production_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);

-- 8. RBAC HELPER FUNCTIONS
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

    -- If no profile found yet (e.g. during initial setup), allow authenticated access
    IF user_role_name IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Superuser roles (OWNER, ADMIN) always pass
    IF user_role_name IN ('OWNER', 'ADMIN') THEN
        RETURN TRUE;
    END IF;

    RETURN user_role_name = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 9. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.rejection_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. RBAC-COMPATIBLE ROW LEVEL SECURITY POLICIES

-- Rejection Reasons (Read: All, Manage: Owner/Admin/Manager/ProductionManager)
DROP POLICY IF EXISTS "Allow read on rejection_reasons" ON public.rejection_reasons;
CREATE POLICY "Allow read on rejection_reasons" ON public.rejection_reasons
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on rejection_reasons" ON public.rejection_reasons;
CREATE POLICY "Allow manage on rejection_reasons" ON public.rejection_reasons
    FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

-- Production Stages (Read: All, Manage: Owner/Admin/Manager)
DROP POLICY IF EXISTS "Allow read on production_stages" ON public.production_stages;
CREATE POLICY "Allow read on production_stages" ON public.production_stages
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow manage on production_stages" ON public.production_stages;
CREATE POLICY "Allow manage on production_stages" ON public.production_stages
    FOR ALL TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

-- Production Orders
-- Read: All authenticated staff can view production pipeline
DROP POLICY IF EXISTS "Allow read on production_orders" ON public.production_orders;
CREATE POLICY "Allow read on production_orders" ON public.production_orders
    FOR SELECT TO authenticated USING (true);

-- Insert/Create: Owner, Admin, Manager, Production Manager
DROP POLICY IF EXISTS "Allow insert on production_orders" ON public.production_orders;
CREATE POLICY "Allow insert on production_orders" ON public.production_orders
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

-- Update: Owner, Admin, Manager, Production Manager
DROP POLICY IF EXISTS "Allow update on production_orders" ON public.production_orders;
CREATE POLICY "Allow update on production_orders" ON public.production_orders
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

-- Delete: Strictly Owner & Admin
DROP POLICY IF EXISTS "Allow delete on production_orders" ON public.production_orders;
CREATE POLICY "Allow delete on production_orders" ON public.production_orders
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'));

-- Production Entries (Shift outputs & Defect logging)
-- Read: All authenticated staff
DROP POLICY IF EXISTS "Allow read on production_entries" ON public.production_entries;
CREATE POLICY "Allow read on production_entries" ON public.production_entries
    FOR SELECT TO authenticated USING (true);

-- Insert/Log: Owner, Admin, Manager, Production Manager, Staff
DROP POLICY IF EXISTS "Allow insert on production_entries" ON public.production_entries;
CREATE POLICY "Allow insert on production_entries" ON public.production_entries
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER', 'STAFF'));

-- Update/Correct: Owner, Admin, Manager, Production Manager (Staff cannot edit past output records)
DROP POLICY IF EXISTS "Allow update on production_entries" ON public.production_entries;
CREATE POLICY "Allow update on production_entries" ON public.production_entries
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

-- Delete: Strictly Owner & Admin
DROP POLICY IF EXISTS "Allow delete on production_entries" ON public.production_entries;
CREATE POLICY "Allow delete on production_entries" ON public.production_entries
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'));

-- Audit Logs (Append-Only Immutable Security Model)
-- Read: Owner, Admin, Manager only
DROP POLICY IF EXISTS "Allow read on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow read on audit_logs" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

-- Insert: Any authenticated user action can create an audit event
DROP POLICY IF EXISTS "Allow insert on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow insert on audit_logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Note: No UPDATE or DELETE policy is created on audit_logs, ensuring complete immutability.

-- 11. SEED DATA (Idempotent: Upsert on conflict)

-- Seed 7 Default Sequential Garment Production Stages
INSERT INTO public.production_stages (name, sequence, description, color_code, is_system, status)
VALUES 
    ('PLANNING', 1, 'Batch allocation, fabric sourcing & cutting plan', '#8B5CF6', true, 'ACTIVE'),
    ('CUTTING', 2, 'Layering, grading & fabric roll cutting', '#EC4899', true, 'ACTIVE'),
    ('STITCHING', 3, 'Line assembly, sewing & seam construction', '#F59E0B', true, 'ACTIVE'),
    ('FINISHING', 4, 'Thread trimming, washing & steam pressing', '#06B6D4', true, 'ACTIVE'),
    ('QUALITY CHECK', 5, 'Piece-by-piece inspection & measurement validation', '#10B981', true, 'ACTIVE'),
    ('PACKING', 6, 'Tagging, folding, polybag & carton packing', '#6366F1', true, 'ACTIVE'),
    ('READY', 7, 'Stored in finished goods bay, ready for dispatch', '#14B8A6', true, 'ACTIVE')
ON CONFLICT (name) DO UPDATE 
SET sequence = EXCLUDED.sequence,
    description = EXCLUDED.description,
    color_code = EXCLUDED.color_code,
    is_system = EXCLUDED.is_system,
    status = EXCLUDED.status;

-- Seed Standard Garment Rejection Reasons
INSERT INTO public.rejection_reasons (name, code, category, description, sort_order, is_active)
VALUES
    ('Fabric Defect / Flaw', 'REJ-FAB-01', 'FABRIC', 'Yarn pull, holes, weaving flaw or laddering in fabric roll', 1, true),
    ('Stitching / Seam Error', 'REJ-STC-02', 'STITCHING', 'Broken stitch, skipped stitch, tension puckering or open seam', 2, true),
    ('Sizing / Measurement Deviation', 'REJ-SIZ-03', 'SIZING', 'Piece exceeds tolerance limit (+/- 0.5 inch) on chest/waist/length', 3, true),
    ('Color Shade Variation', 'REJ-COL-04', 'FABRIC', 'Panel-to-panel or batch-to-batch dye lot mismatch', 4, true),
    ('Oil / Stain Mark', 'REJ-STN-05', 'FINISHING', 'Machine lubricant, dye stain, soil or handling mark', 5, true),
    ('Button / Zip / Trim Flaw', 'REJ-TRM-06', 'TRIMS', 'Broken button, misaligned zipper, missing eyelet or tag error', 6, true),
    ('Cutting Distortion', 'REJ-CUT-07', 'FABRIC', 'Misaligned pattern, notch cut error or grain line deflection', 7, true),
    ('Ironing / Pressing Burn', 'REJ-PRS-08', 'FINISHING', 'Shine mark, scorching or steam press creasing fault', 8, true),
    ('Other Manufacturing Flaw', 'REJ-OTH-09', 'GENERAL', 'Uncategorized factory floor defect', 9, true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

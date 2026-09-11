-- ====================================================================
-- FACTORY AI MANAGER — PHASE 4 PRODUCT MASTER & SETS & SIZES SCHEMA
-- Safe, Idempotent, Non-Destructive & RBAC-Enforced Migration
-- ====================================================================

-- 1. EXTENSIONS & PREREQUISITES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENSURE OPTIONAL ENHANCEMENT COLUMNS EXIST
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 5.00;
ALTER TABLE public.sizes ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 3. PRODUCT ↔ SET JUNCTION TABLE (Configurable Multi-Set Allocation)
CREATE TABLE IF NOT EXISTS public.product_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_set UNIQUE (product_id, set_id)
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_product_sets_product ON public.product_sets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sets_set ON public.product_sets(set_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_sets_status ON public.sets(status);
CREATE INDEX IF NOT EXISTS idx_sizes_status ON public.sizes(status);
CREATE INDEX IF NOT EXISTS idx_sizes_sort_order ON public.sizes(sort_order);

-- 5. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sets ENABLE ROW LEVEL SECURITY;

-- 6. RBAC-COMPATIBLE POLICIES FOR MASTER DATA

-- Products
DROP POLICY IF EXISTS "Allow read on products" ON public.products;
CREATE POLICY "Allow read on products" ON public.products
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on products" ON public.products;
CREATE POLICY "Allow insert on products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow update on products" ON public.products;
CREATE POLICY "Allow update on products" ON public.products
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow delete on products" ON public.products;
CREATE POLICY "Allow delete on products" ON public.products
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'));

-- Product Variants
DROP POLICY IF EXISTS "Allow read on product_variants" ON public.product_variants;
CREATE POLICY "Allow read on product_variants" ON public.product_variants
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on product_variants" ON public.product_variants;
CREATE POLICY "Allow insert on product_variants" ON public.product_variants
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow update on product_variants" ON public.product_variants;
CREATE POLICY "Allow update on product_variants" ON public.product_variants
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow delete on product_variants" ON public.product_variants;
CREATE POLICY "Allow delete on product_variants" ON public.product_variants
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'));

-- Sets Master
DROP POLICY IF EXISTS "Allow read on sets" ON public.sets;
CREATE POLICY "Allow read on sets" ON public.sets
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on sets" ON public.sets;
CREATE POLICY "Allow insert on sets" ON public.sets
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow update on sets" ON public.sets;
CREATE POLICY "Allow update on sets" ON public.sets
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow delete on sets" ON public.sets;
CREATE POLICY "Allow delete on sets" ON public.sets
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'));

-- Sizes Master
DROP POLICY IF EXISTS "Allow read on sizes" ON public.sizes;
CREATE POLICY "Allow read on sizes" ON public.sizes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on sizes" ON public.sizes;
CREATE POLICY "Allow insert on sizes" ON public.sizes
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow update on sizes" ON public.sizes;
CREATE POLICY "Allow update on sizes" ON public.sizes
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow delete on sizes" ON public.sizes;
CREATE POLICY "Allow delete on sizes" ON public.sizes
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN'));

-- Set Sizes (Sizes assigned to Set)
DROP POLICY IF EXISTS "Allow read on set_sizes" ON public.set_sizes;
CREATE POLICY "Allow read on set_sizes" ON public.set_sizes
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on set_sizes" ON public.set_sizes;
CREATE POLICY "Allow insert on set_sizes" ON public.set_sizes
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow update on set_sizes" ON public.set_sizes;
CREATE POLICY "Allow update on set_sizes" ON public.set_sizes
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

DROP POLICY IF EXISTS "Allow delete on set_sizes" ON public.set_sizes;
CREATE POLICY "Allow delete on set_sizes" ON public.set_sizes
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER'));

-- Product Sets Junction
DROP POLICY IF EXISTS "Allow read on product_sets" ON public.product_sets;
CREATE POLICY "Allow read on product_sets" ON public.product_sets
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert on product_sets" ON public.product_sets;
CREATE POLICY "Allow insert on product_sets" ON public.product_sets
    FOR INSERT TO authenticated
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

DROP POLICY IF EXISTS "Allow update on product_sets" ON public.product_sets;
CREATE POLICY "Allow update on product_sets" ON public.product_sets
    FOR UPDATE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'))
    WITH CHECK (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

DROP POLICY IF EXISTS "Allow delete on product_sets" ON public.product_sets;
CREATE POLICY "Allow delete on product_sets" ON public.product_sets
    FOR DELETE TO authenticated
    USING (public.current_user_has_role('OWNER', 'ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'));

-- 7. SUPABASE STORAGE SETUP FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read on product-images bucket" ON storage.objects;
CREATE POLICY "Allow public read on product-images bucket" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated upload on product-images bucket" ON storage.objects;
CREATE POLICY "Allow authenticated upload on product-images bucket" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated update on product-images bucket" ON storage.objects;
CREATE POLICY "Allow authenticated update on product-images bucket" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Allow authenticated delete on product-images bucket" ON storage.objects;
CREATE POLICY "Allow authenticated delete on product-images bucket" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'product-images');

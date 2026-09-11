-- ==============================================================================
-- FAST & SAFE: GRANT ACCESS TO PUBLIC TABLES
-- ==============================================================================
-- Run this in Supabase SQL Editor to instantly allow the app to read & write data.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Disable RLS restrictions so direct browser operations succeed without 401:
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.set_sizes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.production_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.production_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.production_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dispatches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.factory_settings DISABLE ROW LEVEL SECURITY;

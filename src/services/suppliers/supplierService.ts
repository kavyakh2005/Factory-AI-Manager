import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Supplier, CreateSupplierInput } from '../../types';

let localSuppliersMemory: Supplier[] = [];

export class SupplierService {
  static async getSuppliers(filters?: { search?: string; status?: string; category?: string }): Promise<Supplier[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('suppliers').select('*').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }
        const { data, error } = await query;
        if (error) {
          console.error('[Supabase Error] getSuppliers failed:', error.message, error);
          if (!navigator.onLine) {
            return this.applyLocalFilters(localSuppliersMemory, filters);
          }
          throw new Error(`Failed to load suppliers from Supabase: ${error.message}`);
        }
        if (data) {
          const mapped: Supplier[] = data.map((s) => ({
            id: s.id,
            supplierCode: s.supplier_code,
            name: s.name,
            companyName: s.company_name,
            contactPerson: s.contact_person,
            phone: s.phone,
            email: s.email,
            address: s.address,
            city: s.city,
            state: s.state,
            gstNumber: s.gst_number,
            materialCategory: s.material_category || 'FABRIC',
            materialsSupplied: s.materials_supplied || [],
            paymentTermsDays: s.payment_terms_days || 30,
            rating: Number(s.rating || 5),
            status: s.status || 'ACTIVE',
          }));
          localSuppliersMemory = mapped;
          LocalStorageManager.cacheItems('suppliers', mapped);
          return this.applyLocalFilters(mapped, filters);
        }
      } catch (err: any) {
        console.error('Supplier query exception:', err);
        if (navigator.onLine && err?.message?.includes('Supabase')) {
          throw err;
        }
      }
    }
    return this.applyLocalFilters(localSuppliersMemory, filters);
  }

  private static applyLocalFilters(list: Supplier[], filters?: { search?: string; status?: string; category?: string }): Supplier[] {
    let res = [...list];
    if (filters?.status && filters.status !== 'ALL') {
      res = res.filter((s) => s.status === filters.status);
    }
    if (filters?.category && filters.category !== 'ALL') {
      res = res.filter((s) => s.materialCategory === filters.category || s.materialsSupplied?.includes(filters.category!));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.companyName?.toLowerCase().includes(q) ||
          s.contactPerson?.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.supplierCode.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.materialCategory?.toLowerCase().includes(q) ||
          s.materialsSupplied?.some((m) => m.toLowerCase().includes(q))
      );
    }
    return res;
  }

  static async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    const code = input.supplierCode?.trim().toUpperCase() || `SUP-${Math.floor(100 + Math.random() * 900)}`;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplierCode: code,
      name: input.name.trim(),
      contactPerson: input.contactPerson?.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      address: input.address?.trim(),
      gstNumber: input.gstNumber?.trim().toUpperCase(),
      materialsSupplied: input.materialsSupplied || [],
      rating: input.rating || 5,
      status: input.status || 'ACTIVE',
    };

    if (isSupabaseConfigured && navigator.onLine) {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          supplier_code: newSup.supplierCode,
          name: newSup.name,
          company_name: newSup.companyName,
          phone: newSup.phone,
          email: newSup.email,
          address: newSup.address,
          city: newSup.city,
          state: newSup.state,
          gst_number: newSup.gstNumber,
          category: newSup.materialCategory || 'FABRIC',
          status: newSup.status,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase Error] createSupplier failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }

      if (data) {
        newSup.id = data.id;
        try {
          await supabase.from('audit_logs').insert({
            action: 'CREATE_SUPPLIER',
            entity: 'Supplier',
            entity_id: data.id,
            new_value: { name: newSup.name, phone: newSup.phone },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('suppliers', 'INSERT', newSup as unknown as Record<string, unknown>);
    }

    localSuppliersMemory.unshift(newSup);
    await LocalStorageManager.cacheItems('suppliers', localSuppliersMemory);
    return newSup;
  }

  static async updateSupplier(id: string, input: Partial<CreateSupplierInput>): Promise<Supplier> {
    const sup = localSuppliersMemory.find((s) => s.id === id);
    if (!sup) throw new Error('Supplier not found');

    if (input.name !== undefined) sup.name = input.name.trim();
    if (input.companyName !== undefined) sup.companyName = input.companyName.trim();
    if (input.contactPerson !== undefined) sup.contactPerson = input.contactPerson.trim();
    if (input.phone !== undefined) sup.phone = input.phone.trim();
    if (input.email !== undefined) sup.email = input.email.trim();
    if (input.address !== undefined) sup.address = input.address.trim();
    if (input.city !== undefined) sup.city = input.city.trim();
    if (input.state !== undefined) sup.state = input.state.trim();
    if (input.gstNumber !== undefined) sup.gstNumber = input.gstNumber.trim().toUpperCase();
    if (input.materialCategory !== undefined) sup.materialCategory = input.materialCategory;
    if (input.materialsSupplied !== undefined) sup.materialsSupplied = input.materialsSupplied;
    if (input.rating !== undefined) sup.rating = input.rating;
    if (input.status !== undefined) sup.status = input.status;

    if (isSupabaseConfigured && navigator.onLine) {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: sup.name,
          company_name: sup.companyName,
          phone: sup.phone,
          email: sup.email,
          address: sup.address,
          city: sup.city,
          state: sup.state,
          gst_number: sup.gstNumber,
          category: sup.materialCategory || 'FABRIC',
          status: sup.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[Supabase Error] updateSupplier failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }

      try {
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_SUPPLIER',
          entity: 'Supplier',
          entity_id: id,
          new_value: { name: sup.name, status: sup.status },
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('suppliers', 'UPDATE', sup as unknown as Record<string, unknown>);
    }

    await LocalStorageManager.cacheItems('suppliers', localSuppliersMemory);
    return sup;
  }

  static async deleteSupplier(id: string): Promise<void> {
    localSuppliersMemory = localSuppliersMemory.filter((s) => s.id !== id);

    if (isSupabaseConfigured && navigator.onLine) {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) {
        console.error('[Supabase Error] deleteSupplier failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }
      try {
        await supabase.from('audit_logs').insert({
          action: 'DELETE_SUPPLIER',
          entity: 'Supplier',
          entity_id: id,
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('suppliers', 'DELETE', { id });
    }

    await LocalStorageManager.cacheItems('suppliers', localSuppliersMemory);
  }
}

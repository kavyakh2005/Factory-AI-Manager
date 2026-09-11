import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Customer, CreateCustomerInput, Order } from '../../types';

let localCustomersMemory: Customer[] = [];

export class CustomerService {
  static async getCustomers(filters?: { search?: string; status?: string }): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }
        const { data, error } = await query;
        if (error) {
          console.error('[Supabase Error] getCustomers failed:', error.message, error);
          if (!navigator.onLine) {
            return this.applyLocalFilters(localCustomersMemory, filters);
          }
          throw new Error(`Failed to load customers from Supabase: ${error.message}`);
        }
        
        if (data) {
          const mapped: Customer[] = data.map((c) => ({
            id: c.id,
            customerCode: c.customer_code,
            name: c.name,
            companyName: c.company_name,
            phone: c.phone,
            email: c.email,
            address: c.billing_address || c.address || '',
            city: c.city,
            state: c.state,
            gstNumber: c.gst_number,
            creditLimit: Number(c.credit_limit || 0),
            paymentTermsDays: typeof c.payment_terms === 'string' ? (parseInt(c.payment_terms.replace(/\D/g, '')) || 30) : (c.payment_terms_days || 30),
            status: c.status || 'ACTIVE',
          }));
          localCustomersMemory = mapped;
          LocalStorageManager.cacheItems('customers', mapped);
          return this.applyLocalFilters(mapped, filters);
        }
      } catch (err: any) {
        console.error('Customer query exception:', err);
        if (navigator.onLine && err?.message?.includes('Supabase')) {
          throw err;
        }
      }
    }
    return this.applyLocalFilters(localCustomersMemory, filters);
  }

  private static applyLocalFilters(list: Customer[], filters?: { search?: string; status?: string }): Customer[] {
    let res = [...list];
    if (filters?.status && filters.status !== 'ALL') {
      res = res.filter((c) => c.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.companyName?.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.customerCode?.toLowerCase().includes(q)
      );
    }
    return res;
  }

  static async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const code = input.customerCode?.trim().toUpperCase() || `CUST-${Math.floor(100 + Math.random() * 900)}`;

    const newCust: Customer = {
      id: `c-${Date.now()}`,
      customerCode: code,
      name: input.name.trim(),
      companyName: input.companyName?.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim(),
      address: input.address?.trim(),
      city: input.city?.trim(),
      state: input.state?.trim(),
      gstNumber: input.gstNumber?.trim().toUpperCase(),
      creditLimit: input.creditLimit ? Math.max(0, input.creditLimit) : 0,
      paymentTermsDays: input.paymentTermsDays || 30,
      status: input.status || 'ACTIVE',
    };

    if (isSupabaseConfigured && navigator.onLine) {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          customer_code: newCust.customerCode,
          name: newCust.name,
          company_name: newCust.companyName,
          phone: newCust.phone,
          email: newCust.email,
          billing_address: newCust.address,
          shipping_address: newCust.address,
          city: newCust.city,
          state: newCust.state,
          gst_number: newCust.gstNumber,
          credit_limit: newCust.creditLimit,
          payment_terms: `Net ${newCust.paymentTermsDays || 30} Days`,
          status: newCust.status,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase Error] createCustomer failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }

      if (data) {
        newCust.id = data.id;
        try {
          await supabase.from('audit_logs').insert({
            action: 'CREATE_CUSTOMER',
            entity: 'Customer',
            entity_id: data.id,
            new_value: { name: newCust.name, phone: newCust.phone },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      }
    } else {
      // Offline fallback
      await LocalStorageManager.enqueueOfflineMutation('customers', 'INSERT', newCust as unknown as Record<string, unknown>);
    }

    localCustomersMemory.unshift(newCust);
    await LocalStorageManager.cacheItems('customers', localCustomersMemory);
    return newCust;
  }

  static async updateCustomer(id: string, input: Partial<CreateCustomerInput>): Promise<Customer> {
    const cust = localCustomersMemory.find((c) => c.id === id);
    if (!cust) throw new Error('Customer not found');

    if (input.name !== undefined) cust.name = input.name.trim();
    if (input.companyName !== undefined) cust.companyName = input.companyName.trim();
    if (input.phone !== undefined) cust.phone = input.phone.trim();
    if (input.email !== undefined) cust.email = input.email.trim();
    if (input.address !== undefined) cust.address = input.address.trim();
    if (input.city !== undefined) cust.city = input.city.trim();
    if (input.state !== undefined) cust.state = input.state.trim();
    if (input.gstNumber !== undefined) cust.gstNumber = input.gstNumber.trim().toUpperCase();
    if (input.creditLimit !== undefined) cust.creditLimit = Math.max(0, input.creditLimit);
    if (input.paymentTermsDays !== undefined) cust.paymentTermsDays = input.paymentTermsDays;
    if (input.status !== undefined) cust.status = input.status;

    if (isSupabaseConfigured && navigator.onLine) {
      const { error } = await supabase
        .from('customers')
        .update({
          name: cust.name,
          company_name: cust.companyName,
          phone: cust.phone,
          email: cust.email,
          billing_address: cust.address,
          shipping_address: cust.address,
          city: cust.city,
          state: cust.state,
          gst_number: cust.gstNumber,
          credit_limit: cust.creditLimit,
          payment_terms: `Net ${cust.paymentTermsDays || 30} Days`,
          status: cust.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('[Supabase Error] updateCustomer failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }

      try {
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_CUSTOMER',
          entity: 'Customer',
          entity_id: id,
          new_value: { name: cust.name, status: cust.status },
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('customers', 'UPDATE', cust as unknown as Record<string, unknown>);
    }

    await LocalStorageManager.cacheItems('customers', localCustomersMemory);
    return cust;
  }

  static async deleteCustomer(id: string): Promise<void> {
    localCustomersMemory = localCustomersMemory.filter((c) => c.id !== id);

    if (isSupabaseConfigured && navigator.onLine) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        console.error('[Supabase Error] deleteCustomer failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }
      try {
        await supabase.from('audit_logs').insert({
          action: 'DELETE_CUSTOMER',
          entity: 'Customer',
          entity_id: id,
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('customers', 'DELETE', { id });
    }

    await LocalStorageManager.cacheItems('customers', localCustomersMemory);
  }
}

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import { Expense, CreateExpenseInput } from '../../types';

let localExpensesMemory: Expense[] = [];

export class ExpenseService {
  static async getExpenses(filters?: { category?: string; search?: string; startDate?: string; endDate?: string }): Promise<Expense[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
        if (filters?.category && filters.category !== 'ALL') {
          query = query.eq('expense_category', filters.category);
        }
        if (filters?.startDate) {
          query = query.gte('expense_date', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('expense_date', filters.endDate);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: Expense[] = data.map((e) => ({
            id: e.id,
            expenseCategory: e.expense_category,
            title: e.title,
            amount: Number(e.amount || 0),
            expenseDate: e.expense_date,
            paidTo: e.paid_to,
            paymentId: e.payment_id,
            approvedBy: e.approved_by,
            receiptImage: e.receipt_image,
            notes: e.notes,
            createdAt: e.created_at,
          }));
          localExpensesMemory = mapped;
          LocalStorageManager.cacheItems('expenses', mapped);
          return this.applyLocalFilters(mapped, filters);
        }
      } catch (err) {
        console.warn('Expenses query failed, using local cache:', err);
      }
    }
    return this.applyLocalFilters(localExpensesMemory, filters);
  }

  private static applyLocalFilters(list: Expense[], filters?: { category?: string; search?: string; startDate?: string; endDate?: string }): Expense[] {
    let res = [...list];
    if (filters?.category && filters.category !== 'ALL') {
      res = res.filter((e) => e.expenseCategory === filters.category);
    }
    if (filters?.startDate) {
      res = res.filter((e) => e.expenseDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      res = res.filter((e) => e.expenseDate <= filters.endDate!);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      res = res.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.expenseCategory.toLowerCase().includes(q) ||
        e.paidTo?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      );
    }
    return res;
  }

  static async createExpense(input: CreateExpenseInput): Promise<Expense> {
    if (input.amount <= 0) throw new Error('Expense amount must be greater than zero');

    const newId = `exp-${Date.now()}`;
    const newExp: Expense = {
      id: newId,
      expenseCategory: input.expenseCategory,
      title: input.title.trim(),
      amount: input.amount,
      expenseDate: input.expenseDate,
      paidTo: input.paidTo?.trim(),
      receiptImage: input.receiptImage,
      notes: input.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && navigator.onLine) {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          expense_category: newExp.expenseCategory,
          title: newExp.title,
          amount: newExp.amount,
          expense_date: newExp.expenseDate,
          paid_to: newExp.paidTo,
          receipt_image: newExp.receiptImage,
          notes: newExp.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('[Supabase Error] createExpense failed:', error.message, error);
        throw new Error(`Supabase Error (${error.code || '400'}): ${error.message}`);
      }

      if (data) {
        newExp.id = data.id;
        try {
          await supabase.from('audit_logs').insert({
            action: 'CREATE_EXPENSE',
            entity: 'Expense',
            entity_id: data.id,
            new_value: { title: newExp.title, amount: newExp.amount, category: newExp.expenseCategory },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('expenses', 'INSERT', newExp as unknown as Record<string, unknown>);
    }

    localExpensesMemory.unshift(newExp);
    await LocalStorageManager.cacheItems('expenses', localExpensesMemory);
    return newExp;
  }

  static async getExpenseSummary(): Promise<{ totalExpenses: number; categoryBreakdown: Record<string, number> }> {
    const list = await this.getExpenses();
    let total = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const exp of list) {
      total += exp.amount;
      categoryBreakdown[exp.expenseCategory] = (categoryBreakdown[exp.expenseCategory] || 0) + exp.amount;
    }

    return {
      totalExpenses: total,
      categoryBreakdown,
    };
  }
}

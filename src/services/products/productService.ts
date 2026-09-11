import { supabase, isSupabaseConfigured } from '../supabase/client';
import { LocalStorageManager } from '../storage/localDb';
import {
  Product,
  Set as GarmentSet,
  Size,
  ProductSet,
  CreateProductInput,
  CreateSetInput,
  CreateSizeInput,
} from '../../types';

export const DEFAULT_FACTORY_SIZES: Size[] = [
  { id: 'sz-24', name: '24', code: 'SZ-24', sortOrder: 1, status: 'ACTIVE' },
  { id: 'sz-26', name: '26', code: 'SZ-26', sortOrder: 2, status: 'ACTIVE' },
  { id: 'sz-28', name: '28', code: 'SZ-28', sortOrder: 3, status: 'ACTIVE' },
  { id: 'sz-30', name: '30', code: 'SZ-30', sortOrder: 4, status: 'ACTIVE' },
  { id: 'sz-32', name: '32', code: 'SZ-32', sortOrder: 5, status: 'ACTIVE' },
  { id: 'sz-34', name: '34', code: 'SZ-34', sortOrder: 6, status: 'ACTIVE' },
  { id: 'sz-36', name: '36', code: 'SZ-36', sortOrder: 7, status: 'ACTIVE' },
  { id: 'sz-38', name: '38', code: 'SZ-38', chestMeasure: 38, waistMeasure: 32, lengthMeasure: 28, sortOrder: 8, status: 'ACTIVE' },
  { id: 'sz-40', name: '40', code: 'SZ-40', chestMeasure: 40, waistMeasure: 34, lengthMeasure: 29, sortOrder: 9, status: 'ACTIVE' },
  { id: 'sz-42', name: '42', code: 'SZ-42', chestMeasure: 42, waistMeasure: 36, lengthMeasure: 30, sortOrder: 10, status: 'ACTIVE' },
  { id: 'sz-44', name: '44', code: 'SZ-44', chestMeasure: 44, waistMeasure: 38, lengthMeasure: 30.5, sortOrder: 11, status: 'ACTIVE' },
  { id: 'sz-46', name: '46', code: 'SZ-46', chestMeasure: 46, waistMeasure: 40, lengthMeasure: 31, sortOrder: 12, status: 'ACTIVE' },
  { id: 'sz-48', name: '48', code: 'SZ-48', chestMeasure: 48, waistMeasure: 42, lengthMeasure: 31.5, sortOrder: 13, status: 'ACTIVE' },
  { id: 'sz-50', name: '50', code: 'SZ-50', chestMeasure: 50, waistMeasure: 44, lengthMeasure: 32, sortOrder: 14, status: 'ACTIVE' },
  { id: 'sz-52', name: '52', code: 'SZ-52', chestMeasure: 52, waistMeasure: 46, lengthMeasure: 32.5, sortOrder: 15, status: 'ACTIVE' },
  { id: 'sz-s', name: 'S', code: 'SZ-S', chestMeasure: 38, sortOrder: 16, status: 'ACTIVE' },
  { id: 'sz-m', name: 'M', code: 'SZ-M', chestMeasure: 40, sortOrder: 17, status: 'ACTIVE' },
  { id: 'sz-l', name: 'L', code: 'SZ-L', chestMeasure: 42, sortOrder: 18, status: 'ACTIVE' },
  { id: 'sz-xl', name: 'XL', code: 'SZ-XL', chestMeasure: 44, sortOrder: 19, status: 'ACTIVE' },
  { id: 'sz-xxl', name: 'XXL', code: 'SZ-XXL', chestMeasure: 46, sortOrder: 20, status: 'ACTIVE' },
  { id: 'sz-3xl', name: '3XL', code: 'SZ-3XL', chestMeasure: 48, sortOrder: 21, status: 'ACTIVE' },
  { id: 'sz-fs', name: 'Free Size', code: 'SZ-FS', sortOrder: 22, status: 'ACTIVE' },
];

export const DEFAULT_FACTORY_COLORS = [
  { id: 'col-navy', name: 'Navy Blue', hex: '#1e3a8a', sku: 'NAV' },
  { id: 'col-black', name: 'Jet Black', hex: '#0f172a', sku: 'BLK' },
  { id: 'col-white', name: 'Pure White', hex: '#f8fafc', sku: 'WHT' },
  { id: 'col-offwhite', name: 'Off White / Cream', hex: '#fef08a', sku: 'OFW' },
  { id: 'col-maroon', name: 'Maroon / Wine', hex: '#881337', sku: 'MAR' },
  { id: 'col-olive', name: 'Olive Green', hex: '#3f6212', sku: 'OLV' },
  { id: 'col-sage', name: 'Sage Green', hex: '#84cc16', sku: 'SGE' },
  { id: 'col-charcoal', name: 'Charcoal Grey', hex: '#334155', sku: 'CHR' },
  { id: 'col-royal', name: 'Royal Blue', hex: '#2563eb', sku: 'RYL' },
  { id: 'col-sky', name: 'Sky Blue', hex: '#38bdf8', sku: 'SKY' },
  { id: 'col-beige', name: 'Beige / Khaki', hex: '#d97706', sku: 'BGE' },
  { id: 'col-rust', name: 'Rust Orange', hex: '#ea580c', sku: 'RST' },
  { id: 'col-mustard', name: 'Mustard Yellow', hex: '#ca8a04', sku: 'MST' },
  { id: 'col-dustypink', name: 'Dusty Pink', hex: '#f472b6', sku: 'PNK' },
  { id: 'col-lavender', name: 'Lavender / Lilac', hex: '#c084fc', sku: 'LAV' },
  { id: 'col-teal', name: 'Teal Blue', hex: '#0d9488', sku: 'TEL' },
];

// In-Memory Fallback & Offline Cache
let localSizesMemory: Size[] = [...DEFAULT_FACTORY_SIZES];
let localSetsMemory: GarmentSet[] = [];
let localProductsMemory: Product[] = [];

export class ProductService {
  // ==========================================
  // 1. PRODUCT MASTER METHODS
  // ==========================================

  // Calculate gross margin and margin percentage
  static calculateMargins(costPrice: number, sellingPrice: number) {
    const grossMargin = Math.max(0, sellingPrice - costPrice);
    const marginPercent = sellingPrice > 0 ? ((grossMargin / sellingPrice) * 100) : 0;
    return {
      grossMargin: Number(grossMargin.toFixed(2)),
      marginPercent: Number(marginPercent.toFixed(1)),
    };
  }

  // Get all Products with filters
  static async getProducts(filters?: { category?: string; status?: string; search?: string }): Promise<Product[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('products')
          .select(`
            *,
            product_sets(
              id,
              product_id,
              set_id,
              sets(
                id,
                name,
                code,
                type,
                description,
                status,
                sort_order,
                set_sizes(
                  id,
                  sequence,
                  ratio,
                  sizes(*)
                )
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (filters?.category && filters.category !== 'ALL') {
          query = query.eq('category', filters.category);
        }
        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) {
          console.error('[Supabase Error] getProducts failed:', error.message, error);
          if (!navigator.onLine) {
            return this.applyLocalFilters(localProductsMemory, filters);
          }
          throw new Error(`Failed to load products from Supabase: ${error.message}`);
        }

        if (data) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            category: p.category,
            subcategory: p.subcategory,
            fabric: p.fabric,
            pattern: p.pattern,
            description: p.description,
            unit: p.unit || 'pcs',
            costPrice: Number(p.cost_price || 0),
            sellingPrice: Number(p.selling_price || 0),
            retailPrice: p.retail_price ? Number(p.retail_price) : undefined,
            taxRate: p.tax_rate ? Number(p.tax_rate) : 5,
            status: p.status || 'ACTIVE',
            imageUrl: p.image_url || (p.images && p.images[0]) || undefined,
            images: p.images || (p.image_url ? [p.image_url] : []),
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            variants: p.variants && Array.isArray(p.variants) && p.variants.length > 0
              ? p.variants
              : DEFAULT_FACTORY_COLORS.slice(0, 6).map((c) => ({
                  id: `${p.id}-${c.id}`,
                  productId: p.id,
                  sku: `${p.code}-${c.sku}`,
                  color: c.name,
                  colorCode: c.hex,
                  status: 'ACTIVE' as const,
                })),
            productSets: p.product_sets?.map((ps: any) => ({
              id: ps.id,
              productId: ps.product_id,
              setId: ps.set_id,
              isDefault: false,
              set: ps.sets ? {
                id: ps.sets.id,
                name: ps.sets.name,
                code: ps.sets.code,
                type: ps.sets.type,
                description: ps.sets.description,
                status: ps.sets.status,
                sortOrder: ps.sets.sort_order,
                setSizes: ps.sets.set_sizes?.map((ss: any) => ({
                  id: ss.id,
                  setId: ss.set_id || ps.sets.id,
                  sizeId: ss.size_id || ss.sizes?.id,
                  sequence: ss.sequence || 0,
                  ratio: ss.ratio || 1,
                  size: ss.sizes,
                })),
              } : undefined,
            })),
          }));

          localProductsMemory = mapped;
          LocalStorageManager.cacheItems('products', mapped);
          return this.applyLocalFilters(mapped, filters);
        }
      } catch (err: any) {
        console.error('Supabase product query exception:', err);
        if (navigator.onLine && err?.message?.includes('Supabase')) {
          throw err;
        }
      }
    }

    return this.applyLocalFilters(localProductsMemory, filters);
  }

  private static applyLocalFilters(list: Product[], filters?: { category?: string; status?: string; search?: string }): Product[] {
    let result = [...list];
    if (filters?.category && filters.category !== 'ALL') {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q)
      );
    }
    return result;
  }

  // Create a new Product
  static async createProduct(input: CreateProductInput): Promise<Product> {
    const existing = localProductsMemory.find((p) => p.code.toLowerCase() === input.code.toLowerCase());
    if (existing) {
      throw new Error(`A product with code "${input.code}" already exists.`);
    }

    const newId = `prd-${Date.now()}`;
    const now = new Date().toISOString();

    const assignedSets = (input.setIds || []).map((setId, idx) => {
      const setObj = localSetsMemory.find((s) => s.id === setId);
      return {
        id: `ps-${Date.now()}-${idx}`,
        productId: newId,
        setId,
        isDefault: idx === 0,
        set: setObj,
      };
    });

    const productVariants = (input.variants && input.variants.length > 0)
      ? input.variants.map((v, i) => ({
          id: v.id || `var-${newId}-${i}`,
          productId: newId,
          sku: v.sku || `${input.code.trim().toUpperCase()}-${(v.color.slice(0, 3)).toUpperCase()}`,
          color: v.color,
          colorCode: v.colorCode,
          status: 'ACTIVE' as const,
        }))
      : DEFAULT_FACTORY_COLORS.slice(0, 6).map((c) => ({
          id: `var-${newId}-${c.id}`,
          productId: newId,
          sku: `${input.code.trim().toUpperCase()}-${c.sku}`,
          color: c.name,
          colorCode: c.hex,
          status: 'ACTIVE' as const,
        }));

    const newProduct: Product = {
      id: newId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      category: input.category.trim(),
      subcategory: input.subcategory?.trim(),
      fabric: input.fabric.trim(),
      pattern: input.pattern?.trim(),
      description: input.description?.trim(),
      unit: input.unit || 'pcs',
      costPrice: Math.max(0, input.costPrice),
      sellingPrice: Math.max(0, input.sellingPrice),
      retailPrice: input.retailPrice ? Math.max(0, input.retailPrice) : undefined,
      taxRate: input.taxRate || 5,
      status: input.status || 'ACTIVE',
      imageUrl: input.imageUrl,
      images: input.imageUrl ? [input.imageUrl] : [],
      variants: productVariants,
      productSets: assignedSets,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data: dbProduct, error: prodErr } = await supabase
          .from('products')
          .insert({
            code: newProduct.code,
            name: newProduct.name,
            category: newProduct.category,
            subcategory: newProduct.subcategory,
            fabric: newProduct.fabric,
            pattern: newProduct.pattern,
            description: newProduct.description,
            unit: newProduct.unit,
            cost_price: newProduct.costPrice,
            selling_price: newProduct.sellingPrice,
            status: newProduct.status,
            images: newProduct.images && newProduct.images.length > 0 ? newProduct.images : (newProduct.imageUrl ? [newProduct.imageUrl] : []),
          })
          .select()
          .single();

        if (prodErr) throw prodErr;
        if (dbProduct) {
          newProduct.id = dbProduct.id;

          // Assign sets
          if (input.setIds && input.setIds.length > 0) {
            const productSetInserts = input.setIds.map((setId) => ({
              product_id: dbProduct.id,
              set_id: setId,
            }));
            const { error: setsErr } = await supabase.from('product_sets').insert(productSetInserts);
            if (setsErr) {
              console.error('[Supabase Error] product_sets insert failed:', setsErr.message, setsErr);
            }
          }

          // Audit Log
          try {
            await supabase.from('audit_logs').insert({
              action: 'CREATE_PRODUCT',
              entity: 'Product',
              entity_id: dbProduct.id,
              new_value: {
                code: newProduct.code,
                name: newProduct.name,
                category: newProduct.category,
                costPrice: newProduct.costPrice,
                sellingPrice: newProduct.sellingPrice,
              },
            });
          } catch (auditErr) {
            console.warn('Audit log write error:', auditErr);
          }
        }
      } catch (err: any) {
        console.error('[Supabase Error] createProduct failed:', err?.message, err);
        throw new Error(`Failed to save product to Supabase: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('products', 'INSERT', newProduct as unknown as Record<string, unknown>);
    }

    localProductsMemory.unshift(newProduct);
    await LocalStorageManager.cacheItems('products', localProductsMemory);
    return newProduct;
  }

  // Update existing Product
  static async updateProduct(id: string, input: Partial<CreateProductInput>): Promise<Product> {
    const product = localProductsMemory.find((p) => p.id === id);
    if (!product) throw new Error('Product not found.');

    if (input.code && input.code !== product.code) {
      const codeDuplicate = localProductsMemory.find((p) => p.id !== id && p.code.toLowerCase() === input.code!.toLowerCase());
      if (codeDuplicate) throw new Error(`Product code "${input.code}" is already in use.`);
      product.code = input.code.trim().toUpperCase();
    }

    if (input.name !== undefined) product.name = input.name.trim();
    if (input.category !== undefined) product.category = input.category.trim();
    if (input.subcategory !== undefined) product.subcategory = input.subcategory.trim();
    if (input.fabric !== undefined) product.fabric = input.fabric.trim();
    if (input.pattern !== undefined) product.pattern = input.pattern.trim();
    if (input.description !== undefined) product.description = input.description.trim();
    if (input.unit !== undefined) product.unit = input.unit;
    if (input.costPrice !== undefined) product.costPrice = Math.max(0, input.costPrice);
    if (input.sellingPrice !== undefined) product.sellingPrice = Math.max(0, input.sellingPrice);
    if (input.retailPrice !== undefined) product.retailPrice = Math.max(0, input.retailPrice);
    if (input.status !== undefined) product.status = input.status;
    if (input.imageUrl !== undefined) {
      product.imageUrl = input.imageUrl;
      product.images = input.imageUrl ? [input.imageUrl] : [];
    }

    if (input.variants !== undefined) {
      product.variants = input.variants.map((v, idx) => ({
        id: v.id || `var-${id}-${idx}`,
        productId: id,
        sku: v.sku || `${product.code}-${(v.color.slice(0, 3)).toUpperCase()}`,
        color: v.color,
        colorCode: v.colorCode,
        status: 'ACTIVE' as const,
      }));
    }

    if (input.setIds !== undefined) {
      product.productSets = input.setIds.map((setId, idx) => ({
        id: `ps-${id}-${setId}`,
        productId: id,
        setId,
        isDefault: idx === 0,
        set: localSetsMemory.find((s) => s.id === setId),
      }));
    }

    product.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase
          .from('products')
          .update({
            code: product.code,
            name: product.name,
            category: product.category,
            subcategory: product.subcategory,
            fabric: product.fabric,
            pattern: product.pattern,
            description: product.description,
            unit: product.unit,
            cost_price: product.costPrice,
            selling_price: product.sellingPrice,
            status: product.status,
            images: product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : []),
            updated_at: product.updatedAt,
          })
          .eq('id', id);

        if (input.setIds !== undefined) {
          await supabase.from('product_sets').delete().eq('product_id', id);
          if (input.setIds.length > 0) {
            const setInserts = input.setIds.map((setId) => ({
              product_id: id,
              set_id: setId,
            }));
            const { error: setsErr } = await supabase.from('product_sets').insert(setInserts);
            if (setsErr) {
              console.error('[Supabase Error] product_sets update failed:', setsErr.message, setsErr);
            }
          }
        }

        // Audit Log
        try {
          await supabase.from('audit_logs').insert({
            action: 'UPDATE_PRODUCT',
            entity: 'Product',
            entity_id: id,
            new_value: { code: product.code, name: product.name, status: product.status },
          });
        } catch (auditErr) {
          console.warn('Audit log write error:', auditErr);
        }
      } catch (err: any) {
        console.error('[Supabase Error] updateProduct failed:', err?.message, err);
        throw new Error(`Failed to update product in Supabase: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('products', 'UPDATE', product as unknown as Record<string, unknown>);
    }

    await LocalStorageManager.cacheItems('products', localProductsMemory);
    return product;
  }

  // Delete/Deactivate Product
  static async deleteProduct(id: string): Promise<void> {
    const index = localProductsMemory.findIndex((p) => p.id === id);
    if (index !== -1) {
      const deleted = localProductsMemory.splice(index, 1)[0];
      await LocalStorageManager.cacheItems('products', localProductsMemory);

      if (isSupabaseConfigured && navigator.onLine) {
        try {
          await supabase.from('product_sets').delete().eq('product_id', id);
          await supabase.from('products').delete().eq('id', id);
          await supabase.from('audit_logs').insert({
            action: 'DELETE_PRODUCT',
            entity: 'Product',
            entity_id: id,
            old_value: { name: deleted.name, code: deleted.code },
          });
        } catch (err) {
          console.warn('Supabase product delete failed, queuing offline:', err);
          await LocalStorageManager.enqueueOfflineMutation('products', 'DELETE', { id });
        }
      } else {
        await LocalStorageManager.enqueueOfflineMutation('products', 'DELETE', { id });
      }
    }
  }

  // Upload Product Image to Supabase Storage
  static async uploadProductImage(file: File): Promise<string> {
    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const filePath = `catalog/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          return publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn('Storage upload error, using local base64 preview:', err);
      }
    }

    // Fallback: convert to base64 Data URL for instant display & offline persistence
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ==========================================
  // 2. SETS MASTER METHODS
  // ==========================================

  // Get all Sets with nested ordered sizes
  static async getSetsWithSizes(): Promise<GarmentSet[]> {
    await this.getSizes(); // ensure sizes are loaded

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('sets')
          .select('*, set_sizes(*, sizes(*))')
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: GarmentSet[] = data.map((s: any) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            type: s.type || 'ADULT',
            description: s.description,
            status: s.status || 'ACTIVE',
            sortOrder: s.sort_order || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            setSizes: s.set_sizes
              ?.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0))
              ?.map((ss: any) => {
                const foundSize = ss.sizes || localSizesMemory.find((sz) => sz.id === ss.size_id || sz.name === ss.size_id);
                return {
                  id: ss.id,
                  setId: ss.set_id,
                  sizeId: ss.size_id,
                  sequence: ss.sequence || 1,
                  ratio: ss.ratio || 1,
                  size: {
                    id: foundSize?.id || ss.size_id,
                    name: foundSize?.name || ss.size_id,
                    code: foundSize?.code || `SZ-${ss.size_id}`,
                    chestMeasure: foundSize?.chest_measure ? Number(foundSize.chest_measure) : foundSize?.chestMeasure,
                    waistMeasure: foundSize?.waist_measure ? Number(foundSize.waist_measure) : foundSize?.waistMeasure,
                    lengthMeasure: foundSize?.length_measure ? Number(foundSize.length_measure) : foundSize?.lengthMeasure,
                    status: foundSize?.status || 'ACTIVE',
                    sortOrder: foundSize?.sort_order || 0,
                  },
                };
              }) || [],
          }));

          localSetsMemory = mapped;
          LocalStorageManager.cacheItems('sets', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase sets query error, using local fallback:', err);
      }
    }
    return localSetsMemory;
  }

  // Create a new Set
  static async createSet(input: CreateSetInput): Promise<GarmentSet> {
    const existing = localSetsMemory.find((s) => s.name.toLowerCase() === input.name.toLowerCase());
    if (existing) {
      throw new Error(`A Set with name "${input.name}" already exists.`);
    }

    const newId = `set-${Date.now()}`;
    const newSet: GarmentSet = {
      id: newId,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      type: input.type || 'ADULT',
      description: input.description?.trim(),
      status: input.status || 'ACTIVE',
      sortOrder: input.sortOrder || localSetsMemory.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      setSizes: (input.sizeIds || []).map((sizeId, idx) => {
        const sizeObj = localSizesMemory.find((sz) => sz.id === sizeId);
        return {
          id: `ss-${Date.now()}-${idx}`,
          setId: newId,
          sizeId,
          sequence: idx + 1,
          ratio: 1,
          size: sizeObj || { id: sizeId, name: sizeId, status: 'ACTIVE' },
        };
      }),
    };

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data: dbSet, error: setErr } = await supabase
          .from('sets')
          .insert({
            name: newSet.name,
            code: newSet.code,
            type: newSet.type,
            description: newSet.description,
            status: newSet.status,
            sort_order: newSet.sortOrder,
          })
          .select()
          .single();

        if (setErr) throw setErr;
        if (dbSet) {
          newSet.id = dbSet.id;
          if (input.sizeIds && input.sizeIds.length > 0) {
            const setSizeInserts = input.sizeIds.map((sizeId, idx) => ({
              set_id: dbSet.id,
              size_id: sizeId,
              sequence: idx + 1,
              ratio: 1,
            }));
            await supabase.from('set_sizes').insert(setSizeInserts);
          }

          // Audit Log
          await supabase.from('audit_logs').insert({
            action: 'CREATE_SET',
            entity: 'Set',
            entity_id: dbSet.id,
            new_value: { name: newSet.name, code: newSet.code },
          });
        }
      } catch (err) {
        console.warn('Supabase set insert error, queuing locally:', err);
        await LocalStorageManager.enqueueOfflineMutation('sets', 'INSERT', newSet as unknown as Record<string, unknown>);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('sets', 'INSERT', newSet as unknown as Record<string, unknown>);
    }

    localSetsMemory.push(newSet);
    await LocalStorageManager.cacheItems('sets', localSetsMemory);
    return newSet;
  }

  // Update Set & Assigned Sizes
  static async updateSet(id: string, input: Partial<CreateSetInput>): Promise<GarmentSet> {
    const set = localSetsMemory.find((s) => s.id === id);
    if (!set) throw new Error('Set not found.');

    if (input.name !== undefined) set.name = input.name.trim();
    if (input.code !== undefined) set.code = input.code.trim().toUpperCase();
    if (input.type !== undefined) set.type = input.type;
    if (input.description !== undefined) set.description = input.description.trim();
    if (input.status !== undefined) set.status = input.status;
    if (input.sortOrder !== undefined) set.sortOrder = input.sortOrder;

    if (input.sizeIds !== undefined) {
      set.setSizes = input.sizeIds.map((sizeId, idx) => {
        const sizeObj = localSizesMemory.find((sz) => sz.id === sizeId);
        return {
          id: `ss-${id}-${sizeId}`,
          setId: id,
          sizeId,
          sequence: idx + 1,
          ratio: 1,
          size: sizeObj || { id: sizeId, name: sizeId, status: 'ACTIVE' },
        };
      });
    }

    set.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase
          .from('sets')
          .update({
            name: set.name,
            code: set.code,
            type: set.type,
            description: set.description,
            status: set.status,
            sort_order: set.sortOrder,
            updated_at: set.updatedAt,
          })
          .eq('id', id);

        if (input.sizeIds !== undefined) {
          await supabase.from('set_sizes').delete().eq('set_id', id);
          if (input.sizeIds.length > 0) {
            const setSizeInserts = input.sizeIds.map((sizeId, idx) => ({
              set_id: id,
              size_id: sizeId,
              sequence: idx + 1,
              ratio: 1,
            }));
            await supabase.from('set_sizes').insert(setSizeInserts);
          }
        }

        // Audit Log
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_SET',
          entity: 'Set',
          entity_id: id,
          new_value: { name: set.name, code: set.code, sizeCount: input.sizeIds?.length },
        });
      } catch (err) {
        console.warn('Supabase set update error, queuing locally:', err);
        await LocalStorageManager.enqueueOfflineMutation('sets', 'UPDATE', set as unknown as Record<string, unknown>);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('sets', 'UPDATE', set as unknown as Record<string, unknown>);
    }

    await LocalStorageManager.cacheItems('sets', localSetsMemory);
    return set;
  }

  // ==========================================
  // 3. SIZES MASTER METHODS
  // ==========================================

  // Get all configured Sizes (with Auto-Seeding)
  static async getSizes(): Promise<Size[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('sizes')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: Size[] = data.map((sz: any) => ({
            id: sz.id,
            name: sz.name,
            code: sz.code,
            chestMeasure: sz.chest_measure ? Number(sz.chest_measure) : undefined,
            waistMeasure: sz.waist_measure ? Number(sz.waist_measure) : undefined,
            lengthMeasure: sz.length_measure ? Number(sz.length_measure) : undefined,
            status: sz.status || 'ACTIVE',
            sortOrder: 0,
            createdAt: sz.created_at,
            updatedAt: sz.updated_at,
          }));

          localSizesMemory = mapped;
          LocalStorageManager.cacheItems('sizes', mapped);
          return mapped;
        }

        // If Supabase table is empty, auto-seed standard sizes into Supabase
        if (!error && (!data || data.length === 0)) {
          try {
            const inserts = DEFAULT_FACTORY_SIZES.map((s) => ({
              name: s.name,
              code: s.code,
              chest_measure: s.chestMeasure || null,
              waist_measure: s.waistMeasure || null,
              length_measure: s.lengthMeasure || null,
              status: s.status || 'ACTIVE',
            }));
            await supabase.from('sizes').insert(inserts);
          } catch (seedErr) {
            console.warn('Auto-seed sizes warning:', seedErr);
          }
        }
      } catch (err) {
        console.warn('Supabase sizes query error, using local fallback:', err);
      }
    }

    if (localSizesMemory.length === 0) {
      localSizesMemory = [...DEFAULT_FACTORY_SIZES];
      LocalStorageManager.cacheItems('sizes', localSizesMemory);
    }
    return localSizesMemory;
  }

  // Create a new Size
  static async createSize(input: CreateSizeInput): Promise<Size> {
    const existing = localSizesMemory.find((sz) => sz.name.toLowerCase() === input.name.toLowerCase());
    if (existing) {
      throw new Error(`Size "${input.name}" already exists.`);
    }

    const newId = `sz-${Date.now()}`;
    const newSize: Size = {
      id: newId,
      name: input.name.trim(),
      code: input.code?.trim().toUpperCase() || `SZ-${input.name.trim().toUpperCase()}`,
      chestMeasure: input.chestMeasure,
      waistMeasure: input.waistMeasure,
      lengthMeasure: input.lengthMeasure,
      status: input.status || 'ACTIVE',
      sortOrder: input.sortOrder || localSizesMemory.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        const { data: dbSize, error: sizeErr } = await supabase
          .from('sizes')
          .insert({
            name: newSize.name,
            code: newSize.code,
            chest_measure: newSize.chestMeasure,
            waist_measure: newSize.waistMeasure,
            length_measure: newSize.lengthMeasure,
            status: newSize.status,
          })
          .select()
          .single();

        if (sizeErr) throw sizeErr;
        if (dbSize) {
          newSize.id = dbSize.id;
          // Audit Log
          await supabase.from('audit_logs').insert({
            action: 'CREATE_SIZE',
            entity: 'Size',
            entity_id: dbSize.id,
            new_value: { name: newSize.name, code: newSize.code },
          });
        }
      } catch (err) {
        console.warn('Supabase size insert error, queuing locally:', err);
        await LocalStorageManager.enqueueOfflineMutation('sizes', 'INSERT', newSize as unknown as Record<string, unknown>);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('sizes', 'INSERT', newSize as unknown as Record<string, unknown>);
    }

    localSizesMemory.push(newSize);
    await LocalStorageManager.cacheItems('sizes', localSizesMemory);
    return newSize;
  }

  // Update Size
  static async updateSize(id: string, input: Partial<CreateSizeInput>): Promise<Size> {
    const size = localSizesMemory.find((sz) => sz.id === id);
    if (!size) throw new Error('Size not found.');

    if (input.name !== undefined) size.name = input.name.trim();
    if (input.code !== undefined) size.code = input.code.trim().toUpperCase();
    if (input.chestMeasure !== undefined) size.chestMeasure = input.chestMeasure;
    if (input.waistMeasure !== undefined) size.waistMeasure = input.waistMeasure;
    if (input.lengthMeasure !== undefined) size.lengthMeasure = input.lengthMeasure;
    if (input.status !== undefined) size.status = input.status;
    if (input.sortOrder !== undefined) size.sortOrder = input.sortOrder;

    size.updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase
          .from('sizes')
          .update({
            name: size.name,
            code: size.code,
            chest_measure: size.chestMeasure,
            waist_measure: size.waistMeasure,
            length_measure: size.lengthMeasure,
            status: size.status,
            updated_at: size.updatedAt,
          })
          .eq('id', id);

        // Audit Log
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_SIZE',
          entity: 'Size',
          entity_id: id,
          new_value: { name: size.name, status: size.status },
        });
      } catch (err) {
        console.warn('Supabase size update error, queuing locally:', err);
        await LocalStorageManager.enqueueOfflineMutation('sizes', 'UPDATE', size as unknown as Record<string, unknown>);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('sizes', 'UPDATE', size as unknown as Record<string, unknown>);
    }

    await LocalStorageManager.cacheItems('sizes', localSizesMemory);
    return size;
  }

  // Delete Set
  static async deleteSet(id: string): Promise<void> {
    localSetsMemory = localSetsMemory.filter((s) => s.id !== id);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('set_sizes').delete().eq('set_id', id);
        await supabase.from('product_sets').delete().eq('set_id', id);
        const { error } = await supabase.from('sets').delete().eq('id', id);
        if (error) throw error;
        await supabase.from('audit_logs').insert({
          action: 'DELETE_SET',
          entity: 'Set',
          entity_id: id,
        });
      } catch (err: any) {
        console.error('Supabase deleteSet error:', err);
        throw new Error(`Failed to delete Set: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('sets', 'DELETE', { id });
    }

    await LocalStorageManager.cacheItems('sets', localSetsMemory);
  }

  // Delete Size
  static async deleteSize(id: string): Promise<void> {
    localSizesMemory = localSizesMemory.filter((sz) => sz.id !== id);

    if (isSupabaseConfigured && navigator.onLine) {
      try {
        await supabase.from('set_sizes').delete().eq('size_id', id);
        const { error } = await supabase.from('sizes').delete().eq('id', id);
        if (error) throw error;
        await supabase.from('audit_logs').insert({
          action: 'DELETE_SIZE',
          entity: 'Size',
          entity_id: id,
        });
      } catch (err: any) {
        console.error('Supabase deleteSize error:', err);
        throw new Error(`Failed to delete Size: ${err?.message || 'Unknown error'}`);
      }
    } else {
      await LocalStorageManager.enqueueOfflineMutation('sizes', 'DELETE', { id });
    }

    await LocalStorageManager.cacheItems('sizes', localSizesMemory);
  }
}

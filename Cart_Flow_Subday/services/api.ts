
import { supabase } from '../lib/supabase';
import { SubItem, OptionCategory, Banner, Coupon } from '../types';

export const api = {
    // --- MENU & PRODUCTS ---

    async getProducts(onlyActive = true) {
        let query = supabase.from('products').select('*');
        if (onlyActive) query = query.eq('active', true);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getMenuItems(category?: string) {
        let query = supabase
            .from('menu_items')
            .select('*')
            .order('display_order', { ascending: true });

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map DB fields to Frontend types
        return data.map((item: any) => ({
            ...item,
            image: item.image_url // Map image_url to image
        }));
    },

    // Validate stock status for multiple items - returns unavailable items
    async validateStockStatus(itemIds: string[]) {
        if (!itemIds.length) return [];

        const { data, error } = await supabase
            .from('menu_items')
            .select('id, name, stock_status, image_url')
            .in('id', itemIds);

        if (error) throw error;

        // Return items that are OUT of stock (stock_status = false)
        return (data || []).filter(item => !item.stock_status).map(item => ({
            id: item.id,
            name: item.name,
            image: item.image_url
        }));
    },

    // Validate if product type (SANDWICH, PIZZA, SALAD) is still active
    async validateProductType(productType: string) {
        // Map product type to expected name patterns
        const typeNames: { [key: string]: string } = {
            'SANDWICH': 'Sandwich',
            'SALAD': 'Ensalada',
            'PIZZA': 'Pizza'
        };

        const productName = typeNames[productType];
        if (!productName) return null; // Unknown type, allow

        const { data, error } = await supabase
            .from('main_products')
            .select('id, name, active, image_url')
            .ilike('name', `%${productName}%`)
            .single();

        if (error || !data) return null; // If not found, allow

        // Return product info if NOT active
        if (!data.active) {
            return {
                id: data.id,
                name: data.name,
                image: data.image_url
            };
        }

        return null; // Product is active
    },

    async getPricingRules() {
        const { data, error } = await supabase
            .from('pricing_rules')
            .select('*');
        if (error) throw error;
        return data;
    },

    async updateMenuItem(id: string, updates: any) {
        const dbUpdates: any = { ...updates };
        if (updates.image) {
            dbUpdates.image_url = updates.image;
            delete dbUpdates.image;
        }

        const { data, error } = await supabase
            .from('menu_items')
            .update(dbUpdates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    async createMenuItem(item: any) {
        const dbItem: any = { ...item };
        // Generate UUID for new item (browser-compatible)
        dbItem.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        // Map frontend 'image' to DB 'image_url' if present
        if (item.image) {
            dbItem.image_url = item.image;
            delete dbItem.image;
        }
        // Ensure defaults
        if (!dbItem.price) dbItem.price = 0;
        if (dbItem.stock_status === undefined) dbItem.stock_status = true;
        if (!dbItem.display_order) dbItem.display_order = 0;

        const { data, error } = await supabase
            .from('menu_items')
            .insert(dbItem)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- MARKETING ---

    async getBanners(onlyActive = true) {
        let query = supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true });

        if (onlyActive) query = query.eq('active', true);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async updateBanner(id: string, updates: any) {
        const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select();
        if (error) throw error;
        return data;
    },

    async validateCoupon(code: string, orderAmount: number) {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code)
            .eq('active', true)
            .single();

        if (error || !data) return { valid: false, message: 'Invalid coupon' };

        // Check expiry
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return { valid: false, message: 'Coupon expired' };
        }

        // Check usage limit
        if (data.max_uses && data.uses_count >= data.max_uses) {
            return { valid: false, message: 'Coupon usage limit reached' };
        }

        // Check min order
        if (data.min_order_amount && orderAmount < data.min_order_amount) {
            return { valid: false, message: `Order must be at least $${data.min_order_amount}` };
        }

        return { valid: true, coupon: data };
    },

    async createCoupon(coupon: any) {
        const { data, error } = await supabase.from('coupons').insert(coupon).select();
        if (error) throw error;
        return data;
    },

    async getCoupons() {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('active', { ascending: false })

        if (error) throw error;
        return data;
    },

    // --- ORDERS ---

    async createOrder(orderData: any) {
        const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createOrderItems(items: any[]) {
        const { data, error } = await supabase
            .from('order_items')
            .insert(items)
            .select();
        if (error) throw error;
        return data;
    },

    // Atomic order creation: header + items in a single transaction
    // Uses SQL function to generate sequential DDMM-NNN short_id
    async createOrderAtomic(orderData: any, items: any[]) {
        const { data, error } = await supabase.rpc('create_order_with_items', {
            p_order: orderData,
            p_items: items
        });
        if (error) throw error;
        return data; // Returns JSONB with order info including generated short_id
    },

    async getOrders() {
        // Only fetch last 7 days to avoid loading entire history
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .gte('created_at', sevenDaysAgo)
            .order('created_at', { ascending: false })
            .limit(200);

        if (error) throw error;

        // Map DB items to match frontend types
        return data.map((order: any) => ({
            ...order,
            items: order.items.map((item: any) => ({
                ...item,
                price: parseFloat(item.unit_price || item.total_price || '0')
            }))
        }));
    },

    // Optimized: fetch only active orders (not COMPLETED/CANCELLED)
    async getActiveOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .in('status', ['PENDING', 'PENDING_PAYMENT', 'PREPARING', 'PROCESSING', 'READY', 'ON_WAY'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((order: any) => ({
            ...order,
            items: order.items.map((item: any) => ({
                ...item,
                price: parseFloat(item.unit_price || item.total_price || '0')
            }))
        }));
    },

    async getOrderById(id: string) {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Map DB items to match frontend types (reuse logic)
        return {
            ...data,
            items: data.items.map((item: any) => ({
                ...item,
                price: parseFloat(item.unit_price || item.total_price || '0')
            }))
        };
    },

    async updateOrderStatus(orderId: string, status: string) {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select();
        if (error) throw error;
        if (error) throw error;
        return data;
    },

    async updateOrderItemStatus(itemId: string, status: string) {
        const { data, error } = await supabase
            .from('order_items')
            .update({ status })
            .eq('id', itemId)
            .select();
        if (error) throw error;
        return data;
    },

    async uploadPaymentProof(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('payment_proofs')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('payment_proofs')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async uploadImage(file: File, folder: string = 'assets') {
        const fileExt = file.name.split('.').pop();
        // Clean filename to avoid issues
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Call the Edge Function "upload-to-r2" (as seen in screenshot)
        // Protocol: Raw Body + Headers (x-file-name, x-file-type)
        const { data, error } = await supabase.functions.invoke('upload-to-r2', {
            body: file, // Send raw file, not FormData
            headers: {
                'x-file-name': cleanName,
                'x-file-type': file.type,
                'x-folder': folder // We send this hoping the user updates the EF code to use it
            }
        });

        console.log("Edge Function Response:", { data, error });

        if (error) {
            console.error('Edge Function Error details:', error);
            throw error;
        }

        if (!data?.url) {
            console.error('Edge Function returned no URL:', data);
            throw new Error('No URL returned from upload function');
        }

        return data.url;
    },

    // --- CUSTOMERS ---

    async createOrUpdateCustomer(customerData: {
        firstName: string;
        lastName: string;
        cedula: string;
        countryCode: string;
        phone: string;
        email: string;
    }) {
        const fullPhone = `${customerData.countryCode}${customerData.phone}`;

        // Try to find existing customer by CEDULA (Primary Key logic)
        const { data: existing } = await supabase
            .from('clientes')
            .select('*')
            .eq('cedula', customerData.cedula)
            .maybeSingle();

        if (existing) {
            // Found by Cedula -> DO NOT UPDATE. Return existing.
            // "Si yo pongo la cedula pero pongo otro nombre no debe actualizar ningun dato, los datos son los que se ponen la primera vez y ya"
            return existing;
        } else {
            // Create new customer
            const { data, error } = await supabase
                .from('clientes')
                .insert({
                    first_name: customerData.firstName,
                    last_name: customerData.lastName,
                    cedula: customerData.cedula,
                    country_code: customerData.countryCode,
                    phone: customerData.phone, // Store local number only (no country code prefix)
                    email: customerData.email
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    async getCustomerByPhone(phone: string) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
    },

    // --- DRIVERS ---
    async getDrivers() {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .order('active', { ascending: false })
            .order('name');
        if (error) throw error;
        return data;
    },

    async createDriver(driver: any) {
        const { data, error } = await supabase
            .from('drivers')
            .insert(driver)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateDriver(id: string, updates: any) {
        const { error } = await supabase
            .from('drivers')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async assignDriver(orderId: string, driverId: string) {
        const { error } = await supabase
            .from('orders')
            .update({
                driver_id: driverId,
                status: 'ON_WAY',
                assigned_at: new Date().toISOString()
            })
            .eq('id', orderId);
        if (error) throw error;
    },

    async completeDelivery(orderId: string, driverId: string) {
        // Transaction-like update: Set Order Completed AND Increment Driver Stats
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'COMPLETED' })
            .eq('id', orderId);
        if (orderError) throw orderError;

        // Increment driver stats (simple read-update for now, ideal would be RPC)
        const { data: driver } = await supabase.from('drivers').select('completed_assignments').eq('id', driverId).single();
        if (driver) {
            await supabase
                .from('drivers')
                .update({ completed_assignments: (driver.completed_assignments || 0) + 1 })
                .eq('id', driverId);
        }
    },

    // --- WEEKLY CLOSINGS ---

    async getLastClosingDate(): Promise<Date | null> {
        const { data } = await supabase
            .from('weekly_closings')
            .select('period_end')
            .order('period_end', { ascending: false })
            .limit(1)
            .maybeSingle();

        return data?.period_end ? new Date(data.period_end) : null;
    },

    async getWeeklyClosings() {
        const { data, error } = await supabase
            .from('weekly_closings')
            .select('*')
            .order('closing_date', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getClosingDetails(closingId: string) {
        // Get closing with driver earnings
        const { data: closing, error: closingError } = await supabase
            .from('weekly_closings')
            .select('*')
            .eq('id', closingId)
            .single();
        if (closingError) throw closingError;

        const { data: earnings, error: earningsError } = await supabase
            .from('weekly_driver_earnings')
            .select('*')
            .eq('weekly_closing_id', closingId)
            .order('total_earnings', { ascending: false });
        if (earningsError) throw earningsError;

        return { ...closing, driver_earnings: earnings };
    },

    async createWeeklyClosing() {
        // 1. Get last closing date or use epoch
        const lastClosing = await this.getLastClosingDate();
        const periodStart = lastClosing || new Date('2020-01-01');
        const periodEnd = new Date();

        // 2. Get all COMPLETED orders since last closing
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount, delivery_fee, driver_id, status')
            .eq('status', 'COMPLETED')
            .gt('created_at', periodStart.toISOString())
            .lte('created_at', periodEnd.toISOString());

        if (ordersError) throw ordersError;

        // 3. Calculate totals
        const totalOrders = orders?.length || 0;
        let totalRevenue = 0;
        let totalDeliveryFees = 0;
        const driverStats: { [key: string]: { deliveries: number; earnings: number } } = {};

        orders?.forEach((order: any) => {
            const revenue = parseFloat(order.total_amount || 0);
            const deliveryFee = parseFloat(order.delivery_fee || 0);

            totalRevenue += revenue;
            totalDeliveryFees += deliveryFee;

            // Track driver earnings
            if (order.driver_id) {
                if (!driverStats[order.driver_id]) {
                    driverStats[order.driver_id] = { deliveries: 0, earnings: 0 };
                }
                driverStats[order.driver_id].deliveries += 1;
                driverStats[order.driver_id].earnings += deliveryFee;
            }
        });

        const subdayNetRevenue = totalRevenue - totalDeliveryFees;

        // 4. Create closing record
        const { data: closing, error: closingError } = await supabase
            .from('weekly_closings')
            .insert({
                period_start: periodStart.toISOString(),
                period_end: periodEnd.toISOString(),
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                total_delivery_fees: totalDeliveryFees,
                subday_net_revenue: subdayNetRevenue
            })
            .select()
            .single();

        if (closingError) throw closingError;

        // 5. Create driver earnings records
        const drivers = await this.getDrivers();
        const driverMap: { [key: string]: string } = {};
        drivers?.forEach((d: any) => { driverMap[d.id] = d.name; });

        const earningsRecords = Object.entries(driverStats).map(([driverId, stats]) => ({
            weekly_closing_id: closing.id,
            driver_id: driverId,
            driver_name: driverMap[driverId] || 'Desconocido',
            total_deliveries: stats.deliveries,
            total_earnings: stats.earnings
        }));

        if (earningsRecords.length > 0) {
            const { error: earningsError } = await supabase
                .from('weekly_driver_earnings')
                .insert(earningsRecords);
            if (earningsError) throw earningsError;
        }

        return { closing, earningsRecords };
    },

    // --- MAIN PRODUCTS (Menu Cards) ---

    async getMainProducts() {
        const { data, error } = await supabase
            .from('main_products')
            .select('*')
            .order('display_order', { ascending: true });
        if (error) throw error;
        return data;
    },

    async updateMainProduct(id: string, updates: { image_url?: string; active?: boolean }) {
        const { data, error } = await supabase
            .from('main_products')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async toggleMainProductActive(id: string, active: boolean) {
        return this.updateMainProduct(id, { active });
    },

    // --- AUTHENTICATION ---

    async login(username: string, password: string) {
        // Uses RPC function to bypass RLS (SECURITY DEFINER)
        const { data, error } = await supabase.rpc('staff_login', {
            p_username: username,
            p_password: password
        });
        if (error) throw error;
        return data;
    },

    async getStaffUser(id: string) {
        const { data } = await supabase
            .from('staff_users')
            .select('*')
            .eq('id', id)
            .single();
        return data;
    },

    // --- SETTINGS ---

    async getSettings(key: string) {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();
        if (error) return null;
        return data?.value;
    },

    async getAllSettings() {
        const { data, error } = await supabase
            .from('settings')
            .select('key, value');
        if (error) return {};
        return data.reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    },

    async updateSettings(key: string, value: any) {
        // Use RPC function to bypass RLS securely
        const { data, error } = await supabase.rpc('update_setting', {
            p_key: key,
            p_value: value
        });
        if (error) throw error;
        return data;
    }
};

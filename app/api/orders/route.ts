import { serverSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { buildWhatsAppUrl } from '@/lib/business';
import { bot, notifyAdmins } from '@/lib/bot';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    if (!isSupabaseConfigured) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { productId, variationId, productName, variationName, customerName, customerPhone, deliveryAddress, price } = body;

        // Validate required fields
        if (!productId || !customerName || !customerPhone || !deliveryAddress || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Phone validation (Nigerian format)
        const cleanPhone = customerPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 14) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        const { data, error } = await serverSupabase
            .from('orders')
            .insert({
                product_id: productId,
                variation_id: variationId || null,
                product_name: productName,
                variation_name: variationName || null,
                customer_name: customerName.trim(),
                customer_phone: cleanPhone,
                delivery_address: deliveryAddress.trim(),
                price_at_order: price,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Order insert error:', error);
            return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
        }

        // Build admin notification WhatsApp link
        const adminMessage = `🛒 NEW ORDER!\n\nProduct: ${productName}${variationName ? ` (${variationName})` : ''}\nPrice: ₦${price.toLocaleString()}\nCustomer: ${customerName}\nPhone: ${customerPhone}\nAddress: ${deliveryAddress}\n\nOrder ID: ${data.id}`;
        const adminWhatsAppUrl = buildWhatsAppUrl(adminMessage);

        // Send Telegram notification to all admins
        if (bot) {
            const telegramMsg =
                `🛒 <b>NEW ORDER</b>\n\n` +
                `📦 <b>${productName}</b>${variationName ? ` (${variationName})` : ''}\n` +
                `💰 ₦${price.toLocaleString()}\n` +
                `👤 ${customerName}\n` +
                `📞 ${customerPhone}\n` +
                `📍 ${deliveryAddress}\n\n` +
                `🆔 <code>${data.id}</code>`;
            notifyAdmins(bot, telegramMsg).catch(console.error);
        }

        return NextResponse.json({
            success: true,
            orderId: data.id,
            adminWhatsAppUrl,
        });
    } catch (err) {
        console.error('Order API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

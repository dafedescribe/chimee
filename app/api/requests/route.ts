import { serverSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { bot, notifyAdmins } from '@/lib/bot';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    if (!isSupabaseConfigured) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await req.json();
        const { productName, category, customerName, customerPhone, message } = body;

        if (!productName || !customerName) {
            return NextResponse.json({ error: 'Product name and your name are required' }, { status: 400 });
        }

        const { data, error } = await serverSupabase
            .from('requests')
            .insert({
                product_name: productName.trim(),
                category: category || null,
                customer_name: customerName.trim(),
                customer_phone: customerPhone?.replace(/\D/g, '') || null,
                message: message?.trim() || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Request insert error:', error);
            return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
        }

        // Notify admins via Telegram
        if (bot) {
            const telegramMsg =
                `📋 <b>NEW PRODUCT REQUEST</b>\n\n` +
                `📱 <b>${productName}</b>${category ? ` (${category})` : ''}\n` +
                `👤 ${customerName}\n` +
                `${customerPhone ? `📞 ${customerPhone}\n` : ''}` +
                `${message ? `💬 ${message}\n` : ''}\n` +
                `🆔 <code>${data.id}</code>`;
            notifyAdmins(bot, telegramMsg).catch(console.error);
        }

        return NextResponse.json({ success: true, requestId: data.id });
    } catch (err) {
        console.error('Request API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

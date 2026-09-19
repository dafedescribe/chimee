import type { MetadataRoute } from 'next';
import { publicSupabase, isSupabaseConfigured } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chimee.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
        { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
        { url: `${BASE_URL}/order`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
        { url: `${BASE_URL}/whatsapp`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    ];

    if (!isSupabaseConfigured) return staticPages;

    const { data: products } = await publicSupabase
        .from('products')
        .select('id, created_at')
        .order('created_at', { ascending: false });

    const productPages = (products || []).map((p) => ({
        url: `${BASE_URL}/product/${p.id}`,
        lastModified: new Date(p.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    return [...staticPages, ...productPages];
}

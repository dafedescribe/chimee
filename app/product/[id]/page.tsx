import { publicSupabase, isSupabaseConfigured } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { Product } from '@/types';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (!isSupabaseConfigured) return {};

  const { data: p } = await publicSupabase
    .from('products')
    .select('name, description, category, condition, image_url, price_numeric')
    .eq('id', id)
    .single();

  if (!p) return {};

  return {
    title: `${p.name} — ${p.condition}`,
    description: p.description,
    openGraph: {
      title: `${p.name} — ${p.condition} | Chimee Lagos`,
      description: p.description,
      images: [{ url: p.image_url, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${p.name} | Chimee Lagos`,
      description: `${p.condition} · ₦${p.price_numeric.toLocaleString()} · ${p.category}`,
      images: [p.image_url],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    // During build without env vars, return a placeholder or handle gracefully
    return <div className="p-20 text-center text-white">Database connection not configured.</div>;
  }

  const { data: p, error } = await publicSupabase
    .from('products')
    .select('*, product_variations(*), product_images(*)')
    .eq('id', id)
    .single();

  if (error || !p) {
    console.error('Error fetching product:', error);
    notFound();
  }

  // Build images array: product_images table + fallback to main image_url
  const additionalImages = (p.product_images || [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((img: any) => img.image_url);
  const allImages = additionalImages.length > 0 ? additionalImages : [p.image_url];

  const product: Product = {
    id: p.id,
    name: p.name,
    category: p.category as any,
    condition: p.condition,
    price: `₦${p.price_numeric.toLocaleString()}`,
    priceNumeric: p.price_numeric,
    specs: p.specs,
    image: p.image_url,
    images: allImages,
    description: p.description,
    isDeal: p.is_deal,
    createdAt: p.created_at,
    stockCount: p.stock_count,
    variations: (p.product_variations || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      priceNumeric: v.price_numeric,
      stockCount: v.stock_count
    }))
  };

  return <ProductDetailClient product={product} />;
}

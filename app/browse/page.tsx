import { publicSupabase, isSupabaseConfigured } from '@/lib/supabase';
import BrowseClient from './BrowseClient';
import { Product } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse All Units',
  description: 'Explore our full collection of premium pre-owned phones, laptops, and accessories. Filter by category, condition, and price.',
};

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  if (!isSupabaseConfigured) {
    return <BrowseClient initialProducts={[]} />;
  }

  const { data, error } = await publicSupabase
    .from('products')
    .select('*, product_variations(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
  }

  const products: Product[] = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category as any,
    condition: p.condition,
    price: `₦${p.price_numeric.toLocaleString()}`,
    priceNumeric: p.price_numeric,
    specs: p.specs,
    image: p.image_url,
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
  }));

  return <BrowseClient initialProducts={products} />;
}

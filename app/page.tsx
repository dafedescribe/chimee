import { publicSupabase, isSupabaseConfigured } from '@/lib/supabase';
import HomeClient from './HomeClient';
import { Product, Banner } from '@/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (!isSupabaseConfigured) {
    return <HomeClient products={[]} />;
  }

  // Fetch products
  const { data: productsData, error: productsError } = await publicSupabase
    .from('products')
    .select('*, product_variations(*)')
    .order('created_at', { ascending: false });

  // Fetch active banners
  const { data: bannersData, error: bannersError } = await publicSupabase
    .from('banners')
    .select('*')
    .eq('is_active', true);

  if (productsError) {
    console.error('Error fetching featured products:', productsError);
  }

  if (bannersError) {
    console.error('Error fetching banners:', bannersError);
  }

  const products: Product[] = (productsData || []).map(p => ({
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

  const heroBanner: Banner | null = bannersData?.find(b => b.title?.toLowerCase() === 'hero') || null;
  const activeBanner: Banner | null = bannersData?.find(b => b.title?.toLowerCase() !== 'hero') || bannersData?.[0] || null;

  return <HomeClient products={products} banner={activeBanner} heroBanner={heroBanner} />;
}

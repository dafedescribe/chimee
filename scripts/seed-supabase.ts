import { createClient } from '@supabase/supabase-js';

const PRODUCTS = [
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    category: 'Phones',
    condition: 'UK Used',
    priceNumeric: 1250000,
    specs: ['256GB', 'Natural Titanium', '98% Battery Health'],
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=1200',
    description: 'The pinnacle of mobile engineering. Finished in Natural Titanium, this UK Used unit is in pristine condition.',
    isDeal: true,
    createdAt: '2024-05-01',
    stockCount: 5
  },
  {
    id: 'macbook-pro-m3',
    name: 'MacBook Pro M3 Max',
    category: 'Laptops',
    condition: 'Brand New',
    priceNumeric: 4800000,
    specs: ['14-inch', '36GB RAM', '1TB SSD', 'Space Black'],
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200',
    description: 'Unleash extreme performance. This M3 Max MacBook is perfect for heavy creative workloads.',
    isDeal: false,
    createdAt: '2024-04-15',
    stockCount: 2
  },
  {
    id: 'ipad-pro-m2',
    name: 'iPad Pro M2',
    category: 'Laptops',
    condition: 'Brand New',
    priceNumeric: 1100000,
    specs: ['12.9-inch', 'Wi-Fi + Cellular', 'Space Gray'],
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=1200',
    description: 'The ultimate tablet experience. Powerful M2 chip for seamless multitasking.',
    isDeal: true,
    createdAt: '2024-05-02',
    stockCount: 3
  },
  {
    id: 'airpods-max',
    name: 'AirPods Max',
    category: 'Accessories',
    condition: 'UK Used',
    priceNumeric: 550000,
    specs: ['Active Noise Cancellation', 'Transparency Mode', 'Silver'],
    image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?auto=format&fit=crop&q=80&w=1200',
    description: 'High-fidelity audio meets luxury design. Minimal wear, perfect sound.',
    isDeal: false,
    createdAt: '2024-03-20',
    stockCount: 10
  },
  {
    id: 's24-ultra',
    name: 'Samsung S24 Ultra',
    category: 'Phones',
    condition: 'Brand New',
    priceNumeric: 1450000,
    specs: ['512GB', 'Titanium Gray', 'AI Powered'],
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=1200',
    description: 'The most advanced Galaxy ever. Experience the power of AI in your hand.',
    isDeal: true,
    createdAt: '2024-05-05',
    stockCount: 4
  },
  {
    id: 'pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    category: 'Phones',
    condition: 'Nigerian Used',
    priceNumeric: 680000,
    specs: ['128GB', 'Bay Blue', 'Perfect Camera'],
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=1200',
    description: 'Stunning photography and smart features. This unit is well-maintained with minimal cosmetic wear.',
    isDeal: false,
    createdAt: '2024-02-10',
    stockCount: 1
  }
];

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Seeding products...');

  for (const product of PRODUCTS) {
    const { error } = await supabase
      .from('products')
      .upsert({
        id: product.id,
        name: product.name,
        category: product.category,
        condition: product.condition,
        price_numeric: product.priceNumeric,
        stock_count: product.stockCount,
        specs: product.specs,
        image_url: product.image,
        description: product.description,
        is_deal: product.isDeal,
        created_at: new Date(product.createdAt).toISOString()
      });

    if (error) {
      console.error(`Error seeding ${product.name}:`, error.message);
    } else {
      console.log(`Successfully seeded ${product.name}`);
    }
  }

  console.log('Seeding complete!');
}

seed();

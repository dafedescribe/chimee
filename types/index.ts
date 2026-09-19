export type Condition = 'Brand New' | 'UK Used' | 'Nigerian Used';

export interface Variation {
  id: string;
  name: string;
  priceNumeric: number;
  stockCount: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'Phones' | 'Laptops' | 'Accessories';
  condition: string;
  price: string;
  priceNumeric: number;
  specs: string[];
  image: string;
  images?: string[];
  isDeal?: boolean;
  description: string;
  createdAt: string;
  stockCount?: number;
  variations?: Variation[];
}

export type Page = 'home' | 'product' | 'browse' | 'order' | 'whatsapp';

export interface FilterState {
  categories: string[];
  condition: string | null;
  minPrice: number;
  maxPrice: number;
  sort: 'newest' | 'price-asc' | 'price-desc';
}

export interface Banner {
  id: string;
  image_url: string;
  link_url: string;
  title: string | null;
  is_active: boolean;
}

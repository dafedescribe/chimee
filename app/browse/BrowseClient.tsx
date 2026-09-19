'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, SlidersHorizontal, X, Check, ShoppingBag, Search, Loader2 } from 'lucide-react';
import { Product, FilterState } from '@/types';
import { publicSupabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = ['Phones', 'Laptops', 'Accessories'];
const CONDITIONS = ['Brand New', 'UK Used', 'Nigerian Used'];
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price ↑' },
  { id: 'price-desc', label: 'Price ↓' },
];

interface BrowseClientProps {
  initialProducts: Product[];
}

export default function BrowseClient({ initialProducts }: BrowseClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === 'undefined') return { categories: [], condition: null, minPrice: 0, maxPrice: 5000000, sort: 'newest' };
    const params = new URLSearchParams(window.location.search);
    return {
      categories: params.get('category')?.split(',') || [],
      condition: params.get('condition') || null,
      minPrice: parseInt(params.get('min') || '0'),
      maxPrice: parseInt(params.get('max') || '5000000'),
      sort: (params.get('sort') as any) || 'newest',
    };
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Debounced server search for queries >= 3 chars
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await publicSupabase
          .rpc('search_products', { search_query: searchQuery });

        if (!error && data) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            condition: p.condition,
            price: `₦${p.price_numeric.toLocaleString()}`,
            priceNumeric: p.price_numeric,
            specs: p.specs || [],
            image: p.image_url,
            description: p.description,
            isDeal: p.is_deal,
            createdAt: p.created_at,
            stockCount: p.stock_count,
          }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.set('category', filters.categories.join(','));
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.minPrice > 0) params.set('min', filters.minPrice.toString());
    if (filters.maxPrice < 5000000) params.set('max', filters.maxPrice.toString());
    params.set('sort', filters.sort);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      window.history.pushState({}, '', newUrl);
    }
  }, [filters]);

  const toggleCategory = (cat: string) => {
    const c = cat.toLowerCase();
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter(x => x !== c)
        : [...prev.categories, c]
    }));
  };



  // Use server search results when available, otherwise client-side filter
  const baseProducts = searchResults !== null ? searchResults : initialProducts;

  const filteredProducts = useMemo(() => {
    return baseProducts
      .filter(p => {
        const catMatch = filters.categories.length === 0 || filters.categories.includes(p.category.toLowerCase());
        const condMatch = !filters.condition || p.condition.toLowerCase().replace(' ', '-') === filters.condition.toLowerCase().replace(' ', '-');
        const priceMatch = p.priceNumeric >= filters.minPrice && p.priceNumeric <= filters.maxPrice;
        // Only apply client-side text search for short queries (< 3 chars)
        const searchMatch = searchQuery.length >= 3 || searchQuery.length === 0 ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return catMatch && condMatch && priceMatch && searchMatch;
      })
      .sort((a, b) => {
        if (filters.sort === 'price-asc') return a.priceNumeric - b.priceNumeric;
        if (filters.sort === 'price-desc') return b.priceNumeric - a.priceNumeric;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filters, searchQuery, baseProducts]);

  const activeFiltersCount = filters.categories.length + (filters.condition ? 1 : 0) + (filters.minPrice > 0 || filters.maxPrice < 5000000 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen text-white">
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-[0.4em] text-chimee-amber font-black block mb-6">Explore</span>
        <h1 className="font-serif text-3xl md:text-8xl mb-6">Browse Units.</h1>
        <p className="text-white/40 font-medium tracking-wide">Premium curated selection of luxury phones, laptops and accessories in Lagos.</p>

        {/* Real-time Search */}
        <div className="mt-12 relative max-w-md mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models, categories..."
            aria-label="Search products"
            className="w-full bg-white/5 border border-white/10 h-16 pl-16 pr-14 focus:border-chimee-amber focus:outline-none transition-colors rounded-full text-sm font-medium"
          />
          {isSearching && (
            <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 text-chimee-amber animate-spin" size={18} />
          )}
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:block sticky top-24 z-30 mb-20">
        <div className="glass p-8 space-y-8 rounded-sm bg-chimee-black/50 backdrop-blur-xl border border-white/10">
          <div className="flex justify-between items-center">
            {/* Categories */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                className={`px-6 py-2 text-[0.625rem] uppercase font-black border tracking-widest transition-all ${filters.categories.length === 0 ? 'bg-chimee-amber border-chimee-amber text-black' : 'border-white/10 hover:border-white/30 text-white/40'}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-6 py-2 text-[0.625rem] uppercase font-black border tracking-widest transition-all ${filters.categories.includes(cat.toLowerCase()) ? 'bg-chimee-amber border-chimee-amber text-black' : 'border-white/10 hover:border-white/30 text-white/40'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Condition */}
            <div className="flex items-center gap-3">
              {CONDITIONS.map(cond => (
                <button
                  key={cond}
                  onClick={() => setFilters(prev => ({ ...prev, condition: prev.condition === cond.toLowerCase().replace(' ', '-') ? null : cond.toLowerCase().replace(' ', '-') }))}
                  className={`px-6 py-2 text-[0.625rem] uppercase font-black border tracking-widest transition-all ${filters.condition === cond.toLowerCase().replace(' ', '-') ? 'bg-chimee-amber border-chimee-amber text-black' : 'border-white/10 hover:border-white/30 text-white/40'}`}
                >
                  {cond}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative group">
              <button className="flex items-center gap-3 px-6 py-2 border border-white/10 text-[0.625rem] uppercase font-black tracking-widest text-white/60 hover:border-white/30 bg-chimee-black">
                Sort: {SORT_OPTIONS.find(o => o.id === filters.sort)?.label} <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 glass backdrop-blur-xl border border-white/10 hidden group-hover:block py-2 z-50 bg-chimee-black">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFilters(prev => ({ ...prev, sort: opt.id as any }))}
                    className={`w-full text-left px-6 py-3 text-[0.625rem] uppercase font-black tracking-widest hover:bg-white/5 transition-colors ${filters.sort === opt.id ? 'text-chimee-amber font-black' : 'text-white/40'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Slider Row */}
          <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="flex justify-between text-[0.625rem] uppercase font-black tracking-widest text-white/30">
              <span className="bg-white/5 px-3 py-1 rounded">Min: ₦{filters.minPrice.toLocaleString()}</span>
              <span className="bg-white/5 px-3 py-1 rounded">Max: ₦{filters.maxPrice.toLocaleString()}</span>
            </div>
            <div className="relative h-6 flex items-center">
              <div className="absolute w-full h-1 bg-white/10 rounded-full" />
              <div
                className="absolute h-1 bg-chimee-amber rounded-full"
                style={{
                  left: `${(filters.minPrice / 5000000) * 100}%`,
                  right: `${100 - (filters.maxPrice / 5000000) * 100}%`
                }}
              />
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Math.min(parseInt(e.target.value), prev.maxPrice - 50000) }))}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-chimee-amber [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto"
                aria-label="Minimum price"
              />
              <input
                type="range"
                min="0"
                max="5000000"
                step="50000"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Math.max(parseInt(e.target.value), prev.minPrice + 50000) }))}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-chimee-amber [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto"
                aria-label="Maximum price"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Trigger */}
      <div className="md:hidden sticky top-24 z-30 mb-8">
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className="w-full glass p-5 flex justify-between items-center rounded-sm bg-chimee-black/50 backdrop-blur-xl border border-white/10"
          aria-label="Open filters"
        >
          <div className="flex items-center gap-3 text-xs uppercase font-black tracking-[0.2em]">
            <SlidersHorizontal size={16} className="text-chimee-amber" />
            Filter {activeFiltersCount > 0 && <span className="bg-chimee-amber text-black w-5 h-5 rounded-full flex items-center justify-center text-[0.625rem] ml-1">{activeFiltersCount}</span>}
          </div>
          <span className="text-[0.625rem] uppercase font-black text-white/40 tracking-widest">{filteredProducts.length} Units</span>
        </button>
      </div>

      {/* Mobile Bottom Sheet Filter */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[60]"
              onClick={() => setIsFilterSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0a0a0a] rounded-t-[2.5rem] max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-4 shrink-0" />

              <div className="flex-grow overflow-y-auto p-10 space-y-12 pb-32">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-3xl">Filter By</h3>
                  <button onClick={() => setIsFilterSheetOpen(false)} className="bg-white/5 p-3 rounded-full text-white/50" aria-label="Close filters">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[0.625rem] uppercase tracking-widest font-black text-chimee-amber">Category</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                      className={`px-6 py-3 text-[0.625rem] uppercase font-black border tracking-widest rounded-full transition-all ${filters.categories.length === 0 ? 'bg-chimee-amber border-chimee-amber text-black' : 'border-white/10 text-white/40'}`}
                    >
                      All
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`px-6 py-3 text-[0.625rem] uppercase font-black border tracking-widest rounded-full transition-all ${filters.categories.includes(cat.toLowerCase()) ? 'bg-chimee-amber border-chimee-amber text-black' : 'border-white/10 text-white/40'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[0.625rem] uppercase tracking-widest font-black text-chimee-amber">Condition</h4>
                  <div className="flex flex-wrap gap-3">
                    {CONDITIONS.map(cond => (
                      <button
                        key={cond}
                        onClick={() => setFilters(prev => ({ ...prev, condition: prev.condition === cond.toLowerCase().replace(' ', '-') ? null : cond.toLowerCase().replace(' ', '-') }))}
                        className={`px-6 py-3 text-[0.625rem] uppercase font-black border tracking-widest rounded-full transition-all ${filters.condition === cond.toLowerCase().replace(' ', '-') ? 'bg-chimee-amber border-chimee-amber text-black' : 'border-white/10 text-white/40'}`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[0.625rem] uppercase tracking-widest font-black text-chimee-amber">Price Range</h4>
                  <div className="space-y-6">
                    <div className="flex justify-between text-[0.625rem] font-black text-white/30 uppercase tracking-widest">
                      <span>₦{filters.minPrice.toLocaleString()}</span>
                      <span>₦{filters.maxPrice.toLocaleString()}</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <div className="absolute w-full h-1 bg-white/10 rounded-full" />
                      <div
                        className="absolute h-1 bg-chimee-amber rounded-full"
                        style={{
                          left: `${(filters.minPrice / 5000000) * 100}%`,
                          right: `${100 - (filters.maxPrice / 5000000) * 100}%`
                        }}
                      />
                      <input
                        type="range" min="0" max="5000000" step="50000" value={filters.minPrice}
                        onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Math.min(parseInt(e.target.value), prev.maxPrice - 50000) }))}
                        className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-chimee-amber [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto"
                        aria-label="Minimum price"
                      />
                      <input
                        type="range" min="0" max="5000000" step="50000" value={filters.maxPrice}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Math.max(parseInt(e.target.value), prev.minPrice + 50000) }))}
                        className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-chimee-amber [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto"
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[0.625rem] uppercase tracking-widest font-black text-chimee-amber">Sort By</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setFilters(prev => ({ ...prev, sort: opt.id as any }))}
                        className={`flex justify-between items-center p-6 bg-white/5 border transition-all ${filters.sort === opt.id ? 'border-chimee-amber text-chimee-amber' : 'border-transparent text-white/40'}`}
                      >
                        <span className="text-xs uppercase font-black tracking-widest">{opt.label}</span>
                        {filters.sort === opt.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 glass backdrop-blur-2xl border-t border-white/10 bg-chimee-black">
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="w-full bg-chimee-amber text-black h-20 text-sm uppercase font-black tracking-[0.3em] flex items-center justify-center gap-3"
                >
                  See {filteredProducts.length} Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group cursor-pointer bg-chimee-dark/30 border border-white/5 p-4 md:p-8 hover:border-chimee-amber/50 transition-all flex flex-col gap-4 md:gap-6"
            >
              <Link href={`/product/${p.id}`} className="flex flex-col gap-6">
                <div className="aspect-square overflow-hidden bg-chimee-dark relative">
                  <Image src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                  <div className="absolute top-4 right-4">
                    <div className="bg-chimee-amber text-black px-3 py-1 text-[0.625rem] font-black uppercase tracking-widest shadow-lg">
                      {p.condition}
                    </div>
                  </div>
                  {p.stockCount !== undefined && p.stockCount <= 2 && p.stockCount > 0 && (
                    <div className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-1 text-[0.625rem] font-black uppercase tracking-widest">
                      Only {p.stockCount} Left
                    </div>
                  )}
                  {p.stockCount === 0 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-xs uppercase font-black tracking-[0.4em] border-2 border-white px-6 py-2">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <p className="text-[0.625rem] uppercase tracking-widest text-white/40">{p.category} · {p.specs[0]}</p>
                  <h3 className="font-serif text-xl md:text-3xl group-hover:text-chimee-amber transition-colors">{p.name}</h3>
                  <p className="font-serif text-2xl text-chimee-amber">{p.price}</p>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-40 text-center space-y-10">
            <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white/20">
              <ShoppingBag size={48} />
            </div>
            <div>
              <h3 className="font-serif text-3xl md:text-5xl mb-4">Nothing Matches.</h3>
              <p className="text-white/40 max-w-sm mx-auto text-lg">Try expanding your search parameters or check back later for new arrivals.</p>
            </div>
            <button onClick={() => setFilters({ categories: [], condition: null, minPrice: 0, maxPrice: 5000000, sort: 'newest' })} className="text-chimee-amber text-xs uppercase font-black tracking-widest border-b border-chimee-amber pb-1 px-2">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

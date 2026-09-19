'use client';

import { useState, useEffect, Suspense } from 'react';
import { ShieldCheck, Truck, Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { publicSupabase } from '@/lib/supabase';
import { Product, Variation } from '@/types';
import Image from 'next/image';

function OrderForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const variationId = searchParams.get('variation');

  // Fetch product from Supabase
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    async function fetchProduct() {
      const { data: p, error } = await publicSupabase
        .from('products')
        .select('*, product_variations(*)')
        .eq('id', productId)
        .single();

      if (!error && p) {
        const mapped: Product = {
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
            stockCount: v.stock_count,
          })),
        };
        setProduct(mapped);

        // Auto-select variation if specified in URL
        if (variationId && mapped.variations) {
          const match = mapped.variations.find(v => v.id === variationId);
          if (match) setSelectedVariation(match);
        }
      }
      setLoading(false);
    }

    fetchProduct();
  }, [productId, variationId]);

  const displayPrice = selectedVariation
    ? `₦${selectedVariation.priceNumeric.toLocaleString()}`
    : product?.price || '';

  const displayPriceNumeric = selectedVariation
    ? selectedVariation.priceNumeric
    : product?.priceNumeric || 0;

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          variationId: selectedVariation?.id || null,
          productName: product?.name || 'Custom Order',
          variationName: selectedVariation?.name || null,
          customerName: formData.get('name'),
          customerPhone: formData.get('phone'),
          deliveryAddress: formData.get('address'),
          price: displayPriceNumeric,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      // Redirect to confirmation page
      const confirmUrl = `/order/confirmation?id=${data.orderId}&product=${encodeURIComponent(product?.name || 'Custom Order')}`;
      router.push(confirmUrl);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-40 text-center flex flex-col items-center gap-6 text-white">
        <Loader2 size={40} className="animate-spin text-chimee-amber" />
        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">Loading order details...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-40 text-center flex flex-col items-center gap-10 text-white">
        <div className="w-20 h-20 rounded-full border border-chimee-amber flex items-center justify-center text-chimee-amber animate-bounce">
          <ShieldCheck size={40} />
        </div>
        <div>
          <h2 className="font-serif text-3xl md:text-5xl mb-6">Order Received.</h2>
          <p className="text-white/40 font-medium leading-relaxed">Your request has been prioritized. Our Lagos logistics team will contact you within 30 minutes to confirm delivery.</p>
        </div>
        <button onClick={() => window.location.href = '/'} className="text-xs uppercase tracking-widest border-b border-chimee-amber pb-1 font-black">Return Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20 min-h-screen text-white">
      <div className="mb-20">
        <h1 className="font-serif text-3xl md:text-6xl mb-8">Secure Your Order.</h1>
        <p className="text-white/40 font-medium">Fast-track your purchase. All orders are processed manually for maximum trust.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {product && (
          <div className="bg-chimee-dark/50 p-6 border border-white/5 flex gap-6 items-center mb-10">
            <div className="relative w-20 h-20 shrink-0">
              <Image src={product.image} className="object-cover" alt={product.name} fill sizes="80px" />
            </div>
            <div>
              <p className="text-[0.625rem] uppercase tracking-widest text-white/50">Selected Item</p>
              <h4 className="font-serif text-xl">{product.name}</h4>
              {selectedVariation && (
                <p className="text-white/50 text-xs mt-1">{selectedVariation.name}</p>
              )}
              <p className="text-chimee-amber font-bold">{displayPrice}</p>
            </div>
          </div>
        )}

        {product && product.variations && product.variations.length > 0 && (
          <div className="space-y-4">
            <label className="text-[0.625rem] uppercase tracking-[0.2em] font-black text-white/40 block ml-4">Select Variation</label>
            <div className="flex flex-wrap gap-3">
              {product.variations.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariation(v)}
                  className={`px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all border ${selectedVariation?.id === v.id
                    ? 'border-chimee-amber bg-chimee-amber text-black'
                    : 'border-white/10 hover:border-white/40 text-white/60'
                    }`}
                >
                  {v.name} — ₦{v.priceNumeric.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[0.625rem] uppercase tracking-[0.2em] font-black text-white/40 block ml-4">Full Name</label>
            <input required name="name" type="text" className="w-full bg-chimee-dark border border-white/10 h-16 px-6 focus:border-chimee-amber focus:outline-none transition-colors" placeholder="e.g. Tunde Johnson" />
          </div>
          <div className="space-y-3">
            <label className="text-[0.625rem] uppercase tracking-[0.2em] font-black text-white/40 block ml-4">Phone Number</label>
            <input required name="phone" type="tel" className="w-full bg-chimee-dark border border-white/10 h-16 px-6 focus:border-chimee-amber focus:outline-none transition-colors" placeholder="080 0000 0000" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[0.625rem] uppercase tracking-[0.2em] font-black text-white/40 block ml-4">Delivery Address (Lagos Only)</label>
          <textarea required name="address" className="w-full bg-chimee-dark border border-white/10 h-32 p-6 focus:border-chimee-amber focus:outline-none transition-colors resize-none" placeholder="House number, Street, Area..." />
        </div>

        <div className="flex items-center gap-6 p-6 bg-chimee-amber/5 border border-chimee-amber/20">
          <Truck className="text-chimee-amber shrink-0" size={24} />
          <p className="text-xs font-medium text-white/60">Pay on Delivery is currently active for all Lagos orders. Direct bank transfer also available upon confirmation.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-chimee-amber text-black h-20 text-sm uppercase tracking-[0.3em] font-black hover:translate-y-[-4px] transition-all shadow-2xl shadow-chimee-amber/20 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <><Loader2 size={20} className="animate-spin" /> Processing...</>
          ) : (
            'Confirm Official Order'
          )}
        </button>
      </form>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto px-6 py-40 text-center flex flex-col items-center gap-6 text-white">
        <Loader2 size={40} className="animate-spin text-chimee-amber" />
      </div>
    }>
      <OrderForm />
    </Suspense>
  );
}

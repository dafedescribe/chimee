'use client';

import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, ShieldCheck, Truck, MessageCircle, Headphones } from 'lucide-react';
import { Product, Banner } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface HomeClientProps {
  products: Product[];
  banner?: Banner | null;
  heroBanner?: Banner | null;
}

export default function HomeClient({ products, banner, heroBanner }: HomeClientProps) {
  const featured = products[0] || {
    id: 'placeholder',
    name: 'Luxury Electronics',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=1200',
    price: 'Contact Us'
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-chimee-black">
      {/* Hero — clean, device-focused */}
      <section className="relative h-[90vh] h-dvh flex items-end px-6 md:px-20 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={heroBanner?.image_url || featured.image}
            className="w-full h-full object-cover opacity-60 scale-105"
            alt={heroBanner?.title || featured.name || 'Featured luxury device'}
            fill
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-chimee-black via-transparent to-transparent" />
        </div>

        <div className="relative max-w-4xl space-y-8">
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-balance font-serif text-hero-display text-white"
          >
            THE NEW <br />
            STANDARD.
          </motion.h1>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            {heroBanner ? (
              <Link
                href={heroBanner.link_url || '/browse'}
                className="bg-white text-black px-6 py-3 md:px-8 md:py-4 text-xs font-bold uppercase tracking-widest hover:bg-chimee-amber transition-colors flex items-center gap-3"
              >
                Explore Offer <ArrowRight size={16} />
              </Link>
            ) : featured.id !== 'placeholder' ? (
              <Link
                href={`/product/${featured.id}`}
                className="bg-white text-black px-6 py-3 md:px-8 md:py-4 text-xs font-bold uppercase tracking-widest hover:bg-chimee-amber transition-colors flex items-center gap-3"
              >
                Explore Device <ArrowRight size={16} />
              </Link>
            ) : null}
            <Link
              href="/browse"
              className="px-6 py-3 md:px-8 md:py-4 border border-white/20 text-xs font-bold uppercase tracking-widest hover:border-white transition-colors text-white"
            >
              View All Units
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Promotional Banner — enticing card */}
      {banner && (
        <section className="max-w-7xl mx-auto px-6 mt-12">
          <Link
            href={banner.link_url}
            className="group block overflow-hidden border border-white/5 hover:border-chimee-amber/20 transition-all bg-chimee-dark/40"
          >
            <div className="flex flex-col md:flex-row">
              {/* Banner Image */}
              {banner.image_url && (
                <div className="w-full md:w-2/5 overflow-hidden shrink-0 bg-chimee-dark flex items-center justify-center">
                  <img
                    src={banner.image_url}
                    alt={banner.title || 'Promotion'}
                    className="w-full h-auto max-h-[300px] object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Banner Content */}
              <div className="flex-1 flex flex-col justify-center px-8 py-8 md:px-12 md:py-10 gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-[2px] bg-chimee-amber" />
                  <span className="text-[0.625rem] uppercase tracking-[0.25em] font-black text-chimee-amber">Featured Offer</span>
                </div>
                {banner.title && (
                  <h3 className="font-serif text-2xl md:text-3xl text-white leading-snug group-hover:text-chimee-amber transition-colors">
                    {banner.title}
                  </h3>
                )}
                <div className="mt-2">
                  <span className="inline-flex items-center gap-2 text-[0.625rem] md:text-xs uppercase tracking-widest font-bold text-white/50 group-hover:text-white transition-colors border-b border-white/10 group-hover:border-chimee-amber pb-1">
                    Explore Offer <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Product Grid — immediate, device-focused */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="flex justify-between items-end mb-12 px-4">
          <h2 className="font-serif text-3xl md:text-6xl text-white">Inventory.</h2>
          <Link href="/browse" className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors group">
            See all units <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-4 gap-y-12 md:gap-x-12 md:gap-y-24">
          {products.slice(0, 12).map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col"
            >
              <Link
                href={`/product/${product.id}`}
                className="aspect-[4/5] overflow-hidden bg-chimee-dark cursor-pointer group relative"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  fill
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
                <div className="absolute top-3 left-3 md:top-6 md:left-6 flex flex-col gap-2">
                  <span className="bg-black/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 text-[0.625rem] uppercase tracking-widest font-bold text-white">
                    {product.condition}
                  </span>
                  {product.isDeal && (
                    <span className="bg-chimee-amber text-black px-3 py-1.5 text-[0.625rem] uppercase tracking-widest font-black">
                      Hot Deal
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-chimee-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-10">
                  <span className="text-[0.625rem] md:text-xs uppercase tracking-[0.2em] font-black border-b border-chimee-amber pb-2 text-white">View Details</span>
                </div>
              </Link>
              <div className="mt-4 md:mt-8 flex flex-col md:flex-row justify-between items-start gap-2">
                <div>
                  <h3 className="font-serif text-xl md:text-3xl mb-1 md:mb-2 text-white group-hover:text-chimee-amber transition-colors">{product.name}</h3>
                  <p className="text-white/50 text-[0.625rem] md:text-xs uppercase tracking-widest">{product.category} · {product.specs[0]}</p>
                </div>
                <p className="font-serif text-lg md:text-2xl text-chimee-amber">{product.price}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile "See All" link */}
        <div className="md:hidden mt-12 text-center">
          <Link href="/browse" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-chimee-amber font-black">
            See all units <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* Test deploy marker - 07078126418 */}
      <div className="hidden">DEPLOY_TEST_07078126418</div>
      {/* Trust Strip — subtle footnote */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="border-t border-white/5 pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/50">
          {[
            { icon: <ShieldCheck size={14} />, text: 'UK Verified · Premium Grade' },
            { icon: <Truck size={14} />, text: 'Same-Day Lagos Delivery' },
            { icon: <MessageCircle size={14} />, text: 'WhatsApp Direct Support' },
            { icon: <Headphones size={14} />, text: 'Pay on Delivery' },
          ].map((item, i, arr) => (
            <span key={i} className="flex items-center gap-2 text-[0.625rem] uppercase tracking-widest font-medium">
              <span className="text-chimee-amber/50">{item.icon}</span>
              {item.text}
              {i < arr.length - 1 && <span className="ml-6 text-white/10 hidden md:inline">|</span>}
            </span>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

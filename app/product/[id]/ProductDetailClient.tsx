'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Variation } from '@/types';
import { buildWhatsAppUrl } from '@/lib/business';
import Link from 'next/link';
import Image from 'next/image';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    product.variations && product.variations.length > 0 ? product.variations[0] : null
  );
  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const selectedImage = allImages[selectedImageIndex];

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleVariationSelect = (v: Variation, index: number) => {
    setSelectedVariation(v);
    if (index < allImages.length) {
      setSelectedImageIndex(index);
    }
  };

  const displayPrice = selectedVariation
    ? `₦${selectedVariation.priceNumeric.toLocaleString()}`
    : product.price;

  const displayStock = (selectedVariation && selectedVariation.stockCount > 0)
    ? selectedVariation.stockCount
    : product.stockCount;

  const whatsappMessage = selectedVariation
    ? `I'm interested in the ${product.name} - ${selectedVariation.name} (${displayPrice})`
    : `I'm interested in the ${product.name} (${displayPrice})`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-40 text-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="md:sticky md:top-[7.5rem] h-fit space-y-4">
          {/* Main Image Slider */}
          <div className="relative overflow-hidden bg-chimee-dark flex items-center justify-center min-h-[300px] group touch-pan-y">
            <motion.img 
              key={selectedImageIndex}
              src={selectedImage} 
              alt={product.name} 
              className="w-auto max-w-full max-h-[75vh] block mx-auto cursor-grab active:cursor-grabbing"
              initial={{ opacity: 0.5, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset }) => {
                if (offset.x < -50) handleNextImage();
                else if (offset.x > 50) handlePrevImage();
              }}
            />
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage} 
                  className="absolute left-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-chimee-amber hover:text-black"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={handleNextImage} 
                  className="absolute right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-chimee-amber hover:text-black"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 overflow-hidden border-2 transition-all ${selectedImageIndex === i ? 'border-chimee-amber opacity-100' : 'border-white/10 opacity-50 hover:opacity-80'
                    }`}
                >
                  <Image src={img} alt={`${product.name} ${i + 1}`} className="object-cover" fill sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex flex-col justify-center gap-12"
        >
          <div>
            <div className="flex gap-4 mb-6">
              <span className="text-xs uppercase tracking-[0.2em] px-3 py-1 border border-chimee-amber/40 text-chimee-amber font-bold">{product.condition}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-white/40 pt-1">{product.category}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-8xl leading-tight">{product.name}</h1>
            <div className="flex items-baseline gap-4 mt-6">
              <p className="font-serif text-2xl md:text-4xl text-chimee-amber">{displayPrice}</p>
              {displayStock !== undefined && (
                <span className="text-xs uppercase tracking-widest text-white/40 font-bold">
                  {displayStock > 0 ? `${displayStock} IN STOCK` : 'OUT OF STOCK'}
                </span>
              )}
            </div>
          </div>

          {product.variations && product.variations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.3em] font-black text-white/40">Select Variation</h3>
              <div className="flex flex-wrap gap-3">
                {product.variations.map((v, index) => (
                  <button
                    key={v.id}
                    onClick={() => handleVariationSelect(v, index)}
                    className={`px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all border ${selectedVariation?.id === v.id
                      ? 'border-chimee-amber bg-chimee-amber text-black'
                      : 'border-white/10 hover:border-white/40 text-white/60'
                      }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            <h3 className="text-xs uppercase tracking-[0.3em] font-black text-white/40">Specifications</h3>
            <div className="grid grid-cols-1 gap-4">
              {product.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-white/10 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-chimee-amber/20 group-hover:bg-chimee-amber transition-colors" />
                  <p className="text-sm font-medium tracking-wide">{spec}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-white/60 leading-relaxed text-lg font-medium">{product.description}</p>
            <div className="bg-chimee-dark p-6 border-l-2 border-chimee-amber italic text-sm text-white/40">
              ⚠️ UK Used devices are fully tested and come with a 7-day swap guarantee. Lagos delivery is within 24 hours.
            </div>
          </div>

          {/* Sticky Mobile Bottom Bar for CTAs */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-chimee-black/95 backdrop-blur-md border-t border-white/10 sm:relative sm:bg-transparent sm:border-0 sm:p-0 sm:mt-8 z-40">
            <div className="flex flex-col sm:flex-row gap-3 max-w-7xl mx-auto">
              <button
                onClick={() => {
                  const url = buildWhatsAppUrl(whatsappMessage);
                  if (url) window.open(url, '_blank');
                }}
                className="flex-1 bg-[#25D366] text-black h-32 sm:h-16 text-xl sm:text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <MessageCircle size={28} fill="currentColor" className="sm:w-5 sm:h-5" /> Order via WhatsApp
              </button>
              <Link
                href={`/order?id=${product.id}${selectedVariation ? `&variation=${selectedVariation.id}` : ''}`}
                className="flex-1 border border-white h-32 sm:h-16 text-xl sm:text-xs uppercase tracking-widest font-black hover:bg-white hover:text-black transition-all flex items-center justify-center bg-chimee-black sm:bg-transparent text-center px-4"
              >
                Fill Order Form
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

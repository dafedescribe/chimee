'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Check, MessageCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { buildWhatsAppUrl } from '@/lib/business';

function ConfirmationContent() {
    const params = useSearchParams();
    const orderId = params.get('id');
    const productName = params.get('product');

    const whatsappUrl = buildWhatsAppUrl(
        `Hi! I just placed order ${orderId || ''} for ${productName || 'a product'}. Confirming my order.`
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="text-center space-y-8 max-w-lg">
                <div className="w-24 h-24 rounded-full bg-chimee-amber/10 border border-chimee-amber/30 flex items-center justify-center mx-auto">
                    <Check size={40} className="text-chimee-amber" />
                </div>

                <div>
                    <span className="text-[0.625rem] uppercase tracking-[0.3em] font-black text-chimee-amber block mb-4">Order Confirmed</span>
                    <h1 className="font-serif text-3xl md:text-6xl text-white mb-4">Thank You!</h1>
                    {productName && (
                        <p className="text-white/60 text-lg font-medium">{productName}</p>
                    )}
                </div>

                {orderId && (
                    <div className="bg-white/5 border border-white/10 px-6 py-4 inline-block">
                        <span className="text-[0.625rem] uppercase tracking-widest text-white/30 block mb-1">Order ID</span>
                        <span className="text-sm font-mono text-white/70">{orderId}</span>
                    </div>
                )}

                <div className="text-left bg-white/5 border border-white/10 p-8 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-white/50">What Happens Next</h3>
                    <div className="space-y-3">
                        {[
                            'Our team reviews your order within 30 minutes',
                            'You receive a WhatsApp confirmation with payment details',
                            'Once payment is confirmed, we prepare your unit',
                            'Same-day delivery within Lagos, next-day nationwide'
                        ].map((step, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <span className="w-6 h-6 rounded-full bg-chimee-amber/10 text-chimee-amber text-[0.625rem] font-black flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-white/50 text-sm leading-relaxed">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-chimee-amber text-black text-xs uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all"
                        >
                            <MessageCircle size={14} /> Confirm on WhatsApp
                        </a>
                    )}
                    <Link
                        href="/browse"
                        className="px-8 py-4 border border-white/20 text-xs uppercase tracking-widest font-bold text-white flex items-center justify-center gap-2 hover:border-white transition-colors"
                    >
                        Continue Browsing <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default function OrderConfirmation() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-chimee-amber/20 border-t-chimee-amber rounded-full animate-spin" /></div>}>
            <ConfirmationContent />
        </Suspense>
    );
}

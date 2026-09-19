'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['Phones', 'Laptops', 'Accessories'];

export default function RequestPage() {
    const [form, setForm] = useState({ productName: '', category: '', customerName: '', customerPhone: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit request');
            }

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[70vh] flex items-center justify-center px-6">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-chimee-amber/10 border border-chimee-amber/30 flex items-center justify-center mx-auto">
                        <Check size={32} className="text-chimee-amber" />
                    </div>
                    <h2 className="font-serif text-2xl md:text-4xl text-white">Request Received!</h2>
                    <p className="text-white/40 leading-relaxed">
                        We&apos;ve noted your interest in <strong className="text-white/70">{form.productName}</strong>.
                        Our team will source it and reach out when it&apos;s available.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link href="/browse" className="px-8 py-4 bg-chimee-amber text-black text-xs uppercase tracking-widest font-black hover:translate-y-[-2px] transition-all">
                            Browse Inventory
                        </Link>
                        <button onClick={() => { setIsSubmitted(false); setForm({ productName: '', category: '', customerName: '', customerPhone: '', message: '' }); }} className="px-8 py-4 border border-white/20 text-xs uppercase tracking-widest font-bold text-white hover:border-white transition-colors">
                            Submit Another
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-24 min-h-screen">
            <Link href="/browse" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-xs uppercase tracking-widest font-bold mb-12 transition-colors">
                <ArrowLeft size={14} /> Back to Browse
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <span className="text-[0.625rem] uppercase tracking-[0.3em] font-black text-chimee-amber">Request a Product</span>
                <h1 className="font-serif text-3xl md:text-6xl mt-4 mb-4 text-white">Can&apos;t Find It?</h1>
                <p className="text-white/40 leading-relaxed mb-12 max-w-lg">
                    Tell us what you&apos;re looking for. We source premium devices from verified UK suppliers and will notify you when your unit is available.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Name */}
                    <div>
                        <label className="text-[0.625rem] uppercase tracking-widest font-bold text-white/50 mb-2 block">What are you looking for? *</label>
                        <input
                            type="text"
                            required
                            value={form.productName}
                            onChange={(e) => setForm(prev => ({ ...prev, productName: e.target.value }))}
                            placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium"
                            className="w-full bg-white/5 border border-white/10 h-14 px-5 focus:border-chimee-amber focus:outline-none transition-colors text-sm"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-[0.625rem] uppercase tracking-widest font-bold text-white/50 mb-2 block">Category</label>
                        <div className="flex gap-3">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, category: prev.category === cat ? '' : cat }))}
                                    className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold border transition-all ${form.category === cat
                                        ? 'border-chimee-amber bg-chimee-amber/10 text-chimee-amber'
                                        : 'border-white/10 text-white/40 hover:border-white/30'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[0.625rem] uppercase tracking-widest font-bold text-white/50 mb-2 block">Your Name *</label>
                            <input
                                type="text"
                                required
                                value={form.customerName}
                                onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                                placeholder="Full name"
                                className="w-full bg-white/5 border border-white/10 h-14 px-5 focus:border-chimee-amber focus:outline-none transition-colors text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[0.625rem] uppercase tracking-widest font-bold text-white/50 mb-2 block">Phone (optional)</label>
                            <input
                                type="tel"
                                value={form.customerPhone}
                                onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                                placeholder="08012345678"
                                className="w-full bg-white/5 border border-white/10 h-14 px-5 focus:border-chimee-amber focus:outline-none transition-colors text-sm"
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="text-[0.625rem] uppercase tracking-widest font-bold text-white/50 mb-2 block">Additional Details</label>
                        <textarea
                            value={form.message}
                            onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Preferred color, storage, condition, budget..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 p-5 focus:border-chimee-amber focus:outline-none transition-colors text-sm resize-none"
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-chimee-amber text-black text-xs uppercase tracking-widest font-black flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={14} /> Submit Request
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

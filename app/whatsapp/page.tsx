'use client';

import { motion } from 'motion/react';
import { MessageCircle, CheckCircle2, BellRing, Users } from 'lucide-react';
import { businessConfig } from '@/lib/business';

export default function WhatsApp() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 min-h-screen text-white">
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-3 bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest">Live Updates Available</span>
        </div>
        <h1 className="font-serif text-3xl md:text-8xl mb-8">Join the Inner Circle.</h1>
        <p className="text-white/40 max-w-xl mx-auto text-lg">Be the first to know when luxury inventory drops. Exclusive access for our Lagos community.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-20">
        {[
          { icon: <BellRing className="text-chimee-amber" />, title: "Instant Alerts", desc: "Get notified the second a high-demand unit arrives." },
          { icon: <CheckCircle2 className="text-chimee-amber" />, title: "Reserved Deals", desc: "Special pricing exclusively for channel members." },
          { icon: <Users className="text-chimee-amber" />, title: "Direct Access", desc: "Chat directly with our procurement team." },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-chimee-dark/50 border border-white/5 p-8 rounded-sm"
          >
            <div className="mb-6">{item.icon}</div>
            <h3 className="font-bold text-sm tracking-widest uppercase mb-2">{item.title}</h3>
            <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass p-12 text-center rounded-sm border border-chimee-amber/20 bg-chimee-black">
        <h3 className="font-serif text-2xl md:text-4xl mb-6">Ready to Join?</h3>
        <p className="text-white/40 mb-10">Scan the code or click below to join our official WhatsApp Channel.</p>
        <button
          onClick={() => businessConfig.whatsappChannelUrl && window.open(businessConfig.whatsappChannelUrl, '_blank')}
          className="bg-[#25D366] text-black px-12 py-5 text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 mx-auto hover:scale-105 transition-transform"
        >
          <MessageCircle size={24} fill="currentColor" /> Join WhatsApp Channel
        </button>
      </div>
    </div>
  );
}

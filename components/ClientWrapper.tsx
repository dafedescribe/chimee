'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { Page } from '@/types';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/business';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const currentPage = (pathname === '/' ? 'home' : pathname.replace('/', '')) as Page;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-chimee-amber selection:text-black bg-chimee-black text-white">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <Navbar
        currentPage={currentPage}
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <main id="main-content" className="flex-grow pt-24">
        {children}
      </main>
      <Footer />
      
      {/* Global WhatsApp Support Button */}
      <button
        onClick={() => {
          const url = buildWhatsAppUrl("Hi Chimee Support, I need help with...", "support");
          if (url) window.open(url, '_blank');
        }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] w-14 h-14 bg-[#25D366] text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 group"
        aria-label="Contact Support on WhatsApp"
      >
        <MessageCircle size={28} fill="currentColor" />
        <span className="absolute right-full mr-4 bg-chimee-dark text-white text-xs uppercase tracking-widest font-bold py-2 px-4 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
          Support
        </span>
      </button>
    </div>
  );
}

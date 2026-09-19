'use client';

import { Menu, X, MessageSquarePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Page, Product } from '@/types';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface NavbarProps {
  currentPage: Page;
  scrolled: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  navigateTo?: (page: Page, product?: Product) => void;
}

export default function Navbar({ currentPage, scrolled, isMenuOpen, setIsMenuOpen }: NavbarProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, setIsMenuOpen]);

  // Focus first menu link when menu opens
  useEffect(() => {
    if (isMenuOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector('a');
      if (firstLink) firstLink.focus();
    }
  }, [isMenuOpen]);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-chimee-black/90 backdrop-blur-md py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link
            href="/"
            className="font-serif text-3xl tracking-tight hover:text-chimee-amber transition-colors"
          >
            CHIMEE
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            {['home', 'browse'].map((p) => (
              <Link
                key={p}
                href={p === 'home' ? '/' : `/${p}`}
                className={`text-xs uppercase tracking-[0.2em] font-bold hover:text-chimee-amber transition-colors ${currentPage === p ? 'text-chimee-amber' : 'text-white/60'}`}
              >
                {p}
              </Link>
            ))}
            <Link
              href="/requests"
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 hover:text-chimee-amber transition-colors"
            >
              <MessageSquarePlus size={16} />
              <span>Request</span>
            </Link>
            <Link
              href="/whatsapp"
              className="px-6 py-2 border border-white/20 text-xs uppercase tracking-widest hover:border-chimee-amber hover:bg-chimee-amber hover:text-black transition-all duration-300"
            >
              Join Channel
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden touch-target"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-chimee-black flex flex-col items-center justify-center gap-8 p-10"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {['home', 'browse', 'requests', 'whatsapp'].map((p) => (
              <Link
                key={p}
                href={p === 'home' ? '/' : `/${p}`}
                onClick={() => setIsMenuOpen(false)}
                className="font-serif text-3xl hover:text-chimee-amber transition-colors capitalize"
              >
                {p === 'requests' ? 'Request' : p}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

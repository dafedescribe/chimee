'use client';

import { businessConfig } from '@/lib/business';

export default function Footer() {
  const socialLinks = [
    { label: 'WhatsApp Channel', url: businessConfig.whatsappChannelUrl },
    { label: 'Instagram', url: businessConfig.instagramUrl },
    { label: 'Twitter/X', url: businessConfig.twitterUrl },
  ].filter(link => link.url);

  return (
    <footer className="bg-chimee-dark py-16 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-12">
        {socialLinks.length > 0 && (
          <div className="flex flex-col gap-4">
            <span className="text-xs uppercase tracking-widest text-chimee-amber font-bold">Connect</span>
            <div className="flex flex-wrap gap-6">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="font-serif text-xl md:text-2xl hover:text-chimee-amber transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/10 text-white/50 text-xs uppercase tracking-widest gap-4">
          <p>© {new Date().getFullYear()} CHIMEE LAGOS. ALL RIGHTS RESERVED.</p>
          <a href="https://www.dafe.name.ng" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors group">
            <span>Made by</span>
            <img src="https://www.dafe.name.ng/favicon.png" alt="DafeDeScribe" width={20} height={20} className="w-5 h-5 rounded-full border border-white/10 group-hover:border-chimee-amber/50 object-cover" />
            <span className="font-bold tracking-wider group-hover:text-chimee-amber">DafeDeScribe</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

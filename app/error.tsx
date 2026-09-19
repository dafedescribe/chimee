'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="text-center space-y-8 max-w-md">
                <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mx-auto">
                    <span className="text-4xl">⚡</span>
                </div>
                <div>
                    <h2 className="font-serif text-2xl md:text-4xl mb-4 text-white">Something went wrong.</h2>
                    <p className="text-white/40 font-medium leading-relaxed">
                        We hit an unexpected issue. Please try again or contact us via WhatsApp.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="px-8 py-4 bg-chimee-amber text-black text-xs uppercase tracking-widest font-black hover:translate-y-[-2px] transition-all"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-8 py-4 border border-white/20 text-xs uppercase tracking-widest font-bold text-white hover:border-white transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        </div>
    );
}

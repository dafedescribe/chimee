import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="text-center space-y-8 max-w-lg">
                <h1 className="font-serif text-[12rem] leading-none text-white/5 select-none">404</h1>
                <div className="-mt-24 relative">
                    <h2 className="font-serif text-3xl md:text-5xl mb-4 text-white">Page Not Found.</h2>
                    <p className="text-white/40 font-medium leading-relaxed">
                        This unit doesn&apos;t exist in our inventory. It may have been sold or the link is incorrect.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link
                        href="/browse"
                        className="px-8 py-4 bg-chimee-amber text-black text-xs uppercase tracking-widest font-black hover:translate-y-[-2px] transition-all"
                    >
                        Browse Inventory
                    </Link>
                    <Link
                        href="/"
                        className="px-8 py-4 border border-white/20 text-xs uppercase tracking-widest font-bold text-white hover:border-white transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

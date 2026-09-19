export default function BrowseLoading() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen">
            {/* Header skeleton */}
            <div className="mb-16 text-center max-w-2xl mx-auto">
                <div className="h-3 w-20 bg-white/5 rounded mx-auto mb-6" />
                <div className="h-16 w-80 bg-white/5 rounded mx-auto mb-6" />
                <div className="h-4 w-64 bg-white/5 rounded mx-auto" />
                <div className="mt-12 max-w-md mx-auto">
                    <div className="h-16 bg-white/5 rounded-full" />
                </div>
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-20">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-square bg-white/5 rounded-sm" />
                        <div className="mt-6 space-y-3">
                            <div className="h-3 w-24 bg-white/5 rounded" />
                            <div className="h-6 w-48 bg-white/5 rounded" />
                            <div className="h-5 w-32 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

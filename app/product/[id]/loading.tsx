export default function ProductLoading() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-20">
                {/* Image skeleton */}
                <div className="aspect-[4/5] bg-white/5 animate-pulse rounded-sm" />

                {/* Details skeleton */}
                <div className="flex flex-col justify-center gap-8">
                    <div className="flex gap-4">
                        <div className="h-6 w-24 bg-white/5 rounded" />
                        <div className="h-6 w-20 bg-white/5 rounded" />
                    </div>
                    <div className="h-16 w-full bg-white/5 rounded" />
                    <div className="h-10 w-48 bg-white/5 rounded" />
                    <div className="space-y-4 mt-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-12 bg-white/5 rounded border-b border-white/5" />
                        ))}
                    </div>
                    <div className="h-24 bg-white/5 rounded mt-4" />
                    <div className="flex gap-4">
                        <div className="flex-1 h-16 bg-white/5 rounded" />
                        <div className="flex-1 h-16 bg-white/5 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}

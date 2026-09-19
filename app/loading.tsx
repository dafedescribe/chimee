export default function RootLoading() {
    return (
        <div className="min-h-screen bg-chimee-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-10 h-10 border-2 border-chimee-amber/20 border-t-chimee-amber rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-[0.3em] text-white/30 font-bold">Loading</span>
            </div>
        </div>
    );
}

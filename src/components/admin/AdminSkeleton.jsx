export function AdminSkeleton({ className = '' }) {
    return (
        <div className={`bg-gray-200/50 animate-pulse rounded-2xl ${className}`} />
    );
}

export function AdminHeaderSkeleton() {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
                <AdminSkeleton className="h-8 w-12 rounded-full" />
                <AdminSkeleton className="h-12 w-80 rounded-xl" />
                <AdminSkeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="flex gap-4">
                <AdminSkeleton className="h-12 w-32 rounded-xl" />
                <AdminSkeleton className="h-12 w-32 rounded-xl" />
            </div>
        </div>
    );
}

export function AdminCardSkeleton() {
    return (
        <div className="bg-[hsl(var(--admin-surface))] rounded-[3rem] p-8 md:p-12 border border-[hsl(var(--admin-border))] shadow-sm">
            <div className="flex items-center gap-5 mb-12">
                <AdminSkeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-3">
                    <AdminSkeleton className="h-6 w-48 rounded-lg" />
                    <AdminSkeleton className="h-3 w-32 rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <AdminSkeleton className="h-3 w-24 rounded-lg" />
                    <AdminSkeleton className="h-14 w-full rounded-2xl" />
                </div>
                <div className="space-y-4">
                    <AdminSkeleton className="h-3 w-24 rounded-lg" />
                    <AdminSkeleton className="h-14 w-full rounded-2xl" />
                </div>
                <div className="space-y-4 md:col-span-2">
                    <AdminSkeleton className="h-3 w-32 rounded-lg" />
                    <AdminSkeleton className="h-32 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function AdminListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[hsl(var(--admin-surface))] rounded-[2rem] p-6 sm:p-8 border border-[hsl(var(--admin-border))] flex items-center gap-6">
                    <AdminSkeleton className="w-14 h-14 rounded-2xl shrink-0" />
                    <div className="space-y-3 flex-1">
                        <AdminSkeleton className="h-5 w-1/3 rounded-lg" />
                        <AdminSkeleton className="h-3 w-1/4 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}

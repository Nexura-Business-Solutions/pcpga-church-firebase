import { motion } from 'framer-motion';

export const Skeleton = ({ className }) => (
    <div className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}>
        <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
        />
    </div>
);

export const ChurchSkeleton = () => (
    <div className="bg-white/[0.03] rounded-[2.5rem] p-10 border border-white/5">
        <Skeleton className="w-16 h-16 rounded-2xl mb-8" />
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-10" />
        <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="mt-12 flex gap-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
    </div>
);

export const SermonSkeleton = () => (
    <div className="bg-white/[0.03] rounded-[2.5rem] p-8 border border-white/5">
        <Skeleton className="aspect-video w-full mb-6 rounded-2xl" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-12 w-full rounded-xl" />
    </div>
);

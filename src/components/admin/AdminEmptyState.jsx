import { motion } from 'framer-motion';

export default function AdminEmptyState({
    title = 'No Items Yet',
    description = 'Get started by creating your first entry.',
    icon = '📝',
    actionText = 'Create Entry',
    onAction,
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center w-full"
        >
            <div className="w-full text-center py-20 px-8 bg-[hsl(var(--admin-surface))] rounded-[3rem] border border-dashed border-[hsl(var(--admin-border))] hover:border-[hsl(var(--admin-text))]/10 transition-colors duration-500 group">
                <div className="w-20 h-20 mx-auto bg-[hsl(var(--admin-bg))] rounded-[1.5rem] flex items-center justify-center text-4xl mb-8 shadow-sm border border-[hsl(var(--admin-border))] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {icon}
                </div>
                <h3 className="text-2xl font-bold text-[hsl(var(--admin-text))] mb-4 font-display tracking-tight leading-none group-hover:text-coral transition-colors">
                    {title}
                </h3>
                <p className="text-[hsl(var(--admin-text-dim))] text-sm leading-relaxed mb-10 max-w-sm mx-auto opacity-70">
                    {description}
                </p>
                {onAction && (
                    <button
                        onClick={onAction}
                        className="px-10 py-4 bg-[hsl(var(--admin-text))] text-[hsl(var(--admin-bg))] text-[11px] font-bold tracking-[0.2em] uppercase rounded-2xl hover:bg-coral hover:text-white hover:shadow-2xl hover:shadow-coral/20 transition-all duration-300 active:scale-[0.98]"
                    >
                        + {actionText}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

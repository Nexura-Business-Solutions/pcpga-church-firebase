import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuidedTour({ steps, onComplete, isActive }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [rect, setRect] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const tooltipRef = useRef(null);
    const lastRectRef = useRef(null);
    const requestRef = useRef();

    const updateRect = useCallback(() => {
        if (!isActive || !steps[currentStep]) return;
        const el = document.querySelector(steps[currentStep].selector);
        if (el) {
            const r = el.getBoundingClientRect();

            // Check if rect actually changed significantly to prevent flickering
            const hasChanged = !lastRectRef.current ||
                Math.abs(lastRectRef.current.top - r.top) > 0.5 ||
                Math.abs(lastRectRef.current.left - r.left) > 0.5 ||
                Math.abs(lastRectRef.current.width - r.width) > 0.5 ||
                Math.abs(lastRectRef.current.height - r.height) > 0.5;

            if (hasChanged) {
                const nextRect = {
                    top: r.top,
                    left: r.left,
                    right: r.right,
                    bottom: r.bottom,
                    width: r.width,
                    height: r.height
                };
                setRect(nextRect);
                lastRectRef.current = nextRect;
            }
        }
    }, [isActive, steps, currentStep]);

    const next = useCallback(() => {
        setCurrentStep((s) => {
            if (s < steps.length - 1) return s + 1;
            onComplete();
            return s;
        });
    }, [steps.length, onComplete]);

    const prev = useCallback(() => {
        setCurrentStep((s) => (s > 0 ? s - 1 : s));
    }, []);

    useEffect(() => {
        if (isActive) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset tour position when deactivated
        setCurrentStep(0);
    }, [isActive]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();

        if (!isActive) {
            document.body.style.overflow = 'unset';
            return;
        }

        document.body.style.overflow = 'hidden';
        const animate = () => {
            updateRect();
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);

        window.addEventListener('resize', checkMobile);
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onComplete();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(requestRef.current);
            document.body.style.overflow = 'unset';
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, updateRect, onComplete, next, prev]);

    // Independent scroll effect to avoid interrupting the animation loop
    useEffect(() => {
        if (!isActive || !steps[currentStep]) return;
        const el = document.querySelector(steps[currentStep].selector);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isActive, currentStep, steps]);

    if (!isActive || !steps[currentStep]) return null;

    const calculatePosition = () => {
        if (!rect) return { placement: 'bottom' };

        const spacing = 24;
        const screenMargin = 20;
        const footerSafety = 160;
        const estimatedTooltipH = 340;

        const tooltipW = Math.min(380, window.innerWidth - (screenMargin * 2));

        if (isMobile) {
            return {
                bottom: screenMargin + 40,
                left: screenMargin,
                placement: 'fixed-bottom',
                width: tooltipW
            };
        }

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        let style = { width: tooltipW };
        let placement;

        const needsFlipping = spaceBelow < (estimatedTooltipH + footerSafety);
        const canFlipToTop = spaceAbove > (estimatedTooltipH + spacing);

        if (needsFlipping && canFlipToTop) {
            placement = 'top';
            style.bottom = (window.innerHeight - rect.top) + spacing;
        }
        else if (needsFlipping && !canFlipToTop) {
            placement = 'overlay';
            style.bottom = footerSafety;
        }
        else {
            placement = 'bottom';
            style.top = rect.bottom + spacing;
        }

        let left = rect.left + (rect.width / 2) - (tooltipW / 2);
        left = Math.max(screenMargin, Math.min(window.innerWidth - tooltipW - screenMargin, left));
        style.left = left;

        return { ...style, placement };
    };

    const pos = calculatePosition();

    return (
        <div className="fixed inset-0 z-[1000] pointer-events-none font-sans overflow-hidden">
            <motion.div
                className="absolute inset-0 bg-[hsl(17_47%_10%)]/90 backdrop-blur-[12px] pointer-events-auto"
                style={{ willChange: 'clip-path' }}
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 1,
                    clipPath: rect ? `polygon(
                        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                        ${rect.left - 18}px 0%,
                        ${rect.left - 18}px ${rect.bottom + 18}px,
                        ${rect.right + 18}px ${rect.bottom + 18}px,
                        ${rect.right + 18}px ${rect.top - 18}px,
                        ${rect.left - 18}px ${rect.top - 18}px,
                        ${rect.left - 18}px 0%
                    )` : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%)'
                }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    ref={tooltipRef}
                    initial={isMobile ? { y: 100, opacity: 0 } : { opacity: 0, scale: 0.9, y: 30 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        transition: { type: 'spring', damping: 25, stiffness: 200 }
                    }}
                    exit={isMobile ? { y: 100, opacity: 0 } : { opacity: 0, scale: 0.9, y: 15 }}
                    className="absolute bg-[hsl(var(--admin-surface))]/95 backdrop-blur-3xl p-8 md:p-10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] pointer-events-auto border border-[hsl(var(--admin-border))] w-full max-h-[85vh] overflow-y-auto"
                    style={{
                        top: pos.top,
                        bottom: pos.bottom,
                        left: pos.left,
                        maxWidth: pos.width
                    }}
                >
                    {!isMobile && pos.placement !== 'overlay' && (
                        <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[16px] border-x-transparent ${pos.placement === 'bottom'
                            ? 'bottom-full border-b-[16px] border-b-[hsl(var(--admin-surface))]'
                            : 'top-full border-t-[16px] border-t-[hsl(var(--admin-surface))]'
                            }`} />
                    )}

                    <div className="flex items-start gap-6 mb-8">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-accent flex shrink-0 items-center justify-center text-white font-black text-2xl shadow-2xl shadow-accent/50 ring-[10px] ring-accent/10">
                            {currentStep + 1}
                        </div>
                        <div className="min-w-0 pt-2">
                            <h4 className="font-black text-[hsl(var(--admin-text))] text-2xl md:text-3xl tracking-tighter leading-none mb-2 truncate">{steps[currentStep].title}</h4>
                            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-accent/50 leading-none">STEP {currentStep + 1} • {steps.length}</p>
                        </div>
                    </div>

                    <p className="text-[16px] md:text-[17px] text-[hsl(var(--admin-text-dim))] mb-12 leading-relaxed font-bold opacity-100 antialiased">
                        {steps[currentStep].message}
                    </p>

                    <div className="flex items-center justify-between pt-8 border-t border-[hsl(var(--admin-border))]">
                        <div className="flex gap-3">
                            <button
                                onClick={prev}
                                disabled={currentStep === 0}
                                className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-[hsl(var(--admin-text-dim))] hover:bg-[hsl(var(--admin-text))]/5 transition-all disabled:opacity-20"
                            >
                                PREV
                            </button>
                            <button
                                onClick={onComplete}
                                className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] text-red-500/70 hover:text-red-600 hover:bg-red-50 transition-all font-display"
                            >
                                EXIT
                            </button>
                        </div>
                        <button
                            onClick={next}
                            className="px-10 md:px-14 py-5 md:py-6 bg-accent text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.05] active:scale-[0.98] transition-all ring-4 ring-accent/10"
                        >
                            {currentStep === steps.length - 1 ? 'FINISH' : 'NEXT'}
                        </button>
                    </div>

                    <div className="absolute top-0 left-0 right-0 px-12 flex gap-3 transform -translate-y-1/2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 flex-1 rounded-full transition-all duration-1000 ${i <= currentStep ? 'bg-accent shadow-[0_0_20px_rgba(var(--accent-rgb),1)]' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {isMobile && rect && (rect.top < 0 || rect.bottom > window.innerHeight) && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 bg-accent/95 backdrop-blur-3xl px-12 py-5 rounded-full text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_40px_80px_rgba(0,0,0,0.6)] z-[1001] border border-white/30"
                >
                    SCROLL TO VIEW TARGET ✦
                </motion.div>
            )}
        </div>
    );
}

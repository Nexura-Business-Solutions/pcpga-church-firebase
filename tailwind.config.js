/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                accent: 'hsl(var(--accent))',
                'accent-soft': 'hsl(var(--accent-soft))',
                violet: 'hsl(var(--violet))',
                'violet-soft': 'hsl(var(--violet-soft))',
                'violet-light': 'hsl(var(--violet) / 0.7)',
                coral: 'hsl(var(--coral))',
                gold: 'hsl(var(--gold))',
                teal: 'hsl(var(--teal))',
                sky: 'hsl(var(--accent) / 0.6)',
                emerald: '#10b981',
                'church-dark': 'hsl(var(--text))',
                'church-gray': 'hsl(var(--text-secondary))',
                'church-light': 'hsl(var(--surface))',
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
                // Display = editorial serif (Fraunces). Falls through to system serifs if it fails to load.
                display: ['var(--font-fraunces)', 'Fraunces', 'ui-serif', 'Georgia', 'serif'],
                // Sans display kept available for places we still want a sans (e.g. eyebrow labels).
                'display-sans': ['var(--font-outfit)', 'Outfit', 'sans-serif'],
            },
            fontSize: {
                'hero': ['clamp(3rem, 7vw, 7rem)', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '800' }],
                'hero-sub': ['clamp(1.125rem, 2.5vw, 1.5rem)', { lineHeight: '1.5', fontWeight: '400' }],
                'section-title': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
                'section-sub': ['clamp(1.1rem, 2vw, 1.25rem)', { lineHeight: '1.6', fontWeight: '400' }],
            },
            animation: {
                'fade-in': 'fadeIn 1s ease-out forwards',
                'slide-up': 'slideUp 1s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite linear',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
};

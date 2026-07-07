/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1A1A1A',
        amber: '#C8963E',
        offwhite: '#FAFAFA',
        // Womena brand palette
        'womena-olive': '#AAA967',
        'womena-terra': '#94523E',
        'womena-cream': '#EFECBD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Womena typography
        'womena-serif': ['Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
        'womena-mono': ['Share Tech Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'womena-marquee': 'marquee 18s linear infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

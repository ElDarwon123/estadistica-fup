/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f5f5',
        paper: '#ffffff',
        'surface-alt': '#fafafa',
        ink: '#0a0a0a',
        'ink-soft': '#171717',
        'mid-gray': '#737373',
        hairline: '#e5e5e5',
        ember: '#e7000b',
      },
      fontFamily: {
        geist: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        cards: '24px',
        buttons: '18px',
        inputs: '18px',
        badges: '18px',
        nested: '10px',
        small: '6px',
      },
      boxShadow: {
        subtle: '0 0 0 1px rgba(23,23,23,0.05), 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        'subtle-2': '0 0 0 0 rgba(0,0,0,0)',
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.025em',
        display: '-2.4px',
      },
    },
  },
  plugins: [],
};

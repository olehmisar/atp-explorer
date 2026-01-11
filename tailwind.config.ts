import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Aztec Brand Colors
        parchment: '#F2EEE1',
        ink: '#1A1400',
        chartreuse: '#D4FF28',
        orchid: '#FF2DF4',
        aqua: '#2BFAE9',
        vermillion: '#FF1A1A',
        malachite: '#001F18',
        aubergine: '#2E0026',
        lapis: '#00122E',
        oxblood: '#2E0700',
      },
      fontFamily: {
        serif: ['Martel', 'serif'],
        mono: ['Geist Mono', 'monospace'],
        display: ['Workbench', 'cursive'],
        body: ['Geist Standard', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

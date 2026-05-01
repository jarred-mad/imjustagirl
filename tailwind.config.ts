import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1C3828',
          deep: '#2E5240',
        },
        blush: '#C9907A',
        cream: '#F0EAD9',
        rose: '#D96B8A',
        ivory: '#FAF7F2',
        mink: '#8B7B74',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'forest-texture': "url('/forest-bg.jpg')",
      },
    },
  },
  plugins: [],
}

export default config

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
        brand: {
          yellow: '#EAB308',
          'yellow-light': '#FEF08A',
          'yellow-dark': '#A16207',
          dark: '#111111',
          'dark-2': '#1C1C1C',
          'dark-3': '#2D2D2D',
          gray: '#F4F4F5',
          'gray-2': '#E4E4E7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
      },
      backgroundImage: {
        'page-gradient': 'linear-gradient(135deg, #f5f5f0 0%, #ebebeb 50%, #f0ede5 100%)',
      },
    },
  },
  plugins: [],
}
export default config

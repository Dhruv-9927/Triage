import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F4EFE6',
          300: '#EBE4D8',
          400: '#DED5C5',
          500: '#C7BBA6',
        },
        espresso: {
          DEFAULT: '#4A2E1B',
          dark: '#382011',
          light: '#5C3822',
          muted: '#7A5438',
        },
        terracotta: {
          DEFAULT: '#C86D51',
          dark: '#A9543A',
          light: '#E89278',
        },
        stone: {
          50: '#FAF9F6',
          100: '#F5F3EF',
          200: '#E8E4DC',
          300: '#D6D0C4',
          400: '#9E978B',
          500: '#6B6358',
          600: '#4A433A',
          700: '#38322B',
          800: '#2B2620',
          900: '#1A1714',
        },
        primary: {
          DEFAULT: '#4A2E1B',
          dark: '#382011',
          light: '#5C3822',
          muted: '#7A5438',
        },
        secondary: {
          DEFAULT: '#C86D51',
          dark: '#A9543A',
          light: '#E89278',
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
        emergency: '#DC2626',
        urgent: '#C86D51',
        routine: '#5C7C8A',
        selfcare: '#4A7C59',
      },
      fontFamily: {
        serif: ['Lora', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(43, 38, 32, 0.04), 0 1px 2px rgba(43, 38, 32, 0.02)',
        'warm-md': '0 4px 12px rgba(43, 38, 32, 0.06), 0 1px 3px rgba(43, 38, 32, 0.03)',
        'warm-lg': '0 10px 25px -3px rgba(43, 38, 32, 0.08), 0 4px 6px -2px rgba(43, 38, 32, 0.04)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
} satisfies Config

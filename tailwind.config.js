/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          'green-dark': '#059669',
          'green-light': '#34D399',
        },
        accent: {
          orange: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
        },
        bg: {
          primary: '#F8FAFC',
          secondary: '#FFFFFF',
          tertiary: '#F1F5F9',
        },
        text: {
          primary: '#1E293B',
          secondary: '#475569',
          muted: '#64748B',
        },
        border: {
          light: '#E2E8F0',
          medium: '#CBD5E1',
          dark: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      transitionTimingFunction: {
        'fast': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'normal': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
      }
    },
  },
  plugins: [],
}
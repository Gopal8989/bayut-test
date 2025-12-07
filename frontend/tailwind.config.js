/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A86B',
          dark: '#008A5A',
          light: '#E6F5F0',
          lighter: '#F0F9F6',
        },
        secondary: {
          DEFAULT: '#FF6B6B',
          dark: '#E55555',
          light: '#FFE5E5',
        },
        accent: {
          DEFAULT: '#4A90E2',
          dark: '#357ABD',
          light: '#E8F2FC',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00A86B 0%, #008A5A 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FF6B6B 0%, #E55555 100%)',
        'gradient-accent': 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
      },
    },
  },
  plugins: [],
}


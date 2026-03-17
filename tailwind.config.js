/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#13ec80',
        'branch-accent': '#22c55e',
        'bg-deep': '#0a0a0a',
        'bg-mid': '#0f0f0f',
        'surface': '#1a1a1a',
        'surface-card': '#1b1b1b',
        'border-subtle': '#2a2a2a',
        'border-card': '#2d2d2d',
      },
      animation: {
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-bg-color)',
          text: 'var(--tg-text-color)',
          hint: 'var(--tg-hint-color)',
          button: 'var(--tg-button-color)',
          buttonText: 'var(--tg-button-text-color)',
          secondaryBg: 'var(--tg-secondary-bg-color)',
          destructive: 'var(--tg-destructive-text-color)',
          link: 'var(--tg-link-color)'
        }
      },
      borderRadius: {
        xl2: '1rem'
      }
    }
  },
  plugins: []
} satisfies Config;

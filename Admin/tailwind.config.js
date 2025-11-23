/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#882222',      // Main red from gradient
        secondary: '#35060e',    // Dark red from gradient
        accent: '#fff200',       // Yellow accent from navbar
        danger: '#ff2010',       // Error/danger red
        dark: '#000000',         // Pure black
        light: '#ffffff',        // Pure white
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      keyframes: {
        slideIn: {
          '0%': { 
            transform: 'translateY(4rem)',
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1' 
          }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        rotate360: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        scaleIn: {
          '0%': { 
            transform: 'scale(0.9)',
            opacity: '0' 
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1' 
          }
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 5px #fff200, 0 0 10px #fff200, 0 0 15px #fff200'
          },
          '50%': { 
            boxShadow: '0 0 10px #fff200, 0 0 20px #fff200, 0 0 30px #fff200'
          },
          '100%': { 
            boxShadow: '0 0 5px #fff200, 0 0 10px #fff200, 0 0 15px #fff200'
          }
        }
      },
      animation: {
        'slide-in': 'slideIn 0.5s ease-out forwards',
        'fade-in': 'fadeIn 1s ease-out',
        'rotate-360': 'rotate360 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite'
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: Tells Tailwind where to look for your utility classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scans your React components
  ],
  theme: {
    // Extend the default theme to add our custom fonts
    extend: {
      fontFamily: {
        // 'sans' will be the primary font, set to Inter
        sans: ['Inter', 'sans-serif'],
        // 'mono' for the bold, digital Neobrutalist aesthetic
        mono: ['Space Mono', 'monospace'],
      },
      // Adding custom sizing for the game container to ensure consistency
      spacing: {
        'game-width': '400px',
      },
      // Custom border thickness for the strong Neobrutalist borders
      borderWidth: {
        '6': '6px', // Used for main elements in App.jsx
      },
    },
  },
  plugins: [],
}
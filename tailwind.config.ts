import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // African-inspired colors
        sunset: {
          DEFAULT: "hsl(var(--sunset))",
          foreground: "hsl(var(--sunset-foreground))",
        },
        sahara: {
          DEFAULT: "hsl(var(--sahara))",
          foreground: "hsl(var(--sahara-foreground))",
        },
        savanna: {
          DEFAULT: "hsl(var(--savanna))",
          foreground: "hsl(var(--savanna-foreground))",
        },
        terracotta: {
          DEFAULT: "hsl(var(--terracotta))",
          foreground: "hsl(var(--terracotta-foreground))",
        },
        // Priority colors
        "priority-p1": {
          DEFAULT: "hsl(var(--priority-p1))",
          foreground: "hsl(var(--priority-p1-foreground))",
        },
        "priority-p2": {
          DEFAULT: "hsl(var(--priority-p2))",
          foreground: "hsl(var(--priority-p2-foreground))",
        },
        "priority-p3": {
          DEFAULT: "hsl(var(--priority-p3))",
          foreground: "hsl(var(--priority-p3-foreground))",
        },
        "priority-p4": {
          DEFAULT: "hsl(var(--priority-p4))",
          foreground: "hsl(var(--priority-p4-foreground))",
        },
        // Tier colors
        "tier-1": "hsl(var(--tier-1))",
        "tier-2": "hsl(var(--tier-2))",
        "tier-3": "hsl(var(--tier-3))",
        // Sidebar
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Chart colors
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Noto Sans", "Noto Sans Arabic", "Noto Sans Ethiopic", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px hsl(var(--priority-p1) / 0.5), 0 0 20px hsl(var(--priority-p1) / 0.3)",
          },
          "50%": {
            boxShadow: "0 0 10px hsl(var(--priority-p1) / 0.8), 0 0 30px hsl(var(--priority-p1) / 0.5)",
          },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

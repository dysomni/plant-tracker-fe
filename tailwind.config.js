import { heroui } from "@heroui/theme";

const colors = {
  green: {
    50: "#f3f9ec",
    100: "#e6f2d9",
    200: "#cbe4b2",
    300: "#a9d284",
    400: "#8abe5d",
    500: "#6ca33f",
    600: "#52812f",
    700: "#416328",
    800: "#365024",
    900: "#304522",
    950: "#16250e",
  },
  neutral: {
    50: "#f3f4f1",
    100: "#e5e7e0",
    200: "#cdd2c4",
    300: "#adb5a1",
    400: "#909a81",
    500: "#737e64",
    600: "#59634d",
    700: "#42493a",
    800: "#3b4034",
    900: "#34382f",
    950: "#1a1c17",
  },
  blue: {
    50: "#f2f8f9",
    100: "#deebef",
    200: "#c1d9e0",
    300: "#96beca",
    400: "#649bac",
    500: "#487e91",
    600: "#3f697b",
    700: "#385766",
    800: "#344a56",
    900: "#2f404a",
    950: "#1b2831",
  },
  purple: {
    50: "#f3f5fa",
    100: "#e9ecf6",
    200: "#d8dced",
    300: "#bfc4e2",
    400: "#a5a8d4",
    500: "#9999cc",
    600: "#7a76b5",
    700: "#69649e",
    800: "#565380",
    900: "#494768",
    950: "#2b293d",
  },
  brown: {
    50: "#f6f4ef",
    100: "#ebe7dc",
    200: "#d9d3bd",
    300: "#c1b795",
    400: "#a99e72",
    500: "#8d8255",
    600: "#6f6741",
    700: "#615b3b",
    800: "#46422e",
    900: "#3d3b2a",
    950: "#201e13",
  },
  orange: {
    50: "#faf6ec",
    100: "#f3e9ce",
    200: "#e9d29f",
    300: "#ddb367",
    400: "#d1983e",
    500: "#c28230",
    600: "#aa6728",
    700: "#864a22",
    800: "#703d23",
    900: "#603423",
    950: "#371a11",
  },
  red: {
    50: "#fef3ee",
    100: "#fde4d7",
    200: "#fac5ae",
    300: "#f79d7a",
    400: "#f26a44",
    500: "#ee4521",
    600: "#e02c16",
    700: "#b91f15",
    800: "#941a18",
    900: "#771917",
    950: "#400a0b",
  },
};

const invertColors = (color) => {
  // make it so that 950 == 50, 900 == 100, etc
  const inverted = {};
  Object.keys(color).forEach((key) => {
    const invertedKey = 1000 - parseInt(key);
    inverted[invertedKey] = color[key];
  });
  return inverted;
};

const applyDefaultAndForeground = (
  color,
  the_default = 500,
  foreground = 950,
) => {
  return {
    DEFAULT: color[the_default],
    foreground: color[foreground],
    ...color,
  };
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          extend: "light",
          colors: {
            primary: applyDefaultAndForeground(colors.green, 500),
            secondary: applyDefaultAndForeground(colors.blue),
            success: applyDefaultAndForeground(colors.purple),
            warning: applyDefaultAndForeground(colors.orange),
            danger: applyDefaultAndForeground(colors.red, 400),
            default: applyDefaultAndForeground(colors.neutral, 100),
          },
        },
        dark: {
          extend: "dark",
          colors: {
            background: applyDefaultAndForeground(
              invertColors(colors.neutral),
              50,
            ),
            foreground: applyDefaultAndForeground(
              invertColors(colors.neutral),
              950,
            ),
            content3: applyDefaultAndForeground(
              invertColors(colors.neutral),
              200,
            ),
            content1: applyDefaultAndForeground(
              invertColors(colors.neutral),
              50,
            ),
            primary: applyDefaultAndForeground(invertColors(colors.green), 500),
            secondary: applyDefaultAndForeground(invertColors(colors.blue)),
            success: applyDefaultAndForeground(invertColors(colors.purple)),
            warning: applyDefaultAndForeground(invertColors(colors.orange)),
            danger: applyDefaultAndForeground(invertColors(colors.red)),
            default: applyDefaultAndForeground(
              invertColors(colors.neutral),
              300,
            ),
          },
        },
      },
    }),
  ],
};

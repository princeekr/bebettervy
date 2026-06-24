import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: any) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}

const ThemeContext = createContext({});

export const useTheme = () => {
  return useContext(ThemeContext);
};

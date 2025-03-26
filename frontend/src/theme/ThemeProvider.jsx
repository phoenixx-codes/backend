import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';

// Create context for theme mode
const ThemeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light'
});

// Hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Check if user prefers dark mode
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // State to track theme mode
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');
  
  // Toggle function for theme
  const toggleColorMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };
  
  // Create theme based on mode
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        primary: {
          main: '#2196f3',
          light: '#64b5f6',
          dark: '#1976d2',
          contrastText: '#fff',
        },
        secondary: {
          main: '#3f51b5',
          light: '#7986cb',
          dark: '#303f9f',
          contrastText: '#fff',
        },
        success: {
          main: '#4caf50',
          light: '#81c784',
          dark: '#388e3c',
        },
        background: {
          default: mode === 'light' ? '#f5f5f5' : '#121212',
          paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
      },
      shape: {
        borderRadius: 8,
      },
      typography: {
        fontFamily: [
          'Roboto',
          'Arial',
          'sans-serif',
        ].join(','),
        h1: {
          fontWeight: 700,
        },
        h2: {
          fontWeight: 700,
        },
        h4: {
          fontWeight: 600,
        },
        button: {
          fontWeight: 500,
        },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
              padding: '8px 16px',
            },
            contained: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: mode === 'light' 
                ? '0px 4px 20px rgba(0, 0, 0, 0.05)'
                : '0px 4px 20px rgba(0, 0, 0, 0.15)',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            rounded: {
              borderRadius: 16,
            },
          },
        },
      },
    }),
    [mode]
  );
  
  const contextValue = useMemo(() => ({
    toggleColorMode,
    mode
  }), [mode]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

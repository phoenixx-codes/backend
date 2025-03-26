import React from 'react';
import { 
  AppBar as MuiAppBar, 
  Toolbar, 
  Typography, 
  Box, 
  useTheme, 
  Container, 
  Button 
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

const AppBar = () => {
  const theme = useTheme();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <MuiAppBar 
      position="static" 
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(18, 18, 18, 0.8)',
        backdropFilter: 'blur(20px)',
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1 }}>
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <HowToVoteIcon 
              sx={{ 
                mr: 1.5, 
                fontSize: 32,
                color: 'primary.main' 
              }} 
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}
            >
              Secure Voting System
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              component={RouterLink} 
              to="/" 
              color={isActive('/') ? 'primary' : 'inherit'}
              sx={{ 
                mx: 1,
                fontWeight: isActive('/') ? 600 : 400
              }}
            >
              Home
            </Button>
            
            <Button 
              component={RouterLink} 
              to="/about" 
              color={isActive('/about') ? 'primary' : 'inherit'}
              sx={{ 
                mx: 1,
                fontWeight: isActive('/about') ? 600 : 400
              }}
            >
              About
            </Button>
            
            <ThemeToggle sx={{ ml: 1 }} />
          </Box>
        </Toolbar>
      </Container>
    </MuiAppBar>
  );
};

export default AppBar;

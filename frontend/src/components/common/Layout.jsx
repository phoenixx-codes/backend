import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Container, 
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { 
  Brightness4, 
  Brightness7,
  Menu as MenuIcon,
  Home as HomeIcon,
  HowToVote as VoteIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { isAdminLoggedIn, isVoterLoggedIn, logout } from '../../services/authService';

const Layout = ({ children, toggleDarkMode, darkMode }) => {
  const theme = useTheme();
  const location = useLocation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  
  const isAdmin = isAdminLoggedIn();
  const isVoter = isVoterLoggedIn();
  const isLoggedIn = isAdmin || isVoter;

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const navItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    ...(isAdmin 
      ? [{ text: 'Admin Dashboard', icon: <AdminIcon />, path: '/admin/dashboard' }] 
      : []),
    ...(isVoter 
      ? [{ text: 'Voter Dashboard', icon: <VoteIcon />, path: '/user/dashboard' }] 
      : []),
    ...(!isLoggedIn 
      ? [
          { text: 'Voter Login', icon: <VoteIcon />, path: '/user/login' },
          { text: 'Admin Login', icon: <AdminIcon />, path: '/admin/login' }
        ] 
      : [])
  ];

  const renderDrawer = (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={toggleDrawer}
      sx={{
        '& .MuiDrawer-paper': { 
          width: 280,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Typography variant="h6" component="div">
          Secure Voting
        </Typography>
        <IconButton onClick={toggleDrawer}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
            selected={location.pathname === item.path}
            onClick={toggleDrawer}
            sx={{
              '&.Mui-selected': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-selected:hover': {
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : 'rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        {isLoggedIn && (
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          {isSmallScreen && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component={RouterLink} 
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 700,
              letterSpacing: '-0.5px'
            }}
          >
            Secure Voting System
          </Typography>
          
          {!isSmallScreen && (
            <Box sx={{ display: 'flex', mx: 2 }}>
              {navItems.map((item) => (
                <Button 
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  color="inherit"
                  sx={{ mx: 1 }}
                >
                  {item.text}
                </Button>
              ))}
              {isLoggedIn && (
                <Button 
                  color="inherit"
                  onClick={handleLogout}
                  sx={{ mx: 1 }}
                >
                  Logout
                </Button>
              )}
            </Box>
          )}
          
          <IconButton onClick={toggleDarkMode} color="inherit">
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {renderDrawer}
      
      <Container 
        component="main" 
        sx={{ 
          mt: { xs: 2, sm: 4 }, 
          mb: 4, 
          flex: 1, 
          maxWidth: {
            xs: '100%',
            sm: '100%',
            md: '1200px',
            lg: '1400px',
          }
        }}
      >
        {children}
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          {new Date().getFullYear()} Secure Voting System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;

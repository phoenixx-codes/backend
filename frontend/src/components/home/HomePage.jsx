import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Stack,
  useTheme
} from '@mui/material';
import { 
  HowToVote as VoteIcon, 
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  TimerOutlined as TimerIcon,
  FaceOutlined as FaceIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ darkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <SecurityIcon fontSize="large" color="primary" />,
      title: 'Secure',
      description: 'End-to-end encryption and biometric verification for maximum security'
    },
    {
      icon: <FaceIcon fontSize="large" color="primary" />,
      title: 'Facial Recognition',
      description: 'Advanced facial recognition ensures only authorized voters can access the system'
    },
    {
      icon: <SpeedIcon fontSize="large" color="primary" />,
      title: 'Fast & Efficient',
      description: 'Quick voting process with real-time results and analytics'
    },
    {
      icon: <TimerIcon fontSize="large" color="primary" />,
      title: 'Time-Saving',
      description: 'No more waiting in long lines - vote securely from anywhere'
    }
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)',
          borderRadius: { xs: 0, md: 4 },
          overflow: 'hidden',
          mb: 6,
          py: { xs: 6, md: 10 },
          mt: { xs: 2, md: 0 },
        }}
      >
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800, 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(90deg, #3b82f6 0%, #ec4899 100%)' 
                    : 'linear-gradient(90deg, #1d4ed8 0%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Secure Voting System
              </Typography>
              <Typography 
                variant="h5" 
                color="textSecondary" 
                paragraph
                sx={{ 
                  mb: 4,
                  maxWidth: '90%' 
                }}
              >
                A modern platform for secure and transparent elections with advanced biometric verification
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  startIcon={<VoteIcon />}
                  onClick={() => navigate('/user/login')}
                  sx={{ py: 1.5, px: 3, fontWeight: 600 }}
                >
                  Voter Login
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<AdminIcon />}
                  onClick={() => navigate('/admin/login')}
                  sx={{ py: 1.5, px: 3, fontWeight: 600 }}
                >
                  Admin Login
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component="img"
                src={darkMode 
                  ? "https://cdn.pixabay.com/photo/2018/10/28/16/11/vote-3779580_1280.png"
                  : "https://cdn.pixabay.com/photo/2016/10/14/15/21/vote-1740466_1280.jpg"}
                alt="Voting illustration"
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 2,
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ mb: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            mb: 6
          }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[10],
                  }
                }}
                elevation={2}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(219, 39, 119, 0.1)' : 'rgba(219, 39, 119, 0.05)',
          py: 8,
          borderRadius: { xs: 0, md: 4 },
          mb: 6
        }}
      >
        <Container>
          <Grid container justifyContent="center" textAlign="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h2" gutterBottom fontWeight={700}>
                Ready to experience secure voting?
              </Typography>
              <Typography variant="body1" paragraph color="text.secondary" sx={{ mb: 4 }}>
                Join thousands of organizations that trust our platform for their critical voting needs.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => navigate('/user/login')}
                sx={{ py: 1.5, px: 4, fontWeight: 600 }}
              >
                Get Started
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;

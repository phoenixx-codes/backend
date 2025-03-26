import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Avatar,
  useTheme,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import { 
  HowToVote, 
  CheckCircle, 
  Person, 
  HowToReg,
  Cancel,
  Logout
} from '@mui/icons-material';
import { castVote, getElections, ELECTIONS } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [voter, setVoter] = useState(null);
  const [election, setElection] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndElectionData();
  }, []);

  const loadUserAndElectionData = async () => {
    try {
      setLoading(true);
      
      console.log('Checking for voter data in storage...');
      
      // Check ALL possible storage locations
      let voterData = null;
      let source = 'none';
      
      // Check session storage first
      if (sessionStorage.getItem('currentVoter')) {
        voterData = sessionStorage.getItem('currentVoter');
        source = 'sessionStorage.currentVoter';
      } else if (sessionStorage.getItem('voterData')) {
        voterData = sessionStorage.getItem('voterData');
        source = 'sessionStorage.voterData';
      } 
      // Then check localStorage as fallback
      else if (localStorage.getItem('voter')) {
        voterData = localStorage.getItem('voter');
        source = 'localStorage.voter';
      } else if (localStorage.getItem('currentUser')) {
        voterData = localStorage.getItem('currentUser');
        source = 'localStorage.currentUser';
      }
      
      console.log('Found voter data in:', source);
      
      if (voterData) {
        try {
          const parsedVoter = JSON.parse(voterData);
          console.log('Parsed voter data:', parsedVoter);
          setVoter(parsedVoter);
          
          // Check if voter already voted
          if (parsedVoter.voted || parsedVoter.hasVoted) {
            setUserVote({
              timestamp: new Date().toISOString(),
              candidateId: 'unknown' // In a real app, we would store which candidate they voted for
            });
          }
        } catch (parseError) {
          console.error('Error parsing voter data:', parseError);
          // Don't redirect, just show an error
          setError('Error loading voter data. Please try logging in again.');
        }
      } else {
        // If no voter is logged in, redirect to login
        console.error('No voter data found in any storage location');
        window.location.href = '/user/login'; // Redirect to login page instead of home
        return;
      }
      
      // Get election data
      const elections = await getElections();
      if (elections && elections.length > 0) {
        const currentElection = elections[0]; // Just use the first election
        setElection(currentElection);
        setCandidates(currentElection.candidates);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error loading voting data. Please try again.');
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      setLoading(true);
      
      if (!voter || !selectedCandidate) {
        throw new Error('Unable to process vote. Please try again.');
      }
      
      // Cast vote
      await castVote(voter.id, election.id, selectedCandidate.id);
      
      // Update local state
      setUserVote({
        candidateId: selectedCandidate.id,
        timestamp: new Date().toISOString()
      });
      
      // Update the voter object to reflect they've voted
      const updatedVoter = { ...voter, voted: true };
      localStorage.setItem('voter', JSON.stringify(updatedVoter));
      setVoter(updatedVoter);
      
      // Update candidate vote count in the UI (in a real app this would happen server-side)
      const updatedCandidates = candidates.map(c => {
        if (c.id === selectedCandidate.id) {
          return { ...c, votes: c.votes + 1 };
        }
        return c;
      });
      setCandidates(updatedCandidates);
      
      setSuccess('Your vote has been recorded successfully!');
      setOpenDialog(false);
      setLoading(false);
    } catch (error) {
      console.error('Error recording vote:', error);
      setError(error.message || 'Error recording your vote. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear all voter-related session storage
    sessionStorage.removeItem('currentVoter');
    sessionStorage.removeItem('voterData');
    localStorage.removeItem('voter');
    localStorage.removeItem('currentUser');
    
    // Display success message briefly
    setSuccess('Logged out successfully');
    
    // Redirect to home page
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  if (loading && !candidates.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, maxWidth: 1200, mx: 'auto' }}>
        {/* Header section with voter info and logout button */}
        <Box display="flex" 
             flexDirection={{ xs: 'column', sm: 'row' }} 
             justifyContent="space-between" 
             alignItems={{ xs: 'flex-start', sm: 'center' }} 
             mb={3}
             gap={2}
        >
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
              <Person />
            </Avatar>
            <Typography variant="h5" component="h1">
              Voter Dashboard
              {voter && (
                <Typography variant="subtitle1" color="text.secondary">
                  Welcome, {voter.name}
                </Typography>
              )}
            </Typography>
          </Box>
          
          {/* Logout button */}
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<Logout />}
            onClick={handleLogout}
            fullWidth={{ xs: true, sm: false }}
          >
            Logout
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

        <Card sx={{ mb: 4, overflow: 'visible' }}>
          <CardContent>
            <Typography variant="h4" gutterBottom fontWeight={700} fontSize={{ xs: '1.5rem', sm: '2rem', md: '2.125rem' }}>
              Voter Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to the Secure Voting System. Your vote matters!
            </Typography>
          </CardContent>
        </Card>

        {voter && (
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 2
            }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 }
                }}
              >
                <Person fontSize="large" />
              </Avatar>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, mt: { xs: 1, sm: 0 } }}>
                <Typography variant="h6" fontWeight={600}>
                  {voter.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {voter.idNumber}
                </Typography>
                <Chip 
                  size="small" 
                  color={voter.voted ? 'success' : 'primary'}
                  label={voter.voted ? 'Voted' : 'Ready to Vote'}
                  icon={voter.voted ? <CheckCircle fontSize="small" /> : <HowToReg fontSize="small" />}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          </Paper>
        )}

        {election && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom fontSize={{ xs: '1.25rem', sm: '1.5rem' }}>
              {election.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Election period: {election.startDate} to {election.endDate}
            </Typography>
          </Box>
        )}

        {userVote ? (
          <Card sx={{ mb: 3, borderRadius: 2 }} elevation={4}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                mb: 2,
                gap: 1
              }}>
                <CheckCircle color="success" sx={{ mr: { xs: 0, sm: 2 }, mb: { xs: 1, sm: 0 } }} />
                <Typography variant="h6" color="primary" fontWeight={600} textAlign={{ xs: 'center', sm: 'left' }}>
                  Your Vote Has Been Recorded
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography>
                You have voted for: {selectedCandidate?.name || candidates.find(c => c.id === userVote.candidateId)?.name || 'Unknown Candidate'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Vote cast on: {new Date(userVote.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                Thank you for participating in the democratic process!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Select a Candidate to Vote:
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {candidates.map((candidate) => (
                <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                  <Paper
                    elevation={3}
                    sx={{
                      cursor: 'pointer',
                      p: { xs: 2, sm: 3 },
                      height: '100%',
                      borderRadius: 2,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { 
                        transform: 'translateY(-5px)',
                        boxShadow: theme.shadows[8] 
                      }
                    }}
                    onClick={() => {
                      if (voter && !voter.voted) {
                        setSelectedCandidate(candidate);
                        setOpenDialog(true);
                      } else if (voter && voter.voted) {
                        setError("You have already cast your vote.");
                      } else {
                        setError("You must be logged in to vote.");
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Avatar 
                        sx={{ 
                          alignSelf: 'center',
                          width: { xs: 48, sm: 80 },
                          height: { xs: 48, sm: 80 },
                          mb: 2,
                          bgcolor: theme.palette.primary.light
                        }}
                      >
                        {candidate.name.charAt(0)}
                      </Avatar>
                      <Typography variant="h6" align="center" gutterBottom>
                        {candidate.name}
                      </Typography>
                      <Typography variant="body1" align="center" color="text.secondary" gutterBottom>
                        {candidate.party}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                        <Button 
                          variant="outlined" 
                          color="primary"
                          startIcon={<HowToVote />}
                          disabled={voter?.voted}
                        >
                          Vote
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Your Vote</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {selectedCandidate?.name.charAt(0)}
              </Avatar>
              <Typography variant="h6">
                {selectedCandidate?.name}
              </Typography>
            </Box>
            <Typography>
              Are you sure you want to vote for <b>{selectedCandidate?.name}</b> of <b>{selectedCandidate?.party}</b>?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 500 }}>
              This action cannot be undone. Your vote is final once submitted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={() => setOpenDialog(false)} 
              variant="outlined"
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVote} 
              variant="contained" 
              color="primary"
              startIcon={<HowToVote />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Confirm Vote'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default UserDashboard;

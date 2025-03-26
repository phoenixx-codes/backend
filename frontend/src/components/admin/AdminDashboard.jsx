import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Grid,
  Paper,
  Divider,
  Avatar,
  useTheme,
  Chip,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Tooltip,
  AppBar,
  Toolbar,
  DialogContentText
} from '@mui/material';
import { 
  Delete, 
  Add, 
  Person, 
  HowToVote, 
  BarChart, 
  CheckCircle,
  PieChart as PieChartIcon,
  Close as CloseIcon,
  PhotoCamera,
  ExitToApp,
  Refresh,
  PersonOutline,
  UploadFile,
  Image as ImageIcon
} from '@mui/icons-material';
import { VOTERS, ELECTIONS, addVoter, getVoters, logout, removeVoter, resetVotingResults } from '../../services/authService';
import { Camera } from '../common/Camera';

const AdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [openCandidateDialog, setOpenCandidateDialog] = useState(false);
  const [openVoterDialog, setOpenVoterDialog] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', party: '' });
  const [newVoter, setNewVoter] = useState({ name: '', idNumber: '', dateOfBirth: '' });
  const [voters, setVoters] = useState([]);
  const [elections, setElections] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationStep, setRegistrationStep] = useState(0);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const candidateImageInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Load initial data
    loadDashboardData();
  }, []);

  // Initialize camera when dialog opens
  useEffect(() => {
    if (openVoterDialog && registrationStep === 0) {
      // Reset camera state when dialog opens
      setFaceDetected(false);
      setFaceDescriptor(null);
      setCameraError('');
      setCameraInitialized(false);
      
      // Camera will be initialized by the Camera component
    }
  }, [openVoterDialog, registrationStep]);

  const loadDashboardData = () => {
    try {
      // In a real app, this would fetch from the API
      setVoters(VOTERS);
      setElections(ELECTIONS);
      
      // Extract candidates from the first election
      if (ELECTIONS.length > 0) {
        setCandidates(ELECTIONS[0].candidates);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error loading data. Please try again.');
    }
  };

  const handleAddCandidate = () => {
    if (!newCandidate.name || !newCandidate.party) {
      setError('Candidate name and party are required');
      return;
    }

    try {
      // Create a new candidate with id
      const newCandidateWithId = {
        id: Date.now().toString(),
        name: newCandidate.name,
        party: newCandidate.party,
        votes: 0
      };

      // Add the new candidate to the list
      const updatedCandidates = [...candidates, newCandidateWithId];
      setCandidates(updatedCandidates);

      // Update the first election's candidates in local state
      if (ELECTIONS.length > 0) {
        const updatedElections = [...ELECTIONS];
        updatedElections[0].candidates = updatedCandidates;
        
        try {
          // Save to localStorage
          ELECTIONS[0].candidates = updatedCandidates;
          localStorage.setItem('elections', JSON.stringify(ELECTIONS));
          setSuccess('Candidate added successfully');
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
        }
      }

      // Reset form and close dialog
      setNewCandidate({ name: '', party: '' });
      setOpenCandidateDialog(false);
    } catch (error) {
      console.error('Error adding candidate:', error);
      setError('Error adding candidate. Please try again.');
    }
  };

  const handleFaceDetected = (faceData) => {
    if (faceData && faceData.descriptor) {
      setFaceDescriptor(faceData.descriptor);
      setFaceDetected(true);
    } else {
      setFaceDetected(false);
    }
  };

  const handleCaptureFace = () => {
    if (faceDescriptor) {
      // Proceed to next step
      setRegistrationStep(1);
    } else {
      setError('No face detected. Please position your face in the camera view.');
    }
  };

  const handleAddVoter = () => {
    try {
      // Validate input
      if (!newVoter.name || !newVoter.idNumber) {
        setError('Name and ID number are required');
        return;
      }

      if (!faceDescriptor) {
        setError('Face capture is required for voter registration');
        setRegistrationStep(0); // Go back to face capture step
        return;
      }

      // Add the new voter with face descriptor
      const voterWithFace = {
        ...newVoter,
        faceDescriptor: faceDescriptor
      };

      // Add the new voter
      addVoter(voterWithFace)
        .then(addedVoter => {
          // Update local state
          setVoters([...voters, addedVoter]);
          resetVoterRegistration();
          setSuccess('Voter registered successfully with facial recognition!');
        })
        .catch(err => {
          console.error('Error registering voter:', err);
          setError(err.message || 'Error registering voter. Please try again.');
        });
    } catch (error) {
      console.error('Error registering voter:', error);
      setError('Error registering voter. Please try again.');
    }
  };

  const handleRemoveVoter = (voterId) => {
    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      title: 'Remove Voter',
      message: 'Are you sure you want to remove this voter? This action cannot be undone.',
      onConfirm: () => {
        removeVoter(voterId)
          .then(result => {
            // Update the voters list
            setVoters(voters.filter(voter => voter.id !== voterId));
            setSuccess('Voter removed successfully');
            setConfirmDialog({ ...confirmDialog, open: false });
          })
          .catch(error => {
            console.error('Error removing voter:', error);
            setError(`Failed to remove voter: ${error.message}`);
            setConfirmDialog({ ...confirmDialog, open: false });
          });
      }
    });
  };

  const handleResetVotingResults = () => {
    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      title: 'Reset Voting Results',
      message: 'Are you sure you want to reset all voting results? This will allow all voters to vote again. This action cannot be undone.',
      onConfirm: () => {
        resetVotingResults()
          .then(result => {
            // Update local voters list to reflect reset
            const updatedVoters = voters.map(voter => ({
              ...voter,
              hasVoted: false
            }));
            setVoters(updatedVoters);
            
            // Also reset the candidate vote counts in local state
            const updatedCandidates = candidates.map(candidate => ({
              ...candidate,
              votes: 0
            }));
            setCandidates(updatedCandidates);
            
            // Update ELECTIONS in local storage
            if (ELECTIONS.length > 0) {
              ELECTIONS[0].candidates = updatedCandidates;
              localStorage.setItem('elections', JSON.stringify(ELECTIONS));
            }
            
            setSuccess('Voting results reset successfully');
            setConfirmDialog({ ...confirmDialog, open: false });
          })
          .catch(error => {
            console.error('Error resetting results:', error);
            setError(`Failed to reset voting results: ${error.message}`);
            setConfirmDialog({ ...confirmDialog, open: false });
          });
      }
    });
  };

  const resetVoterRegistration = () => {
    setOpenVoterDialog(false);
    setNewVoter({ name: '', idNumber: '', dateOfBirth: '' });
    setRegistrationStep(0);
    setFaceDescriptor(null);
    setFaceDetected(false);
  };

  const handleDialogClose = () => {
    resetVoterRegistration();
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getTotalVotes = () => {
    return candidates.reduce((total, candidate) => total + (candidate.votes || 0), 0);
  };

  const getCompletedVotes = () => {
    return voters.filter(voter => voter.hasVoted).length;
  };

  const getVoterPercentage = () => {
    const votersWhoVoted = getCompletedVotes();
    return voters.length > 0 ? Math.round((votersWhoVoted / voters.length) * 100) : 0;
  };

  // Render the confirm dialog
  const renderConfirmDialog = () => (
    <Dialog
      open={confirmDialog.open}
      onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
    >
      <DialogTitle>{confirmDialog.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{confirmDialog.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} color="primary">
          Cancel
        </Button>
        <Button onClick={confirmDialog.onConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDashboard = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <PersonOutline sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4">{voters.length}</Typography>
            <Typography variant="subtitle1">Registered Voters</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <HowToVote sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4">{getCompletedVotes()}</Typography>
            <Typography variant="subtitle1">Votes Cast</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <PieChartIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4">{getVoterPercentage()}%</Typography>
            <Typography variant="subtitle1">Voter Turnout</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Latest Election Results</Typography>
                <Tooltip title="Reset all voting results">
                  <Button 
                    startIcon={<Refresh />} 
                    variant="outlined" 
                    color="primary"
                    onClick={handleResetVotingResults}
                  >
                    Reset Voting Results
                  </Button>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {candidates.length > 0 ? (
                <Grid container spacing={3}>
                  {candidates.map((candidate) => (
                    <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                      <Paper 
                        sx={{ 
                          p: 3, 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'translateY(-4px)'
                          }
                        }}
                        elevation={3}
                      >
                        <Avatar 
                          sx={{ 
                            width: 80, 
                            height: 80, 
                            mb: 2, 
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem',
                            fontWeight: 'bold' 
                          }}
                        >
                          {candidate.name.charAt(0)}
                        </Avatar>
                        <Typography variant="h6" align="center" gutterBottom>
                          {candidate.name}
                        </Typography>
                        <Chip 
                          label={candidate.party} 
                          color="primary" 
                          size="small" 
                          sx={{ mb: 2, fontWeight: 500 }} 
                        />
                        <Box sx={{ width: '100%', mt: 1, mb: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={getTotalVotes() > 0 ? ((candidate.votes || 0) / getTotalVotes()) * 100 : 0} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              mb: 1
                            }} 
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {candidate.votes || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            votes
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              ml: 1, 
                              fontWeight: 'bold',
                              color: 'text.secondary'
                            }}
                          >
                            ({getTotalVotes() > 0 ? 
                              `${Math.round(((candidate.votes || 0) / getTotalVotes()) * 100)}%` : 
                              '0%'})
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography align="center" sx={{ py: 4 }}>
                  No candidates available. Click "Add Candidate" to add candidates to the election.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderVoters = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Registered Voters</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenVoterDialog(true)}
        >
          Add Voter
        </Button>
      </Box>

      {voters.length > 0 ? (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
          <List>
            {voters.map((voter, index) => (
              <React.Fragment key={voter.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{ cursor: 'pointer' }}
                  onClick={(e) => e.preventDefault()}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveVoter(voter.id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{voter.name}</Typography>
                        {voter.hasVoted && (
                          <Chip 
                            size="small" 
                            color="success" 
                            icon={<CheckCircle />} 
                            label="Voted" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          ID: {voter.idNumber}
                        </Typography>
                        {voter.dateOfBirth && (
                          <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                            DOB: {voter.dateOfBirth}
                          </Typography>
                        )}
                        {voter.faceDescriptor && (
                          <Chip 
                            size="small" 
                            color="primary" 
                            icon={<Person />} 
                            label="Face ID" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No voters registered yet</Typography>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} edge="end">
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleTabChange} centered>
          <Tab icon={<BarChart />} label="Dashboard" />
          <Tab icon={<Person />} label="Voters" />
          <Tab icon={<HowToVote />} label="Elections" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {tab === 0 && renderDashboard()}
      {tab === 1 && renderVoters()}
      {tab === 2 && (
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Elections</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCandidateDialog(true)}
            >
              Add Candidate
            </Button>
          </Box>

          {elections.length > 0 ? (
            <Box>
              {elections.map((election) => (
                <Card key={election.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{election.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(election.date).toLocaleDateString()}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                      Candidates:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {election.candidates.map((candidate) => (
                        <Grid item xs={12} sm={6} md={4} key={candidate.id}>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1">{candidate.name}</Typography>
                            <Chip label={candidate.party} size="small" sx={{ mt: 1 }} />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No elections created yet</Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Add Candidate Dialog */}
      <Dialog open={openCandidateDialog} onClose={() => setOpenCandidateDialog(false)}>
        <DialogTitle>Add New Candidate</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Candidate Name"
            fullWidth
            value={newCandidate.name}
            onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Political Party"
            fullWidth
            value={newCandidate.party}
            onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCandidateDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCandidate}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add Voter Dialog */}
      <Dialog open={openVoterDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Add New Voter
            <IconButton edge="end" color="inherit" onClick={handleDialogClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={registrationStep} sx={{ mb: 3, mt: 1 }}>
            <Step>
              <StepLabel>Capture Face</StepLabel>
            </Step>
            <Step>
              <StepLabel>Voter Information</StepLabel>
            </Step>
          </Stepper>
          
          {registrationStep === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>Position your face in the camera view</Typography>
              <Box sx={{ height: 300, width: '100%', position: 'relative', mb: 2 }}>
                <Camera 
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  onFaceDetected={(face) => {
                    if (face) {
                      setFaceDescriptor(face.descriptor);
                      setFaceDetected(true);
                      setCameraInitialized(true);
                    } else {
                      setFaceDetected(false);
                    }
                  }}
                />
              </Box>
              {cameraError && (
                <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                  {cameraError}
                </Alert>
              )}
              <Button
                variant="contained"
                color="primary"
                startIcon={<PhotoCamera />}
                onClick={handleCaptureFace}
                disabled={!faceDetected}
              >
                Capture Face
              </Button>
              {faceDetected && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Face detected! Click capture to continue.
                </Typography>
              )}
              {!faceDetected && cameraInitialized && (
                <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
                  No face detected. Please position your face in the camera view.
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              <TextField
                autoFocus
                margin="dense"
                label="Full Name"
                fullWidth
                value={newVoter.name}
                onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
                required
              />
              <TextField
                margin="dense"
                label="ID Number"
                fullWidth
                value={newVoter.idNumber}
                onChange={(e) => setNewVoter({ ...newVoter, idNumber: e.target.value })}
                required
              />
              <TextField
                margin="dense"
                label="Date of Birth (DD/MM/YYYY)"
                fullWidth
                value={newVoter.dateOfBirth}
                onChange={(e) => setNewVoter({ ...newVoter, dateOfBirth: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {registrationStep === 1 && (
            <Button onClick={() => setRegistrationStep(0)}>Back</Button>
          )}
          {registrationStep === 1 && (
            <Button onClick={handleAddVoter} variant="contained" color="primary">
              Register Voter
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      {renderConfirmDialog()}
    </Box>
  );
};

export default AdminDashboard;

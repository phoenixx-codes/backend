import { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Paper,
  CircularProgress,
  Alert
} from "@mui/material";

function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/candidates`);
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }
        const data = await response.json();
        setCandidates(data);
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Candidates
      </Typography>
      <Paper elevation={2}>
        <List>
          {candidates.map(candidate => (
            <ListItem key={candidate._id} divider>
              <ListItemText
                primary={candidate.name}
                secondary={`Party: ${candidate.party}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

export default CandidatesList; 
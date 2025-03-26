import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  PhotoCamera,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  ArrowBack,
  ArrowForward,
  CreditCard as CreditCardIcon,
  Login
} from '@mui/icons-material';
import * as faceapi from 'face-api.js';
import { verifyVoter } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from '@google/generative-ai';

const UserLogin = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const webcamRef = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [idData, setIdData] = useState({ idNumber: '' });
  const [faceImage, setFaceImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [additionalData, setAdditionalData] = useState({
    name: '',
    dateOfBirth: ''
  });
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  // Load face-api models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoading(true);
        // Load models from public directory
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        console.log('Face-api models loaded successfully');
        setModelsLoaded(true);
        setLoading(false);
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setError('Failed to load face recognition models. Please try again. ' + error.message);
        setLoading(false);
      }
    };
    
    loadModels();
  }, []);
  
  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          captureFace();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const captureFace = async () => {
    if (!webcamRef.current) return;
    
    setLoading(true);
    setError('');
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const img = await faceapi.fetchImage(imageSrc);
      
      // Detect face with higher resolution settings
      const detections = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        console.log('Face detected successfully');
        console.log('Face descriptor obtained:', detections.descriptor ? 'Yes' : 'No');
        console.log('Face descriptor type:', detections.descriptor ? detections.descriptor.constructor.name : 'N/A');
        
        // Store as Float32Array and convert to regular array for logging
        const faceDescriptorArray = Array.from(detections.descriptor);
        console.log('Face descriptor length:', faceDescriptorArray.length);
        console.log('Face descriptor sample values:', faceDescriptorArray.slice(0, 5));
        
        setFaceImage(imageSrc);
        setFaceDescriptor(detections.descriptor); // Keep as Float32Array for comparison
        setActiveStep(1); // Move to ID card scanning step
      } else {
        setError('No face detected. Please try again with better lighting.');
      }
    } catch (error) {
      console.error('Face capture error:', error);
      setError('Error capturing face. Please try again.');
    }
    
    setLoading(false);
  };

  const scanIdCard = async () => {
    setLoading(true);
    setError('');
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      
      // Get base64 data directly from the webcam screenshot
      const base64data = imageSrc.split(',')[1];
      
      // Use Google's Generative AI for OCR
      const genAI = new GoogleGenerativeAI('AIzaSyCwahoSaJT2TQTYK4ln5C-VvvudPigBv8E');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "Extract the following information from this ID card image in JSON format: {name, dateOfBirth, idNumber}";
      
      // Call the Gemini API with proper formatting for inline_data
      const result = await model.generateContent({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64data
                }
              }
            ]
          }
        ]
      });

      const geminiResponse = await result.response;
      
      // Extract JSON from the response text
      const responseText = geminiResponse.text();
      console.log('Raw Gemini response:', responseText);
      
      // Find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract structured data from ID card. Please try again with a clearer image.');
      }
      
      try {
        const extractedData = JSON.parse(jsonMatch[0]);
        console.log('Extracted ID data:', extractedData);
        
        // Format date if it exists (using the same standardization as VoterRegistration)
        if (extractedData.dateOfBirth) {
          let formattedDob = extractedData.dateOfBirth;
          
          // Handle DD/MM/YYYY format
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(formattedDob)) {
            const [day, month, year] = formattedDob.split('/');
            formattedDob = `${year}-${month}-${day}`;
          }
          // Handle other possible formats and normalize
          else if (formattedDob.includes('/') || formattedDob.includes('-')) {
            // Try to parse as date and format as YYYY-MM-DD
            const dateParts = formattedDob.split(/[-\/]/);
            if (dateParts.length === 3) {
              // If the first part is a 4-digit year (YYYY-MM-DD)
              if (dateParts[0].length === 4) {
                formattedDob = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
              }
              // If the last part is a 4-digit year (DD-MM-YYYY)
              else if (dateParts[2].length === 4) {
                formattedDob = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
              }
            }
          }
          
          console.log('Original DOB from Gemini:', extractedData.dateOfBirth);
          console.log('Standardized DOB for verification:', formattedDob);
          extractedData.dateOfBirth = formattedDob;
        }
        
        // Update the ID data state
        setIdData({
          idNumber: extractedData.idNumber || '',
        });
        
        setAdditionalData({
          name: extractedData.name || '',
          dateOfBirth: extractedData.dateOfBirth || ''
        });
        
        // Move to verification step
        setActiveStep(2);
      } catch (jsonError) {
        console.error('Error parsing JSON from Gemini response:', jsonError);
        throw new Error('Could not parse data from ID card. Please try again.');
      }
    } catch (error) {
      console.error('ID card scanning error:', error);
      setError(error.message || 'Error scanning ID card. Please try again.');
    }
    setLoading(false);
  };
  
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!idData.idNumber) {
        setError('ID number is required. Please scan your ID card again.');
        setLoading(false);
        return;
      }
      
      if (!faceDescriptor) {
        setError('Face verification is required');
        setLoading(false);
        return;
      }

      console.log('Attempting login with:');
      console.log('- ID Number:', idData.idNumber);
      console.log('- Face descriptor present:', !!faceDescriptor);
      console.log('- Face descriptor type:', faceDescriptor ? faceDescriptor.constructor.name : 'N/A');
      
      if (faceDescriptor) {
        console.log('- Face descriptor length:', faceDescriptor.length);
        console.log('- Face descriptor sample:', Array.from(faceDescriptor).slice(0, 5));
      }
      
      // Attempt to verify voter with ID number and face descriptor
      const result = await verifyVoter(idData.idNumber, faceDescriptor, {
        name: additionalData.name,
        dateOfBirth: additionalData.dateOfBirth
      });
      
      console.log('Verification result:', result);
      
      if (result.success) {
        setSuccess('Login successful!');
        
        // Store voter data in ALL possible storage locations to ensure it works
        const voterToStore = JSON.stringify(result.voter);
        console.log('Storing voter data to session and local storage:', result.voter);
        
        // Session storage (for current session)
        sessionStorage.setItem('currentVoter', voterToStore);
        sessionStorage.setItem('voterData', voterToStore);
        
        // Local storage (for persistence)
        localStorage.setItem('voter', voterToStore);
        localStorage.setItem('currentUser', voterToStore);
        
        // Debug what's stored
        console.log('Stored in sessionStorage.currentVoter:', sessionStorage.getItem('currentVoter') ? 'YES' : 'NO');
        console.log('Stored in sessionStorage.voterData:', sessionStorage.getItem('voterData') ? 'YES' : 'NO');
        console.log('Stored in localStorage.voter:', localStorage.getItem('voter') ? 'YES' : 'NO');
        console.log('Stored in localStorage.currentUser:', localStorage.getItem('currentUser') ? 'YES' : 'NO');
        
        // Force navigation directly instead of using timeout
        console.log('Redirecting to voter dashboard IMMEDIATELY...');
        navigate('/user/dashboard', { replace: true });
      } else {
        setError(result.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'An error occurred during login. Please try again.');
    }
    
    setLoading(false);
  };
  
  const resetForm = () => {
    setIdData({ idNumber: '' });
    setFaceImage(null);
    setFaceDescriptor(null);
    setActiveStep(0);
    setError('');
    setSuccess('');
  };
  
  const webcamComponent = (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 400,
            height: 300,
            facingMode: 'user'
          }}
          style={{
            width: '100%',
            borderRadius: '8px',
          }}
        />
        
        {countdown !== null && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            borderRadius: '50%',
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}>
            {countdown}
          </Box>
        )}
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PhotoCamera />}
          disabled={loading || !modelsLoaded || countdown !== null}
          onClick={() => {
            setCountdown(3);
            startCountdown();
          }}
          fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
        >
          Start Face Capture
        </Button>
      </Box>
    </Box>
  );
  
  const idScanComponent = (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        ID Card Scanning
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        Please hold your ID card in front of the camera. Make sure all details are clearly visible.
      </Typography>
      
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 400,
            height: 300,
            facingMode: 'user'
          }}
          style={{
            width: '100%',
            borderRadius: '8px',
          }}
        />
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => setActiveStep(0)}
          disabled={loading}
          fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CreditCardIcon />}
          onClick={scanIdCard}
          disabled={loading}
          fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
        >
          Scan ID Card
        </Button>
      </Box>
    </Box>
  );
  
  const verificationComponent = (
    <Box>
      <Typography variant="h6" align="center" gutterBottom>
        Verification
      </Typography>
      
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          ID Information:
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1"><strong>ID Number:</strong> {idData.idNumber}</Typography>
          {additionalData.name && (
            <Typography variant="body1"><strong>Name:</strong> {additionalData.name}</Typography>
          )}
          {additionalData.dateOfBirth && (
            <Typography variant="body1"><strong>Date of Birth:</strong> {additionalData.dateOfBirth}</Typography>
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Please verify that the extracted information is correct.
        </Typography>
      </Paper>
      
      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            startIcon={<ArrowBack />}
            onClick={() => setActiveStep(1)}
            disabled={loading}
          >
            Back
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<Login />}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
  
  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      py: { xs: 2, sm: 4 },
      px: { xs: 1, sm: 3 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
    }}>
      <Card sx={{ 
        width: '100%', 
        maxWidth: 600,
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: 3,
        overflow: 'visible'
      }}>
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'primary.main', 
          color: 'primary.contrastText',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        }}>
          <Typography variant="h5" component="h1">
            Voter Authentication
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Face Verification</StepLabel>
            </Step>
            <Step>
              <StepLabel>ID Card Scanning</StepLabel>
            </Step>
            <Step>
              <StepLabel>Verification</StepLabel>
            </Step>
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          {loading && (
            <LinearProgress sx={{ mb: 2 }} />
          )}
          
          {activeStep === 0 && webcamComponent}
          {activeStep === 1 && idScanComponent}
          {activeStep === 2 && verificationComponent}
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="text"
              color="error"
              onClick={resetForm}
              disabled={loading}
            >
              Start Over
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserLogin;

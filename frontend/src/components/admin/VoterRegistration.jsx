import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

const steps = ['Capture Face', 'Scan ID Card', 'Enter Additional Info'];

const VoterRegistration = () => {
  const webcamRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [faceImage, setFaceImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [idData, setIdData] = useState(null);
  const [error, setError] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState({
    phone: '',
    address: '',
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        console.log('Face-api models loaded successfully');
      } catch (error) {
        console.error('Error loading face-api models:', error);
        setError('Error loading face recognition models. Please try again later.');
      }
    };
    loadModels();
  }, []);

  const captureFace = async () => {
    setLoading(true);
    setError('');
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const img = await faceapi.fetchImage(imageSrc);
      const detections = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        setFaceImage(imageSrc);
        setFaceDescriptor(detections.descriptor);
        setActiveStep(1);
      } else {
        setError('No face detected. Please try again.');
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
      
      // Upload ID card image to Firebase Storage
      const imageRef = ref(storage, `id_cards/${Date.now()}.jpg`);
      const response = await fetch(imageSrc);
      const imageBlob = await response.blob();
      await uploadBytes(imageRef, imageBlob);
      const imageUrl = await getDownloadURL(imageRef);

      // Convert blob to base64
      const base64data = imageSrc.split(',')[1]; // Webcam already provides base64
      
      // Use Google's Generative AI for OCR
      const genAI = new GoogleGenerativeAI('AIzaSyCwahoSaJT2TQTYK4ln5C-VvvudPigBv8E');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
       
      const prompt = "Extract the following information from this ID card image in JSON format dateof birth should be in dd/mm/yyyy format: {name, dateOfBirth, idNumber}";
      
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
      const jsonMatch = responseText.match(/({[\s\S]*})/);

      if (!jsonMatch) {
        throw new Error('Failed to extract data from ID card. Please try again.');
      }

      try {
        const extractedData = JSON.parse(jsonMatch[0]);
        
        // Format date if it exists and is in DD/MM/YYYY format
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
          console.log('Standardized DOB for storage:', formattedDob);
          extractedData.dateOfBirth = formattedDob;
        }
        
        setIdData(extractedData);
        setActiveStep(2);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw text:', responseText);
        throw new Error('Failed to parse data from ID card. Please try again.');
      }
    } catch (error) {
      console.error('ID card scanning error:', error);
      setError(`Error scanning ID card: ${error.message}`);
    }
    setLoading(false);
  };

  const registerVoter = async () => {
    setLoading(true);
    setError('');
    try {
      if (!idData?.idNumber) {
        throw new Error('Invalid ID data');
      }

      if (!faceDescriptor) {
        throw new Error('Face data is missing. Please capture face again.');
      }

      console.log('Registering voter with ID:', idData.idNumber);
      console.log('Face descriptor available:', !!faceDescriptor);

      // Upload face image to storage
      const faceImageRef = ref(storage, `faces/${idData.idNumber}.jpg`);
      const faceResponse = await fetch(faceImage);
      const faceBlob = await faceResponse.blob();
      await uploadBytes(faceImageRef, faceBlob);
      const faceImageUrl = await getDownloadURL(faceImageRef);

      // Create voter data object with face descriptor for persistent face recognition
      const voterData = {
        name: idData.name,
        idNumber: idData.idNumber,
        dateOfBirth: idData.dateOfBirth,
        phone: additionalInfo.phone,
        address: additionalInfo.address,
        faceDescriptor: Array.from(faceDescriptor), // Convert to regular array for storage
        faceImageUrl
      };

      console.log('Saving voter data with DOB:', idData.dateOfBirth);
      console.log('Face descriptor length:', faceDescriptor.length);
      console.log('Saving voter data:', { ...voterData, faceDescriptor: 'PRESENT' });

      // Save to the auth service to persist between server restarts
      const { addVoter, VOTERS } = await import('../../services/authService');
      const result = await addVoter(voterData);
      
      console.log('Voter added successfully:', result);
      console.log('Current VOTERS array:', VOTERS.map(v => ({ id: v.id, name: v.name, idNumber: v.idNumber })));

      // Also save to Firebase for a real backend (if using)
      try {
        await setDoc(doc(db, 'users', idData.idNumber), {
          ...voterData,
          registeredAt: new Date().toISOString(),
          hasVoted: false,
        });
      } catch (firebaseError) {
        console.error('Firebase storage error:', firebaseError);
        // Continue even if Firebase storage fails - we already saved to local storage
      }

      setSuccess(true);
      // Reset form
      setActiveStep(0);
      setFaceImage(null);
      setFaceDescriptor(null);
      setIdData(null);
      setAdditionalInfo({ phone: '', address: '' });
    } catch (error) {
      console.error('Registration error:', error);
      setError(`Registration failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Register New Voter
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Voter registered successfully!
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activeStep < 2 && (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              style={{ width: '100%', maxWidth: 400, marginBottom: 16 }}
            />
          )}

          {activeStep === 2 && (
            <Box sx={{ width: '100%', maxWidth: 400 }}>
              <TextField
                fullWidth
                label="Phone Number"
                value={additionalInfo.phone}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, phone: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Address"
                value={additionalInfo.address}
                onChange={(e) => setAdditionalInfo({ ...additionalInfo, address: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>
          )}

          {loading ? (
            <CircularProgress />
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={
                activeStep === 0 ? captureFace :
                activeStep === 1 ? scanIdCard :
                registerVoter
              }
              sx={{ mt: 2 }}
            >
              {activeStep === 0 ? 'Capture Face' :
               activeStep === 1 ? 'Scan ID Card' :
               'Register Voter'}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default VoterRegistration;

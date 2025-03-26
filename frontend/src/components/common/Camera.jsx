import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import * as faceapi from 'face-api.js';

export const Camera = ({ onFaceDetected, videoRef, canvasRef }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const detectionInterval = useRef(null);
  
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Check if models are already loaded to avoid reloading
        if (!faceapi.nets.tinyFaceDetector.isLoaded) {
          console.log('Loading face detection models...');
          // Serve models from CDN instead of local files to avoid path issues
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
          ]);
          console.log('Face detection models loaded successfully');
        } else {
          console.log('Face detection models already loaded');
        }
        
        setModelsLoaded(true);
        setIsInitializing(false);
        
        // Start video stream once models are loaded
        startCamera();
      } catch (err) {
        console.error('Error loading face detection models:', err);
        setError('Failed to load face detection models. Please check your internet connection.');
        setIsInitializing(false);
      }
    };
    
    loadModels();
    
    return () => {
      // Clean up
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
      
      // Stop camera stream
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (videoRef.current) {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error('Error playing video:', e));
        console.log('Camera access granted');
        setError(null);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Failed to access camera. Please ensure you have a webcam connected and have granted permission.');
      }
    }
  };

  const stopCamera = () => {
    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      console.log('Stopping camera stream');
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  // Start face detection once video is playing and models are loaded
  useEffect(() => {
    if (!videoRef.current || !modelsLoaded) return;
    
    const detectFaces = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended || !modelsLoaded) {
        return;
      }
      
      try {
        if (videoRef.current.readyState === 4) {
          // Get detections
          const detections = await faceapi.detectSingleFace(
            videoRef.current, 
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();
          
          // Draw results if canvas ref is provided
          if (canvasRef.current) {
            const displaySize = { 
              width: videoRef.current.videoWidth, 
              height: videoRef.current.videoHeight 
            };
            
            faceapi.matchDimensions(canvasRef.current, displaySize);
            
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            if (detections) {
              // Draw detection results
              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
              faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
            }
          }
          
          // Pass detection back to parent component
          if (detections) {
            onFaceDetected({
              detection: {
                score: 1.0  // face-api doesn't provide confidence in same way
              },
              boundingBox: detections.detection.box,
              descriptor: detections.descriptor
            });
          } else {
            onFaceDetected(null);
          }
        }
      } catch (err) {
        console.error('Error during face detection:', err);
      }
    };
    
    const handleVideoPlay = () => {
      // Run face detection at regular intervals
      detectionInterval.current = setInterval(async () => {
        await detectFaces();
      }, 100); // 10 fps
    };
    
    videoRef.current.addEventListener('play', handleVideoPlay);
    
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
      
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, [videoRef, canvasRef, modelsLoaded, onFaceDetected]);
  
  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      borderRadius: 2
    }}>
      {isInitializing && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10
        }}>
          <CircularProgress color="primary" sx={{ mb: 2 }} />
          <Typography variant="body2" color="white">
            Initializing face detection...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 10,
          p: 2
        }}>
          <Typography variant="body1" color="error" align="center" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body2" color="white" align="center" gutterBottom>
            Please ensure your camera is connected and you've granted permission to use it.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={startCamera}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Box>
      )}
      
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)' // Mirror view
        }}
        autoPlay
        playsInline
        muted
      />
      
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)' // Mirror view to match video
        }}
      />
    </Box>
  );
};

// Mock authentication service to replace Firebase
const ADMIN_USER = {
  email: 'admin@voting-system.com',
  password: 'admin123',
  role: 'admin'
};

// Mock data storage (will be loaded from localStorage if available)
let VOTERS = [];
let ELECTIONS = [];

// Helper function to load voters from localStorage
const loadVotersFromStorage = () => {
  try {
    const storedVoters = localStorage.getItem('voters');
    if (storedVoters) {
      // Parse the stored voters
      const parsedVoters = JSON.parse(storedVoters);
      
      // Ensure face descriptors are properly handled
      VOTERS = parsedVoters.map(voter => {
        // If there's a face descriptor, ensure it's properly formatted
        if (voter.faceDescriptor && Array.isArray(voter.faceDescriptor)) {
          // Keep as array for now - we'll convert to Float32Array when needed
          console.log(`Loaded face descriptor for voter ${voter.idNumber}, length:`, voter.faceDescriptor.length);
        } else if (voter.faceDescriptor) {
          console.warn(`Invalid face descriptor format for voter ${voter.idNumber}`);
        } else {
          console.warn(`No face descriptor found for voter ${voter.idNumber}`);
        }
        return voter;
      });
      
      console.log('Loaded voters from localStorage:', VOTERS.length);
    } else {
      console.log('No voters found in localStorage');
      VOTERS = [];
    }
  } catch (error) {
    console.error('Error loading voters from storage:', error);
    VOTERS = [];
  }
};

// Helper function to load elections from localStorage
const loadElectionsFromStorage = () => {
  try {
    const storedElections = localStorage.getItem('storedElections');
    if (storedElections) {
      ELECTIONS = JSON.parse(storedElections);
      console.log('Loaded elections from localStorage:', ELECTIONS.length);
    } else {
      console.log('No elections found in localStorage');
      ELECTIONS = [
        {
          id: 'E001',
          title: 'Presidential Election 2025',
          startDate: '2025-03-20',
          endDate: '2025-03-25',
          status: 'active',
          candidates: [
            { id: 'C001', name: 'Candidate A', party: 'Party A', votes: 0 },
            { id: 'C002', name: 'Candidate B', party: 'Party B', votes: 0 },
            { id: 'C003', name: 'Candidate C', party: 'Party C', votes: 0 }
          ]
        }
      ];
    }
  } catch (error) {
    console.error('Error loading elections from storage:', error);
    ELECTIONS = [
      {
        id: 'E001',
        title: 'Presidential Election 2025',
        startDate: '2025-03-20',
        endDate: '2025-03-25',
        status: 'active',
        candidates: [
          { id: 'C001', name: 'Candidate A', party: 'Party A', votes: 0 },
          { id: 'C002', name: 'Candidate B', party: 'Party B', votes: 0 },
          { id: 'C003', name: 'Candidate C', party: 'Party C', votes: 0 }
        ]
      }
    ];
  }
};

// Helper function to save voters to localStorage
function saveVotersToStorage() {
  try {
    // Create a deep copy of VOTERS that's safe for JSON serialization
    const serializableVoters = VOTERS.map(voter => {
      // Convert Float32Array to regular array for storage if it's not already an array
      const voterCopy = {...voter};
      if (voterCopy.faceDescriptor && voterCopy.faceDescriptor instanceof Float32Array) {
        voterCopy.faceDescriptor = Array.from(voterCopy.faceDescriptor);
      }
      return voterCopy;
    });
    
    localStorage.setItem('voters', JSON.stringify(serializableVoters));
    console.log('Saved voters to localStorage, count:', serializableVoters.length);
  } catch (error) {
    console.error('Error saving voters to storage:', error);
  }
}

// Helper function to save elections to localStorage
function saveElectionsToStorage() {
  try {
    localStorage.setItem('storedElections', JSON.stringify(ELECTIONS));
  } catch (error) {
    console.error('Error saving elections to storage:', error);
  }
}

loadVotersFromStorage();
loadElectionsFromStorage();
console.log('Loaded elections from localStorage:', ELECTIONS.length);

// Helper function to calculate Euclidean distance between face descriptors
const calculateFaceDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2) {
    console.error('Missing descriptor in face comparison');
    return 999; // Return a large number if either descriptor is missing
  }
  
  // Ensure both are Float32Array
  const desc1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const desc2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  
  // Check if arrays are the same length
  if (desc1.length !== desc2.length) {
    console.error('Face descriptor length mismatch:', desc1.length, 'vs', desc2.length);
    return 999; // Return a large number indicating a poor match
  }
  
  // Calculate Euclidean distance
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
};

// Admin authentication
const adminLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
        const adminData = { ...ADMIN_USER };
        delete adminData.password; // Don't store password in session
        
        // Store in localStorage
        localStorage.setItem('admin', JSON.stringify(adminData));
        resolve(adminData);
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 800);
  });
};

// Voter verification with ID, face (auto-approved), and optional additional data
const verifyVoter = (idNumber, faceDescriptor = null, additionalData = {}) => {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!idNumber) {
      return reject(new Error('ID number is required'));
    }

    console.log('Verifying voter with ID:', idNumber);
    console.log('Face descriptor provided:', !!faceDescriptor);
    console.log('Additional data provided:', additionalData);
    console.log('Current voters in system:', VOTERS.map(v => v.idNumber));
    
    // Ensure VOTERS array is loaded from localStorage
    if (VOTERS.length === 0) {
      loadVotersFromStorage();
      console.log('Reloaded voters from storage, count:', VOTERS.length);
    }

    // Find the voter with the provided ID
    const voter = VOTERS.find(v => v.idNumber === idNumber);
    
    // If voter not found, reject
    if (!voter) {
      console.error('Voter not found with ID:', idNumber);
      return reject(new Error('Voter not found. Please contact an administrator to register'));
    }
    
    console.log('Found voter:', voter.name);

    // Check if additional data matches (if provided)
    if (additionalData.name && voter.name.toLowerCase() !== additionalData.name.toLowerCase()) {
      console.error('Name mismatch:', additionalData.name, 'vs', voter.name);
      return reject(new Error('Name does not match our records'));
    }

    // Optional DOB check, only if both are provided
    if (additionalData.dateOfBirth && voter.dateOfBirth) {
      console.log('Comparing DOB:', additionalData.dateOfBirth, 'vs', voter.dateOfBirth);
      
      // Standardize date format function
      const standardizeDate = (dateStr) => {
        if (!dateStr) return '';
        
        // Remove any time component and trim
        let normalized = dateStr.split('T')[0].trim();
        
        // Handle different formats
        if (normalized.includes('/') || normalized.includes('-')) {
          const dateParts = normalized.split(/[-\/]/);
          if (dateParts.length === 3) {
            // If first part is a 4-digit year (YYYY-MM-DD)
            if (dateParts[0].length === 4) {
              return `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`;
            }
            // If last part is a 4-digit year (DD-MM-YYYY or MM-DD-YYYY)
            else if (dateParts[2].length === 4) {
              return `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
            }
          }
        }
        
        return normalized;
      };
      
      // Normalize dates to ensure format consistency
      const normalizedInputDOB = standardizeDate(additionalData.dateOfBirth);
      const normalizedStoredDOB = standardizeDate(voter.dateOfBirth);
      
      console.log('Normalized DOBs for comparison:', normalizedInputDOB, 'vs', normalizedStoredDOB);
      
      // Check equality after normalizing
      if (normalizedInputDOB !== normalizedStoredDOB) {
        console.error('Date of birth mismatch - normalized values:', normalizedInputDOB, 'vs', normalizedStoredDOB);
        return reject(new Error('Date of birth does not match our records'));
      } else {
        console.log('Date of birth matched after normalization');
      }
    }

    // Perform actual face verification instead of auto-approving
    if (faceDescriptor) {
      if (!voter.faceDescriptor || (!Array.isArray(voter.faceDescriptor) && !(voter.faceDescriptor instanceof Float32Array))) {
        console.error('Voter has no registered face or invalid face data type');
        console.log('Face descriptor data type:', voter.faceDescriptor ? typeof voter.faceDescriptor : 'null');
        console.log('Face descriptor is array:', Array.isArray(voter.faceDescriptor));
        
        return reject(new Error('No face data found for this voter. Please contact an administrator.'));
      }

      console.log('Comparing face descriptors...');
      console.log('Input descriptor type:', faceDescriptor.constructor.name);
      console.log('Stored descriptor type:', voter.faceDescriptor.constructor ? voter.faceDescriptor.constructor.name : 'Regular Array');
      
      // Convert from array to Float32Array if needed
      try {
        const storedDescriptor = voter.faceDescriptor instanceof Float32Array 
          ? voter.faceDescriptor 
          : new Float32Array(voter.faceDescriptor);
        
        // Calculate Euclidean distance between face descriptors
        const distance = calculateFaceDistance(faceDescriptor, storedDescriptor);
        console.log('Face match distance:', distance);
        
        // Threshold for face verification (lower is more similar, 0.6 is a common threshold)
        const FACE_MATCH_THRESHOLD = 0.6;
        
        if (distance > FACE_MATCH_THRESHOLD) {
          console.error('Face verification failed, distance:', distance);
          return reject(new Error('Face verification failed. Please try again.'));
        }
      } catch (faceError) {
        console.error('Error during face comparison:', faceError);
        return reject(new Error('Error during face verification. Please try again.'));
      }
    }
    
    // Authentication successful
    resolve({
      success: true,
      voter: {
        ...voter,
        hasVoted: voter.hasVoted || false
      }
    });
  });
};

// Register a new voter
const addVoter = (voterData) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate required fields
      if (!voterData.idNumber || !voterData.name) {
        return reject(new Error('ID number and name are required'));
      }

      // Check if voter with same ID already exists
      const existingVoter = VOTERS.find(v => v.idNumber === voterData.idNumber);
      if (existingVoter) {
        return reject(new Error('A voter with this ID already exists'));
      }

      // Ensure we have a valid face descriptor
      if (!voterData.faceDescriptor) {
        return reject(new Error('Face data is required for registration'));
      }

      // Make sure face descriptor is stored as a regular array for JSON serialization
      if (voterData.faceDescriptor instanceof Float32Array) {
        voterData.faceDescriptor = Array.from(voterData.faceDescriptor);
      }

      // Add to VOTERS array with a unique ID
      const newVoter = {
        ...voterData,
        id: `VOTER_${Date.now()}`,
        hasVoted: false,
        registeredAt: new Date().toISOString()
      };

      VOTERS.push(newVoter);
      
      // Save to localStorage
      saveVotersToStorage();
      
      console.log('Voter added successfully:', newVoter.name);
      console.log('Current voters count:', VOTERS.length);
      
      resolve(newVoter);
    } catch (error) {
      console.error('Error adding voter:', error);
      reject(error);
    }
  });
};

// Get all voters
const getVoters = () => {
  return Promise.resolve(VOTERS);
};

// Get election data
const getElections = () => {
  return Promise.resolve(ELECTIONS);
};

// Update election
const updateElection = (election) => {
  return new Promise((resolve, reject) => {
    try {
      const index = ELECTIONS.findIndex(e => e.id === election.id);
      if (index !== -1) {
        ELECTIONS[index] = election;
      } else {
        const newElection = { ...election, id: Math.floor(1000 + Math.random() * 9000) };
        ELECTIONS.push(newElection);
      }
      
      // Save elections to storage
      saveElectionsToStorage();
      
      resolve(election);
    } catch (error) {
      reject(error);
    }
  });
};

// Cast vote
const castVote = (voterId, electionId, candidateId) => {
  return new Promise((resolve, reject) => {
    try {
      // Find the election
      const electionIndex = ELECTIONS.findIndex(e => e.id === electionId);
      if (electionIndex === -1) {
        throw new Error('Election not found');
      }
      
      // Find the candidate
      const candidateIndex = ELECTIONS[electionIndex].candidates.findIndex(c => c.id === candidateId);
      if (candidateIndex === -1) {
        throw new Error('Candidate not found');
      }
      
      // Update vote count
      ELECTIONS[electionIndex].candidates[candidateIndex].votes += 1;
      
      // Update voter status
      const voterIndex = VOTERS.findIndex(v => v.id === voterId);
      if (voterIndex !== -1) {
        VOTERS[voterIndex].hasVoted = true;
      }
      
      // Save voters to storage
      saveVotersToStorage();
      
      // Save elections to storage
      saveElectionsToStorage();
      
      resolve({
        success: true,
        message: 'Vote cast successfully'
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Add a candidate
const addCandidate = (electionId, candidate) => {
  return new Promise((resolve, reject) => {
    try {
      const electionIndex = ELECTIONS.findIndex(e => e.id === electionId);
      if (electionIndex === -1) {
        throw new Error('Election not found');
      }
      
      const newCandidate = {
        ...candidate,
        id: candidate.id || `C${Math.floor(1000 + Math.random() * 9000)}`,
        votes: candidate.votes || 0
      };
      
      ELECTIONS[electionIndex].candidates.push(newCandidate);
      
      // Save elections to storage
      saveElectionsToStorage();
      
      resolve(newCandidate);
    } catch (error) {
      reject(error);
    }
  });
};

// Remove a candidate
const removeCandidate = (electionId, candidateId) => {
  return new Promise((resolve, reject) => {
    try {
      const electionIndex = ELECTIONS.findIndex(e => e.id === electionId);
      if (electionIndex === -1) {
        throw new Error('Election not found');
      }
      
      const filteredCandidates = ELECTIONS[electionIndex].candidates.filter(c => c.id !== candidateId);
      
      if (filteredCandidates.length === ELECTIONS[electionIndex].candidates.length) {
        throw new Error('Candidate not found');
      }
      
      ELECTIONS[electionIndex].candidates = filteredCandidates;
      
      // Save elections to storage
      saveElectionsToStorage();
      
      resolve({
        success: true,
        message: 'Candidate removed successfully'
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Update candidates
const updateCandidates = (electionId, candidates) => {
  return new Promise((resolve, reject) => {
    try {
      const electionIndex = ELECTIONS.findIndex(e => e.id === electionId);
      if (electionIndex === -1) {
        throw new Error('Election not found');
      }
      
      ELECTIONS[electionIndex].candidates = candidates;
      
      // Save elections to storage
      saveElectionsToStorage();
      
      resolve({
        success: true,
        message: 'Candidates updated successfully',
        candidates: candidates
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Check if admin is logged in
const isAdminLoggedIn = () => {
  const admin = localStorage.getItem('admin');
  return !!admin;
};

// Check if voter is logged in
const isVoterLoggedIn = () => {
  const voter = localStorage.getItem('currentUser');
  return !!voter;
};

// Logout
const logout = () => {
  localStorage.removeItem('admin');
  localStorage.removeItem('currentUser');
};

// Remove a voter
const removeVoter = (voterId) => {
  return new Promise((resolve, reject) => {
    try {
      const initialLength = VOTERS.length;
      VOTERS = VOTERS.filter(voter => voter.id !== voterId && voter.idNumber !== voterId);
      
      if (VOTERS.length === initialLength) {
        throw new Error('Voter not found');
      }
      
      // Save updated voters to storage
      saveVotersToStorage();
      
      resolve({ success: true, message: 'Voter removed successfully' });
    } catch (error) {
      reject(error);
    }
  });
};

// Reset voting results (clear all hasVoted flags and reset vote counts)
const resetVotingResults = () => {
  return new Promise((resolve, reject) => {
    try {
      // Update each voter to set hasVoted to false
      VOTERS.forEach(voter => {
        voter.hasVoted = false;
      });
      
      // Save updated voters to storage
      saveVotersToStorage();
      
      // Reset vote counts for all candidates in all elections
      if (ELECTIONS && ELECTIONS.length > 0) {
        ELECTIONS.forEach(election => {
          if (election.candidates && election.candidates.length > 0) {
            election.candidates.forEach(candidate => {
              candidate.votes = 0;
            });
          }
        });
        
        // Save updated elections to storage
        saveElectionsToStorage();
      }
      
      resolve({ success: true, message: 'Voting results reset successfully' });
    } catch (error) {
      reject(error);
    }
  });
};

// Export the missing functions that were defined but not exported
export { adminLogin, verifyVoter, VOTERS, ELECTIONS, addVoter, getVoters, getElections, updateElection, castVote, addCandidate, removeCandidate, updateCandidates, isAdminLoggedIn, isVoterLoggedIn, logout, removeVoter, resetVotingResults };

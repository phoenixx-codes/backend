import { useEffect, useState } from "react";

function CandidatesList() {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/candidates")
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  return (
    <div>
      <h2>Candidates</h2>
      <ul>
        {candidates.map(candidate => (
          <li key={candidate._id}>
            {candidate.name} ({candidate.party})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CandidatesList;

const express = require("express");
const Vote = require("../models/Vote");
const User = require("../models/User");
const Candidate = require("../models/candidates");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// ✅ Secure Cast a Vote Route (with authentication)
router.post("/vote", authenticate, async (req, res) => {
  try {
    const userId = req.userId;  // Get authenticated user ID
    const { candidateId } = req.body;

    const user = await User.findById(userId);
    if (!user || user.voted) {
      return res.status(400).json({ message: "User has already voted or does not exist" });
    }

    // Save the vote
    const vote = new Vote({ userId, candidateId });
    await vote.save();

    // Update candidate votes & user voted status
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });
    await User.findByIdAndUpdate(userId, { voted: true });

    res.status(200).json({ message: "Vote cast successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get vote count (no authentication needed)
router.get("/results", async (req, res) => {
  try {
    const results = await Candidate.find().select("name party votes");
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

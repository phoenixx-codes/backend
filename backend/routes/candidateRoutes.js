const express = require("express");
const { body, validationResult } = require("express-validator");
const Candidate = require("../models/candidates"); // Ensure this model exists

const router = express.Router();

// Add Candidate Route
router.post(
  "/add",
  [
    body("name").notEmpty().trim(),
    body("party").notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, party } = req.body;
      const newCandidate = new Candidate({ name, party, votes: 0 });
      await newCandidate.save();
      res.json({ message: "Candidate added successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const semantic = require('./semantic');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Save an essay and compare it with the old ones
app.post('/api/essays', async (req, res) => {
  const { studentName, essay } = req.body;

  if (!essay || essay.trim().length < 20) {
    return res.status(400).json({ error: 'Essay is too short (minimum 20 characters).' });
  }

  try {
    const saved = await db.saveEssay(studentName || 'Anonymous', essay);

    const allEssays = await db.getAllEssays();
    const previous = allEssays.filter(e => e.id !== saved.id);

    const results = await semantic.compareEssays(essay, previous);
    await db.saveComparisons(saved.id, results);

    res.json({
      message: 'Essay saved and compared',
      essayId: saved.id,
      comparisons: results.map(r => ({
        comparedWith: r.studentName,
        comparedEssayId: r.essayId,
        similarity: Number(r.score.toFixed(3))
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all saved essays
app.get('/api/essays', async (req, res) => {
  try {
    res.json(await db.getAllEssays());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get saved scores of one essay
app.get('/api/essays/:id/comparisons', async (req, res) => {
  try {
    res.json(await db.getComparisons(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
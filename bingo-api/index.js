const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Set up initial data
const allCombos = [];
const calledCombos = ['FREE']; // Start with "Free Space" as the first combo
let players = [];

// Fetch all Players
app.get('/players', (req, res) => {
  res.json(players);
});

// Add a new player
app.post('/players', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Player name is required' });
  }
  const newPlayer = { name, bingos: [false, false, false, false, false], hasBingo: false };
  players.push(newPlayer);
  res.status(201).json(newPlayer);
});


// Generate all possible Bingo combinations
function initializeCombos() {
  const columns = {
    B: [1, 15],
    I: [16, 30],
    N: [31, 45],
    G: [46, 60],
    O: [61, 75]
  };

  for (const [letter, range] of Object.entries(columns)) {
    for (let i = range[0]; i <= range[1]; i++) {
      // Skip adding the middle space (Free Space)
      if (letter === 'N' && i === 38) continue; // Middle space in "N" column is "Free"
      allCombos.push(`${letter}${i}`);
    }
  }

  console.log('All Combos:', allCombos);
}

// Initialize combos on server start
initializeCombos();

// Root route - Confirm server is running
app.get('/', (req, res) => {
  res.send('Bingo API is running!');
});

// Endpoint to fetch the board
app.get('/board', (req, res) => {
  res.json({
    calledCombos, // Combos that have been called
    currentCombo: calledCombos[calledCombos.length - 1] // Last called combo
  });
});

// Endpoint to draw a random combo
app.get('/random-combo', (req, res) => {
  // Filter available combos
  const availableCombos = allCombos.filter(combo => !calledCombos.includes(combo));

  // Check if all combos are already called
  if (availableCombos.length === 0) {
    return res.json({
      message: 'All combos have been called!',
      currentCombo: null
    });
  }

  // Select a random combo
  const randomIndex = Math.floor(Math.random() * availableCombos.length);
  const randomCombo = availableCombos[randomIndex];

  // Add the new combo to calledCombos
  calledCombos.push(randomCombo);

  res.json({
    message: 'New combo drawn',
    currentCombo: randomCombo,
    calledCombos
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

// Game State
const allCombos = [];
const calledCombos = ['FREE'];
let players = []; // Stores objects: { id, name, board, connected }

// Generate all combos B1..O75
function initializeCombos() {
  const columns = {
    B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75]
  };
  for (const [letter, range] of Object.entries(columns)) {
    for (let i = range[0]; i <= range[1]; i++) {
      // if (letter === 'N' && i === 38) continue; // Free space handled separately usually
      allCombos.push(`${letter}${i}`);
    }
  }
}
initializeCombos();

// Helper: Generate a Board
function generateBoard() {
  const board = { B: [], I: [], N: [], G: [], O: [] };
  const ranges = {
    B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75]
  };

  for (const [col, [min, max]] of Object.entries(ranges)) {
    const nums = [];
    while (nums.length < 5) {
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!nums.includes(n)) nums.push(n);
    }
    board[col] = nums; // Keep raw numbers for simplicity? Or strings?
    // Frontend expects numbers or strings? 
    // Logic check: Frontend `getNumber` just reads it.
    // Let's store raw numbers. Frontend format logic is minimal.
  }
  // N col middle is free, handled by frontend index 2 check, but let's put 'FREE' or 0 there?
  // Frontend `isFreeSpace` checks checks index.
  return board;
}

// Socket Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', ({ name, playerId }) => {
    console.log('Player joining:', name, playerId);

    let player;

    // Try to find existing player by stable ID
    if (playerId) {
      player = players.find(p => p.playerId === playerId);
    }

    // Also try by name if logic dictates (optional, prevents duplicate names)
    if (!player && name) {
      player = players.find(p => p.name === name);
    }

    if (player) {
      // RECONNECTION
      console.log(`Player ${player.name} reconnected.`);
      player.socketId = socket.id; // Update current socket connection
      if (!player.playerId) player.playerId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(); // Ensure has ID

      socket.emit('welcome', {
        board: player.board,
        playerId: player.playerId,
        bingos: player.bingos
      });

      // Update list for host (to show they are online? mainly just refreshing list)
      io.emit('playerList', players);

    } else {
      // NEW PLAYER
      if (!name) return; // Need a name

      const newPlayerId = playerId || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString());

      const board = generateBoard();
      player = {
        socketId: socket.id,
        playerId: newPlayerId,
        name: name,
        board: board,
        bingos: Array(7).fill(false),
        isCursed: false
      };

      players.push(player);

      // Send board to player
      socket.emit('welcome', {
        board,
        playerId: newPlayerId
      });

      // Update Host
      io.emit('playerJoined', player);
      io.emit('playerList', players);
    }
  });

  socket.on('playerBingo', ({ bingoCount }) => {
    // Find player by socketId OR we could ask client to send playerId
    const player = players.find(p => p.socketId === socket.id);
    if (player) {
      player.bingos = player.bingos.map((_, i) => i < bingoCount);
      io.emit('playerUpdate', player);
    }
  });

  socket.on('triggerCurse', ({ playerId }) => {
    console.log('Curse triggered for:', playerId);
    // Find player name
    const player = players.find(p => p.playerId === playerId || p.id === playerId || p.socketId === playerId);
    // Note: Host sends playerId (which might be the stable ID).
    if (player) {
      player.isCursed = true;
      // Broadcast to ALL (Host and Players)
      io.emit('curseTriggered', { playerId: player.playerId, playerName: player.name });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Do NOT remove player, so they can reconnect.
  });
});

// API Routes (Host Control)

// Fetch all Players
app.get('/players', (req, res) => {
  res.json(players);
});

// Draw random combo
app.get('/random-combo', (req, res) => {
  const availableCombos = allCombos.filter(c => !calledCombos.includes(c));

  if (availableCombos.length === 0) {
    return res.json({ message: 'All done', currentCombo: null });
  }

  const randomIndex = Math.floor(Math.random() * availableCombos.length);
  const randomCombo = availableCombos[randomIndex];

  calledCombos.push(randomCombo);

  // Broadcast to everyone!
  io.emit('newCombo', randomCombo);

  res.json({
    message: 'New combo drawn',
    currentCombo: randomCombo,
    calledCombos
  });
});


// Endpoint to fetch the board state (for Host refresh)
app.get('/board', (req, res) => {
  res.json({
    calledCombos,
    currentCombo: calledCombos[calledCombos.length - 1]
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

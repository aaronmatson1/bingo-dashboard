<template>
  <div class="bingo-container">
    <!-- Player List and Bingo Trackers -->
    <div class="player-list">
      <h2>Players</h2>
      <div class="name-list">
        <div v-for="(player, index) in players" :key="index" class="player">
        <span>{{ player.name }} <span v-if="player.isCursed">👻</span></span>
        <div class="bingo-checkboxes">
          <label v-for="n in 7" :key="n">
            <input 
              type="checkbox" 
              v-model="player.bingos[n - 1]" 
              @change="onCheckboxChange(player)" 
            />
          </label>
        </div>
        <span v-if="player.bingos.filter(b => b).length === 7">Bingo!</span>
      </div>
      </div>
      <button @click="addPlayer">Add Player</button>
    </div>


    <!-- Current Combo in the center -->
    <div class="inner-column">
      <!-- Cursed Message -->
      <div v-if="cursedMessage" class="cursed-message">
        {{ cursedMessage }}
      </div>

      <!-- Previous Combo to the right -->
      <div class="previous-combo">
        <h3>Previous Combo:<br/>{{ formatCombo(previousCombo) }}</h3>
      </div>

      <div class="current-combo">
        
        <h2>Current Combo: <br/><span>{{ formatCombo(currentCombo) }}</span></h2>
      </div>

      <button @click="fetchCombo">Call Next Combo</button>

    </div>

    <!-- BINGO board -->
    <div class="bingo-board">
      <div class="column">
        <h3>B</h3>
        <div class="bingo-combos" v-for="combo in sortedBoard.B" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>I</h3>
        <div class="bingo-combos" v-for="combo in sortedBoard.I" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>N</h3>
        <div class="bingo-combos" v-for="combo in sortedBoard.N" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>G</h3>
        <div class="bingo-combos" v-for="combo in sortedBoard.G" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>O</h3>
        <div class="bingo-combos" v-for="combo in sortedBoard.O" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
    </div>

    <!-- List of Called Combos -->
    <!-- <div class="called-combos">
      <h2>Called Combos</h2>
      <ul>
        <li v-for="combo in sortedCalledCombos" :key="combo">
          {{ formatCombo(combo) }}
        </li>
      </ul>
    </div> -->
  </div>
</template>

<script>
import confetti from 'canvas-confetti';

const API_URL = 'http://localhost:3000'; // Backend URL

export default {
  data() {
    return {
      currentCombo: null, // Last drawn combo
      previousCombo: null, // Combo before the last one
        board: {
        B: [], I: [], N: [], G: [], O: [] // Initialize the columns
      },
      players: [], // List of players
      cursedItemClaimed: false, // Track if the cursed item has been claimed
      cursedPlayer: null, // Track who has the cursed item
      cursedMessage: null // Message to display when curse triggers
    };
  },
  computed: {
    sortedBoard() {
      // Return sorted columns
      return {
        B: this.sortCombos(this.board.B),
        I: this.sortCombos(this.board.I),
        N: this.sortCombos(this.board.N),
        G: this.sortCombos(this.board.G),
        O: this.sortCombos(this.board.O)
      };
    },
    sortedCalledCombos() {
      // Concatenate all columns and sort
      const allCombos = [
        ...this.board.B,
        ...this.board.I,
        ...this.board.N,
        ...this.board.G,
        ...this.board.O
      ];
      return this.sortCombos(allCombos);
    }
  },
  methods: {
    async fetchCombo() {
      try {
        const response = await fetch(`${API_URL}/random-combo`);
        const data = await response.json();

        console.log('Fetched combo:', data);

        if (data.currentCombo) {
          // Update current and previous combos
          this.previousCombo = this.currentCombo;
          this.currentCombo = data.currentCombo;

          // Update board with new combos
          this.board = this.organizeBoard(data.calledCombos);
        } else {
          console.log('No new combo, all combos are called.');
          alert('All combos have been called! GAME OVER!');
        }
      } catch (error) {
        console.error('Error fetching combo:', error);
        alert('Failed to fetch the next combo. Please try again.');
      }
    },
    async fetchPlayers() {
      try {
        const response = await fetch(`${API_URL}/players`);
        const data = await response.json();
        this.players = data;
      } catch (error) {
        console.error('Error fetching players:', error);
        alert('Failed to fetch players. Please try again.');
      }
    },
    async addPlayer() {
      const playerName = prompt('Enter player name:');
      if (playerName) {
        try {
          const response = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: playerName }),
          });
          const newPlayer = await response.json();
          this.players.push(newPlayer);
        } catch (error) {
          console.error('Error adding player:', error);
          alert('Failed to add player. Please try again.');
        }
      }
    },
    async fetchBoard() {
      try {
        const response = await fetch(`${API_URL}/board`);
        const data = await response.json();

        console.log('Fetched board:', data);

        // Update board and combos
        this.board = this.organizeBoard(data.calledCombos);
        this.currentCombo = data.currentCombo;
        this.previousCombo = data.calledCombos[data.calledCombos.length - 2] || null; // Get the previous combo
      } catch (error) {
        console.error('Error fetching board:', error);
        alert('Failed to fetch the board state. Please refresh.');
      }
    },
    organizeBoard(calledCombos) {
      const columns = { B: [], I: [], N: [], G: [], O: [] };

      calledCombos.forEach(combo => {
        const letter = combo[0]; // B, I, N, G, O
        if (columns[letter]) {
          columns[letter].push(combo);
        }
      });

      return columns;
    },
    sortCombos(combos) {
      // Sort combos alphanumerically
      return combos
        .filter(combo => combo !== 'FREE') // Exclude "FREE" from sorting
        .sort((a, b) => {
          const numA = parseInt(a.slice(1), 10); // Extract the number part after the letter
          const numB = parseInt(b.slice(1), 10); // Extract the number part after the letter
          return numA - numB; // Compare numbers
        })
        .concat(combos.filter(combo => combo === 'FREE')); // Keep "FREE" at the end
    },
    formatCombo(combo) {
      return combo === 'FREE' ? 'Free Space' : combo;
    },
    onCheckboxChange(player) {
    this.triggerConfetti(); // Trigger confetti on every checkbox click

    // Check if the player has a bingo (all 7 checkboxes selected)
    if (player.bingos.filter((b) => b).length === 7 && !player.hasBingo) {
      player.hasBingo = true;
      this.triggerConfetti(true); // Big confetti for bingo
    }

    // Cursed Item Logic
    // Trigger if:
    // 1. Not already claimed
    // 2. All players have at least one checkmark
    // 3. Game is in "later half" (more than 15 combos called)
    // 4. Random chance (e.g., 10%)
    const allPlayersHaveCheck = this.players.every(p => p.bingos.some(b => b));
    
    if (!this.cursedItemClaimed && allPlayersHaveCheck && this.sortedCalledCombos.length > 15 && Math.random() < 0.1) {
      this.activateCurse(player);
    }
  },
  activateCurse(player) {
    this.cursedItemClaimed = true;
    this.cursedPlayer = player.name;
    player.isCursed = true; // Mark player as cursed in UI
    this.triggerCursedConfetti();
    
    this.cursedMessage = `👻 A CURSE HAS BEFALLEN ${player.name.toUpperCase()}! 👻`;
    setTimeout(() => {
      this.cursedMessage = null; // Hide message after 5 seconds
    }, 5000);
  },
  triggerCursedConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#000000', '#4B0082', '#800000'], // Black, Indigo, Maroon
        shapes: ['circle', 'square'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#000000', '#4B0082', '#800000'],
        shapes: ['circle', 'square'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  },
  triggerConfetti(isBingo = false) {
    confetti({
      particleCount: isBingo ? 150 : 50,
      spread: isBingo ? 100 : 60,
      origin: { y: 0.7 },
      colors: isBingo ? ["#ff0000", "#00ff00", "#0000ff"] : undefined,
    });
  },
  },
  created() {
    this.fetchBoard(); // Load the initial state on mount
    this.fetchPlayers(); // Fetch players from the backend
  }
};
</script>


<style scoped>
.bingo-container {
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  justify-content: space-evenly;
  align-items: center;
  padding: 20px;
  flex-wrap: wrap;
  gap: 12px;
  /* border: 3px solid green; */
}

.inner-column {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 60px;
  order: 1;
}

.name-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  max-width: 80vw;
  gap: 35px;
}

.player-list, .current-combo, .previous-combo, .bingo-board {
  /* max-width: 30%; */
  height: auto;
}

.player-list {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  /* border: 2px solid red; */
}

.player-list h2 {
  font-size: 35px;
}

.player{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  line-height: 35px;
  gap: 20px;
  border-bottom: 1px solid #fff;
  border-top: 1px solid #fff;
  font-size: 22px;
  padding: 10px;
}

.player-list button {
  margin-top: 38px;
}

.current-combo {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.current-combo h2{
  font-size: 1.25em;
}

.inner-column button {
  max-height: 90px;
  max-width: 180px;
  font-size: 22px;
  font-weight: 300;
  margin: 0 auto;
}

.previous-combo {
  font-size: 1.2em;
  opacity: 0.8;
}

.bingo-board {
  display: flex;
  width: 100%;
  margin-bottom: 20px;
  border: 2px solid #333;
  padding: 25px 0 25px 0;
  flex: 2;
}

.column {
  width: 100%;
  border-right: 2px solid #333;
}

.column h3 {
  text-align: center;
  font-size: 2.5rem;
  border-bottom: 1px solid #333;
  padding-bottom: 40px;
  margin-bottom: 35px;
}

.column div {
  text-align: center;
}

.bingo-combos {
  margin: 14px;
  font-size: 1.2em;
}

.called-combos {
  margin-top: 20px;
  text-align: center;
}

.called-combos ul {
  list-style: none;
  padding: 0;
}

.called-combos li {
  font-size: 1.1em;
}
.cursed-message {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #ff0000;
  padding: 20px;
  font-size: 2em;
  font-weight: bold;
  border-radius: 10px;
  z-index: 100;
  animation: shake 0.5s;
}

@keyframes shake {
  0% { transform: translate(-50%, 0) rotate(0deg); }
  25% { transform: translate(-50%, 5px) rotate(5deg); }
  50% { transform: translate(-50%, 0) rotate(0eg); }
  75% { transform: translate(-50%, -5px) rotate(-5deg); }
  100% { transform: translate(-50%, 0) rotate(0deg); }
}
</style>

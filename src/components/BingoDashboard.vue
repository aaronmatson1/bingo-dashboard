<template>
  <div class="bingo-container">
    <!-- Player List and Bingo Trackers -->
    <div class="player-list">
      <h2>Players</h2>
      <div v-for="(player, index) in players" :key="index" class="player">
        <span>{{ player.name }}</span>
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
      <button @click="addPlayer">Add Player</button>
    </div>


    <!-- Current Combo in the center -->
    <div class="current-combo">
      
      <h2>Current Combo: <br/><span>{{ formatCombo(currentCombo) }}</span></h2>
      <button @click="fetchCombo">Call Next Combo</button>
    </div>

    <!-- Previous Combo to the right -->
    <div class="previous-combo">
      <h3>Previous Combo:<br/>{{ formatCombo(previousCombo) }}</h3>
    </div>

    <!-- BINGO board -->
    <div class="bingo-board">
      <div class="column">
        <h3>B</h3>
        <div v-for="combo in sortedBoard.B" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>I</h3>
        <div v-for="combo in sortedBoard.I" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>N</h3>
        <div v-for="combo in sortedBoard.N" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>G</h3>
        <div v-for="combo in sortedBoard.G" :key="combo">{{ formatCombo(combo) }}</div>
      </div>
      <div class="column">
        <h3>O</h3>
        <div v-for="combo in sortedBoard.O" :key="combo">{{ formatCombo(combo) }}</div>
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
      players: [] // List of players
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
  flex-direction: row;
  justify-content: center;
  justify-content: space-evenly;
  align-items: center;
  padding: 20px;
  flex-wrap: wrap;
  /* border: 3px solid green; */
}
.player-list, .current-combo, .previous-combo, .bingo-board {
  max-width: 25%;
}

.player-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  /* border: 2px solid red; */
}

.player{
  display: flex;
  flex-direction: row;
  align-items: right;
}

.current-combo {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 20px;
}

.current-combo h2{
  font-size: 1.25em;
}

.previous-combo {
  font-size: 1.2em;
  opacity: 0.6;
  margin-bottom: 20px;
}

.bingo-board {
  display: flex;
  justify-content: space-between;
  width: 25%;
  margin-bottom: 20px;
  border-top: 2px solid #333;
  border-left:2px solid #333;
}

.column {
  width: 15%;
  border-right: 2px solid #333;
  
}

.column h3 {
  text-align: center;
}

.column div {
  text-align: center;
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
</style>

<template>
  <div class="bingo-container">
    <!-- Player List and Bingo Trackers -->
    <div class="player-list">
      <h2>Players</h2>
      <div v-for="(player, index) in players" :key="index" class="player">
        <span>{{ player.name }}</span>
        <div class="bingo-checkboxes">
          <label v-for="n in 5" :key="n">
            <input type="checkbox" v-model="player.bingos[n - 1]" />
            Bingo {{ n }}
          </label>
        </div>
        <span v-if="player.bingos.filter(b => b).length === 5">Bingo!</span>
      </div>
    </div>

    <!-- Add Player Button -->
    <button @click="addPlayer">Add Player</button>


    <!-- Current Combo in the center -->
    <div class="current-combo">
      <button @click="fetchCombo">Call Next Combo</button>
      <h2>Current Combo: {{ formatCombo(currentCombo) }}</h2>
    </div>

    <!-- Previous Combo to the right -->
    <div class="previous-combo">
      <h3>Previous Combo: {{ formatCombo(previousCombo) }}</h3>
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
    addPlayer() {
      const playerName = prompt('Enter player name:');
      if (playerName) {
        this.players.push({ name: playerName, bingos: [false, false, false, false, false] });
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
    }
  },
  created() {
    this.fetchBoard(); // Load the initial state on mount
  }
};
</script>

<style scoped>
.bingo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.current-combo {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 20px;
}

.previous-combo {
  font-size: 1.2em;
  opacity: 0.6;
  margin-bottom: 20px;
}

.bingo-board {
  display: flex;
  justify-content: space-between;
  width: 60%;
  margin-bottom: 20px;
}

.column {
  width: 15%;
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

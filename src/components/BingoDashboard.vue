<template>
  <div>
    <h1>Bingo Dashboard</h1>
    <div>
      <h2>Current Combo: {{ formatCombo(currentCombo) }}</h2>
      <h3>Previous Combo: {{ formatCombo(previousCombo) }}</h3>
      <button @click="fetchCombo">Call Next Combo</button>
    </div>
    <div>
      <h2>Called Combos</h2>
      <ul>
        <li v-for="combo in board" :key="combo">{{ formatCombo(combo) }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
const API_URL = 'http://localhost:3000'; // Backend URL

export default {
  data() {
    return {
      currentCombo: null, // Last drawn combo
      previousCombo: null, // Combo before the last one
      board: [] // List of all called combos
    };
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

          // Update board
          this.board = data.calledCombos;
        } else {
          console.log('No new combo, all combos are called.');
          alert('All combos have been called!');
        }
      } catch (error) {
        console.error('Error fetching combo:', error);
        alert('Failed to fetch the next combo. Please try again.');
      }
    },
    async fetchBoard() {
      try {
        const response = await fetch(`${API_URL}/board`);
        const data = await response.json();

        console.log('Fetched board:', data);

        // Update board and combos
        this.board = data.calledCombos;
        this.currentCombo = data.currentCombo;
        this.previousCombo = this.board.length > 1 ? this.board[this.board.length - 2] : null;
      } catch (error) {
        console.error('Error fetching board:', error);
        alert('Failed to fetch the board state. Please refresh.');
      }
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.bingo-dashboard {
  text-align: center;
  font-family: Arial, sans-serif;
}

button {
  margin: 10px;
  padding: 8px 12px;
  font-size: 16px;
}

.current-combo, .previous-combo {
  margin: 20px 0;
}

.current-combo h2 {
  display: flex;
  flex-direction: column;
}

.current-combo h2 span {
  font-size: 32px;
  color: #333;
}

.bingo-board {
  display: inline-block;
  text-align: left;
  margin-top: 20px;
}

.bingo-board ul {
  list-style: none;
  padding: 0;
}

.bingo-board li {
  padding: 5px;
  font-size: 18px;
}
</style>

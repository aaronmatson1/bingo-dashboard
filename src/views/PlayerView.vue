<template>
  <div class="player-view">
    
    <!-- Login Screen -->
    <div v-if="!hasJoined" class="login-screen">
      <h1>Enter Name</h1>
      <input v-model="playerName" placeholder="Your Name" @keyup.enter="joinGame" />
      <button @click="joinGame" :disabled="!playerName">Join Game</button>
    </div>

    <!-- Game Board -->
    <div v-else class="game-screen">
      <div class="header" :class="{ cursed: isCursed }">
        <div class="player-info">{{ playerName }} <span v-if="isCursed">👻</span></div>
        <div class="last-called" v-if="lastCalled">
          Last: <span>{{ lastCalled }}</span>
        </div>
      </div>

      <!-- Player Curse Message -->
      <div v-if="curseMessage" class="curse-overlay">
        <div class="curse-content">
          <h2>{{ curseMessage }}</h2>
          <div class="ghost-animation">👻</div>
        </div>
      </div>

      <div class="bingo-grid">
        <!-- Headers -->
        <div class="grid-header">B</div>
        <div class="grid-header">I</div>
        <div class="grid-header">N</div>
        <div class="grid-header">G</div>
        <div class="grid-header">O</div>

        <!-- Cells (Transposed for Row rendering) -->
        <template v-for="row in 5" :key="row">
           <div v-for="col in ['B','I','N','G','O']" :key="col + row" 
                class="grid-cell" 
                :class="{ marked: isMarked(col, row-1), free: isFreeSpace(col, row-1) }"
                @click="toggleCell(col, row-1)">
              
              <span v-if="isFreeSpace(col, row-1)">FREE</span>
              <span v-else>{{ getNumber(col, row-1) }}</span>
           </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      playerName: '',
      playerId: null, // Stable tracking ID
      currentBingoCount: 0,
      hasJoined: false,
      board: { B:[], I:[], N:[], G:[], O:[] },
      marks: { B:[], I:[], N:[], G:[], O:[] }, // booleans
      lastCalled: null,
      isCursed: false,
      curseMessage: null
    };
  },
  methods: {
    joinGame() {
      if (!this.playerName && !this.playerId) return; // Need name or ID
      
      this.socket = io();
      
      // Attempt rejoin if we know ID
      if (this.playerId) {
          this.socket.emit('join', { playerId: this.playerId, name: this.playerName });
      } else {
          this.socket.emit('join', { name: this.playerName });
      }
      
      this.socket.on('welcome', (data) => {
        this.board = data.board;
        // Save session
        if (data.playerId) {
            this.playerId = (data.playerId);
            localStorage.setItem('bingoPlayerId', data.playerId);
        }
        
        // Restore bingos if we reconnected
         if(data.bingos) {
            // Re-calc marks from server state? Or just trust board?
            // Actually server tracks 'bingos', not individual marks. 
            // We might want to persist marks locally too, or just let user re-mark.
            // For now, let's keep it simple: if board reloaded, marks are reset visually unless we stored them.
            // IMPROVEMENT: Store marks in localStorage too
            const savedMarks = localStorage.getItem('bingoMarks');
            if (savedMarks) {
                try {
                    this.marks = JSON.parse(savedMarks);
                } catch(e) {}
            }
        }
        
        // Initialize marks if empty (new game)
        if (!this.marks.B || this.marks.B.length === 0) {
            this.marks = {
            B: [false, false, false, false, false],
            I: [false, false, false, false, false],
            N: [false, false, true, false, false], // Free space
            G: [false, false, false, false, false],
            O: [false, false, false, false, false]
            };
        }
        
        this.hasJoined = true;
      });

      this.socket.on('newCombo', (combo) => {
        this.lastCalled = combo;
      });

      this.socket.on('curseTriggered', ({ playerId, playerName }) => {
        if (playerId === this.playerId) {
          this.isCursed = true;
          this.curseMessage = "YOU HAVE BEEN CURSED!";
          this.triggerCursedAnimation();
          
          setTimeout(() => {
            this.curseMessage = null;
          }, 5000);
        }
      });
    },
    getNumber(col, index) {
      if (!this.board[col]) return '';
      return this.board[col][index];
    },
    isFreeSpace(col, index) {
      return col === 'N' && index === 2;
    },
    isMarked(col, index) {
      if (this.isFreeSpace(col, index)) return true;
      return this.marks[col][index];
    },
    toggleCell(col, index) {
      if (this.isFreeSpace(col, index)) return;
      this.marks[col][index] = !this.marks[col][index];
      
      // Persist marks
      localStorage.setItem('bingoMarks', JSON.stringify(this.marks));
      
      // Check for Bingo and emit if needed
      this.checkBingo();
    },
    checkBingo() {
        const cols = ['B','I','N','G','O'];
        let bingoCount = 0;

        // Check Columns
        for (const col of cols) {
            if (this.marks[col].every((m, i) => {
                 if (col === 'N' && i === 2) return true; // Free space
                 return m;
            })) bingoCount++;
        }

        // Check Rows
        for (let r = 0; r < 5; r++) {
            let rowWin = true;
            for (const col of cols) {
                if (col === 'N' && r === 2) continue;
                if (!this.marks[col][r]) rowWin = false;
            }
            if (rowWin) bingoCount++;
        }

        // Check Diagonals
        // 1. TL to BR
        if (
            this.marks['B'][0] && this.marks['I'][1] && 
            /* Free N[2] */ 
            this.marks['G'][3] && this.marks['O'][4]
        ) bingoCount++;

        // 2. BL to TR
        if (
             this.marks['B'][4] && this.marks['I'][3] && 
             /* Free N[2] */ 
             this.marks['G'][1] && this.marks['O'][0]
        ) bingoCount++;

        // Check 4 Corners
        if (
            this.marks['B'][0] && this.marks['B'][4] &&
            this.marks['O'][0] && this.marks['O'][4]
        ) bingoCount++;

        if (bingoCount > this.currentBingoCount) {
            this.triggerConfetti(true);
            this.socket.emit('playerBingo', { bingoCount });
        }
        this.currentBingoCount = bingoCount;
    },
    triggerConfetti(isBingo = false) {
      // Lazy load confetti for player
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: isBingo ? 150 : 50,
          spread: isBingo ? 100 : 60,
          origin: { y: 0.7 },
          colors: isBingo ? ["#ff0000", "#00ff00", "#0000ff"] : undefined,
        });
      });
    },
    triggerCursedAnimation() {
      // Lazy load confetti for curse effect (dark colors)
      import('canvas-confetti').then((confetti) => {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
          confetti.default({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#000000', '#4B0082', '#800000']
          });
          confetti.default({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#000000', '#4B0082', '#800000']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      });
    }
  },
  mounted() {
     // Check for existing session
     const savedId = localStorage.getItem('bingoPlayerId');
     if (savedId) {
         this.playerId = savedId;
         // We might not have name, but server might know us by ID.
         // If server restarted, we might lose name. 
         // Let's rely on ID primarily.
         this.joinGame();
     }
  }
};
</script>

<style scoped>
.player-view {
  display: flex;
  flex-direction: column;
  height: 100vh; /* Fallback */
  height: 100dvh; /* Dynamic viewport height for mobile browsers */
  background-color: #2c3e50;
  color: white;
  overflow: hidden; /* Prevent scrolling */
}

.login-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  padding: 20px;
}

input {
  padding: 15px;
  font-size: 1.5rem;
  border-radius: 8px;
  border: none;
  text-align: center;
  width: 100%;
  max-width: 300px;
}

.game-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  max-width: 600px; /* Limit width on tablets/desktop */
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 1.2rem;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  margin-bottom: 10px;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.last-called span {
  font-weight: bold;
  color: #ffd700;
  font-size: 1.5rem;
}

.bingo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: auto repeat(5, 1fr); /* Header row + 5 data rows */
  gap: 6px;
  flex-grow: 1;
  /* Ensure the grid fits within the remaining height */
  min-height: 0; 
  padding-bottom: 10px; /* Safe area padding */
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.8rem;
  color: rgba(255,255,255,0.6);
  padding: 5px 0;
}

.grid-cell {
  background-color: #ecf0f1;
  color: #2c3e50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 5vw, 1.8rem); /* Responsive font size */
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  position: relative;
  /* Remove fixed aspect-ratio to allow flex grow fitting */
  height: 100%; 
  width: 100%;
  box-shadow: 0 2px 0 rgba(0,0,0,0.1);
}

.grid-cell:active {
  transform: translateY(2px);
  box-shadow: none;
}

.grid-cell.marked {
  background-color: #e74c3c;
  color: white;
  animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.grid-cell.free {
  background-color: #f1c40f; 
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  line-height: 1;
}

/* Landscape Tweaks */
@media (orientation: landscape) and (max-height: 600px) {
  .game-screen {
    flex-direction: row;
    gap: 20px;
  }
  .header {
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    width: 150px;
    height: auto;
    margin-bottom: 0;
  }
  .bingo-grid {
    height: 100%;
    width: auto; /* Let aspect ratio determine width */
    aspect-ratio: 5/6; /* 5 width, 6 height (headers + 5 rows) */
  }
}

@keyframes pop {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.header.cursed {
  border: 2px solid #e74c3c;
  background: rgba(231, 76, 60, 0.2);
}

.curse-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.5s;
}

.curse-content {
  text-align: center;
  color: #e74c3c;
}

.curse-content h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.ghost-animation {
  font-size: 5rem;
  animation: float 2s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>

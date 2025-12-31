# Bingo Dashboard

A real-time, interactive Bingo game platform inspired by Jackbox Games. Players join from their own devices, receive a unique Bingo board, and mark off numbers as the Host calls them.

## Features

* **Real-time Interaction:** Socket.io powered connections allow players to join instantly and see called numbers update live.
* **Mobile-First Player View:** a responsive interface for players to mark their boards on their phones.
* **Host Dashboard:** A central view for the game host to call numbers, see connected players, and track Bingos.
* **The "Curse":** A fun, random event that triggers a "Curse" on a player during the late game (Ghost icon + spooky message).
* **Automatic Bingo Detection:** The server tracks player boards and notifies the Host when a Bingo is achieved.

## Project Setup

This project consists of two parts: the **Vue.js Frontend** (root) and the **Node.js/Express Backend** (`bingo-api`). You must run both for the game to work.

### 1. Installation

**Frontend Dependencies:**

```bash
npm install
```

**Backend Dependencies:**

```bash
cd bingo-api
npm install
cd ..
```

### 2. Running the Game

You need two terminal windows open.

#### Terminal 1: Start the Backend API

```bash
cd bingo-api
node index.js
```

*The server will start on port 3000.*

#### Terminal 2: Start the Frontend

```bash
npm run serve
```

*The app will be served at `http://localhost:8080/` (or similar).*

## How to Play

### For the Host

1. Open `http://localhost:8080/` on your computer/monitor/TV.
2. Click **Host Game**.
3. As players join, their names will appear on your screen.
4. Click **Call Next Combo** to draw a number. This sends the number to all players' screens.
5. Watch for "Bingo!" indicators next to player names!

### For Players

1. Ensure you are on the same Wi-Fi network as the Host.
2. Open the Host's IP address (e.g., `http://192.168.1.5:8080`) on your mobile phone browser.
3. Click **Join Game**.
4. Enter your Name and tap Join.
5. You will receive a randomized Bingo board.
6. When the Host calls a number, it will appear at the top of your screen ("Last Called").
7. Tap the number on your grid to mark it.
8. Mark 5 in a row (or diagnol) to get a BINGO!

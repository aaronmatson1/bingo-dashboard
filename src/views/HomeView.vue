<template>
  <div class="home">
    <div class="logo">
      <h1>BINGO</h1>
    </div>
    <div class="actions">
      <router-link to="/game" class="btn btn-primary">Join Game</router-link>
      <router-link to="/host" class="btn btn-secondary">Host Game</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 40px;
}

h1 {
  font-size: 8rem;
  margin: 0;
  text-shadow: 4px 4px 0px #000;
}

.actions {
  display: flex;
  gap: 20px;
  flex-direction: column;
}

.btn {
  padding: 20px 40px;
  font-size: 2rem;
  text-decoration: none;
  border-radius: 12px;
  border: 4px solid #000;
  font-weight: bold;
  text-transform: uppercase;
  min-width: 200px;
  text-align: center;
  transition: transform 0.1s;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background-color: #ffd700;
  color: black;
}

.btn-secondary {
  background-color: #fff;
  color: black;
}
</style>

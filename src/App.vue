<template>
  <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
  <HelloWorld/>
  <BingoDashboard />
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import BingoDashboard from './components/BingoDashboard.vue'

export default {
  name: 'App',
  components: {
    HelloWorld,
    BingoDashboard
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  background-color: #ffecb4;
}


</style>

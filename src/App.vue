<template>
  <router-view/>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import BingoDashboard from './components/BingoDashboard.vue'
import './assets/styles/global.less'

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
  color: #fff;
  margin-top: 60px;
  background-color: #004d00;
  height: 100vh;
}

/* h2{
  font-family: 'AnkhSanctuary', sans-serif;
} */

button {
  padding: 10px 20px;
  border-radius: 12px;
  border: 2px solid #8b0000;
  background-color: #005f01;
  color: white;
  font-weight: 400;
  font-size: 24px;
  padding: 14px 24px;
}

.inner-column {
  order: -1;
}

.inner-column,
.player-list {
  flex: 1;
}

</style>

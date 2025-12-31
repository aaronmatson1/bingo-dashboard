const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: 'all', // Allow connection from any host (e.g. mobile)
    // Proxy API requests to the backend
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true
      },
      '^/players': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '^/board': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '^/random-combo': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

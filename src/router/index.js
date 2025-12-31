import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HostView from '../views/HostView.vue'
import PlayerView from '../views/PlayerView.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView
    },
    {
        path: '/host',
        name: 'Host',
        component: HostView
    },
    {
        path: '/game',
        name: 'Game',
        component: PlayerView
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router

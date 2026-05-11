import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginPage.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/RegisterPage.vue'),
      meta: { title: '注册' },
    },
    {
      path: '/s/:code',
      name: 'ShareView',
      component: () => import('@/views/SharePage.vue'),
      meta: { title: '分享文件' },
    },
    {
      path: '/',
      component: () => import('@/components/Layout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/HomePage.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'files',
          name: 'Files',
          component: () => import('@/views/DashboardPage.vue'),
          meta: { title: '我的文件' },
        },
        {
          path: 'favorites',
          name: 'Favorites',
          component: () => import('@/views/FavoritesPage.vue'),
          meta: { title: '我的收藏' },
        },
        {
          path: 'recycle',
          name: 'Recycle',
          component: () => import('@/views/RecyclePage.vue'),
          meta: { title: '回收站' },
        },
        {
          path: 'search',
          name: 'Search',
          component: () => import('@/views/SearchPage.vue'),
          meta: { title: '搜索' },
        },
        {
          path: 'share-list',
          name: 'ShareList',
          component: () => import('@/views/ShareListPage.vue'),
          meta: { title: '我的分享' },
        },
        {
          path: 'admin/users',
          name: 'AdminUsers',
          component: () => import('@/views/AdminUsersPage.vue'),
          meta: { title: '用户管理', requiresAdmin: true },
        },
        {
          path: 'admin/config',
          name: 'AdminConfig',
          component: () => import('@/views/AdminConfigPage.vue'),
          meta: { title: '系统配置', requiresAdmin: true },
        },
        {
          path: 'admin/announcements',
          name: 'AdminAnnouncements',
          component: () => import('@/views/AnnouncementsPage.vue'),
          meta: { title: '公告管理' },
        },
        {
          path: 'announcements',
          name: 'Announcements',
          component: () => import('@/views/AnnouncementsPage.vue'),
          meta: { title: '系统公告' },
        },
        {
          path: 'analytics',
          name: 'Analytics',
          component: () => import('@/views/AnalyticsPage.vue'),
          meta: { title: '存储分析', requiresAdmin: true },
        },
        {
          path: 'preview/:fileId',
          name: 'Preview',
          component: () => import('@/views/PreviewPage.vue'),
          meta: { title: '文件预览' },
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || '私有学习资料云盘'

  const token = localStorage.getItem('token')
  const publicRoutes = ['/login', '/register']
  const shareRoute = to.path.startsWith('/s/')

  if (shareRoute) {
    next()
    return
  }

  if (!token && !publicRoutes.includes(to.path)) {
    next('/login')
    return
  }

  if (token && publicRoutes.includes(to.path)) {
    next('/dashboard')
    return
  }

  if (to.meta.requiresAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router

/**
 * Main App Controller - Routing, navigation, global utilities, theme switching
 */
const App = (() => {
  const MODULES = {
    home: { title: '首页', icon: '🏠', desc: '今日概况 · 快捷操作 · 最近动态', render: () => HomeModule.render(), module: HomeModule, theme: 'theme-home' },
    capture: { title: '快速采集', icon: '⚡', desc: '粘贴小红书/抖音链接，一键归入对应模块', render: () => CaptureModule.render(), module: CaptureModule, theme: 'theme-capture' },
    todo: { title: '待办看板', icon: '📋', desc: '管理你的任务，设置截止日期和提醒', render: () => TodoModule.render(), module: TodoModule, theme: 'theme-todo' },
    notes: { title: '灵感笔记', icon: '💡', desc: '快速记录想法，用标签归类整理', render: () => NotesModule.render(), module: NotesModule, theme: 'theme-notes' },
    english: { title: '口语训练', icon: '🗣️', desc: '记录口语问题、积累技巧、自动复盘', render: () => EnglishModule.render(), module: EnglishModule, theme: 'theme-english' },
    fitness: { title: '健身记录', icon: '💪', desc: '追踪体重、打卡记录、训练日志', render: () => FitnessModule.render(), module: FitnessModule, theme: 'theme-fitness' },
    jobs: { title: '求职管理', icon: '💼', desc: '投递追踪 + 跨行业管理 + 面试复盘', render: () => JobsModule.render(), module: JobsModule, theme: 'theme-jobs' },
    media: { title: '自媒体运营', icon: '📱', desc: '选题管理 · 数据追踪 · 复盘分析', render: () => MediaModule.render(), module: MediaModule, theme: 'theme-media' },
  };

  const THEMES = ['theme-home', 'theme-capture', 'theme-todo', 'theme-notes', 'theme-english', 'theme-fitness', 'theme-jobs', 'theme-media'];

  // Mobile: which modules are in bottom bar vs "more" panel
  const MOBILE_MAIN = ['home', 'capture', 'todo', 'notes'];
  const MOBILE_MORE = ['english', 'fitness', 'jobs', 'media'];

  let currentModule = 'home';

  // Compute badge counts
  function updateBadges() {
    const todoPending = DB.get('todo').filter(t => t.status !== 'done').length;
    const notesCount = DB.get('notes').length;
    const englishProblems = DB.get('english').problems.filter(p => !p.solved).length;
    const fitnessToday = DB.get('fitness').checkins.includes(new Date().toISOString().split('T')[0]);
    const jobsActive = DB.get('jobs').filter(j => j.status !== 'rejected').length;
    const mediaPending = DB.get('media').ideas.filter(i => !i.date || i.date >= new Date().toISOString().split('T')[0]).length;

    const setBadge = (id, value, showDot = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (showDot && value === 0) {
        el.textContent = '';
        el.style.display = 'none';
      } else if (value > 0) {
        el.textContent = value > 99 ? '99+' : String(value);
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    };

    setBadge('badge-todo', todoPending);
    setBadge('badge-notes', notesCount);
    setBadge('badge-english', englishProblems);
    setBadge('badge-fitness', '', !fitnessToday);
    setBadge('badge-jobs', jobsActive);
    setBadge('badge-media', mediaPending);
  }

  function init() {
    document.getElementById('sidebarNav').addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;
      const module = item.dataset.module;
      if (module) loadModule(module);
    });

    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
      mobileNav.addEventListener('click', (e) => {
        const item = e.target.closest('.mobile-nav-item');
        if (!item) return;
        const module = item.dataset.module;
        if (module === '_more') {
          showMorePanel();
        } else if (module) {
          loadModule(module);
        }
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('js/sw.js').then(function(reg) {
        // Check for updates every time app opens
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — reload immediately
              toast('🔄 发现新版本，正在更新...');
              setTimeout(function() { window.location.reload(); }, 800);
            }
          });
        });
      }).catch(function() {});
    }

    const saved = localStorage.getItem('wb_current_module');
    if (saved && MODULES[saved]) currentModule = saved;

    loadModule(currentModule);
    updateBadges();
  }

  function loadModule(name) {
    if (!MODULES[name]) return;
    currentModule = name;
    localStorage.setItem('wb_current_module', name);

    THEMES.forEach(t => document.body.classList.remove(t));
    document.body.classList.add(MODULES[name].theme);

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.module === name);
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      const m = item.dataset.module;
      item.classList.toggle('active', m === name || (MOBILE_MORE.includes(name) && m === '_more'));
    });

    closeMorePanel();

    const content = document.getElementById('mainContent');
    const mod = MODULES[name];
    // Each module manages its own header in render() — avoids duplicates
    content.innerHTML = mod.render();

    updateBadges();
  }

  function showMorePanel() {
    closeMorePanel();

    const backdrop = document.createElement('div');
    backdrop.className = 'more-panel-backdrop';
    backdrop.id = 'moreBackdrop';
    backdrop.addEventListener('click', closeMorePanel);

    const panel = document.createElement('div');
    panel.className = 'more-panel';
    panel.id = 'morePanel';

    MOBILE_MORE.forEach(key => {
      const mod = MODULES[key];
      panel.innerHTML += `<div class="more-panel-item" data-module="${key}" onclick="App.loadModule('${key}')">
        <div class="mp-icon">${mod.icon}</div>
        <span>${mod.title}</span>
      </div>`;
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
  }

  function closeMorePanel() {
    const backdrop = document.getElementById('moreBackdrop');
    const panel = document.getElementById('morePanel');
    if (backdrop) backdrop.remove();
    if (panel) panel.remove();
  }

  function openSidebarDrawer() {
    // Clone desktop sidebar content into drawer for mobile
    const drawer = document.getElementById('sidebarDrawer');
    const realSidebar = document.querySelector('aside.sidebar');
    if (drawer && realSidebar && !drawer.hasChildNodes()) {
      drawer.innerHTML = realSidebar.innerHTML;
    }
    if (drawer) drawer.classList.add('open');
    const bd = document.getElementById('sidebarDrawerBackdrop');
    if (bd) {
      bd.classList.add('show');
      bd.onclick = closeSidebarDrawer;
    }

    // Wire up nav clicks in the drawer
    if (drawer) {
      drawer.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
          const module = item.dataset.module;
          if (module) loadModule(module);
          closeSidebarDrawer();
        };
      });
    }
  }

  function closeSidebarDrawer() {
    const drawer = document.getElementById('sidebarDrawer');
    const bd = document.getElementById('sidebarDrawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (bd) bd.classList.remove('show');
  }

  function getCurrentModule() { return currentModule; }
  function getCurrentTheme() { return MODULES[currentModule]?.theme || 'theme-home'; }

  return { init, loadModule, getCurrentModule, getCurrentTheme, MODULES, showMorePanel, closeMorePanel, openSidebarDrawer, closeSidebarDrawer, updateBadges };
})();

function toast(msg) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.remove(); }, 2200);
}

document.addEventListener('DOMContentLoaded', () => App.init());

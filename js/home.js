/**
 * Home Dashboard Module - Overview landing page
 */
const HomeModule = (() => {
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 11) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    if (h < 23) return '晚上好';
    return '夜深了';
  }

  function getDateLabel() {
    const d = new Date();
    const days = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    return `${d.getMonth()+1}月${d.getDate()}日 ${days[d.getDay()]}`;
  }

  function countUndoneTodos() {
    return DB.get('todo').filter(t => t.status !== 'done').length;
  }

  function getRecentTodos() {
    return DB.get('todo').filter(t => t.status !== 'done').slice(0, 4);
  }

  function getRecentNotes() {
    return DB.get('notes').sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 3);
  }

  function getTodayCheckin() {
    const fitness = DB.get('fitness');
    const today = new Date().toISOString().split('T')[0];
    return fitness.checkins.includes(today);
  }

  function getStreak() {
    const checkins = DB.get('fitness').checkins;
    let streak = 0; const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().split('T')[0];
      if (checkins.includes(ds)) { streak++; d.setDate(d.getDate()-1); }
      else if (i === 0) { d.setDate(d.getDate()-1); continue; }
      else break;
    }
    return streak;
  }

  function getCaptureCount() {
    try {
      const history = JSON.parse(localStorage.getItem('wb_capture_history') || '[]');
      return history.length;
    } catch { return 0; }
  }

  function getSolvingProblems() {
    return DB.get('english').problems.filter(p => !p.solved).length;
  }

  function getInterviewingJobs() {
    return DB.get('jobs').filter(j => j.status === 'interview').length;
  }

  function getRecentCapture() {
    try {
      const history = JSON.parse(localStorage.getItem('wb_capture_history') || '[]');
      return history.slice(0, 3);
    } catch { return []; }
  }

  function render() {
    const undoneTodos = countUndoneTodos();
    const notes = DB.get('notes').length;
    const streak = getStreak();
    const captureCount = getCaptureCount();
    const solvingProblems = getSolvingProblems();
    const interviewingJobs = getInterviewingJobs();
    const todayCheckedIn = getTodayCheckin();
    const recentTodos = getRecentTodos();
    const recentNotes = getRecentNotes();
    const recentCapture = getRecentCapture();

    const greeting = getGreeting();
    const dateLabel = getDateLabel();
    const fullDate = `${dateLabel} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    let html = '';

    // Greeting section
    html += `<div class="home-greeting">
      <div class="greeting-title">${greeting}, Danielle <span class="greeting-wave">👋</span></div>
      <div class="greeting-subtitle">${notes > 0 ? `今天也继续保持 — 你已经有 ${notes} 条灵感笔记啦` : '今天辛苦了，开始处理你的任务吧'}</div>
      <div class="greeting-datetime">
        <span>📅 ${dateLabel}</span>
        <span>🕐 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      </div>
    </div>`;

    // Stats grid
    html += `<div class="home-stats">
      <div class="home-stat" onclick="App.loadModule('todo')">
        <div class="home-stat-icon" style="background:#eff6ff">📋</div>
        <div class="home-stat-value">${undoneTodos}<span class="unit">项</span></div>
        <div class="home-stat-label">待处理任务</div>
        <div class="home-stat-trend">${recentTodos.length > 0 ? `最早截止 ${recentTodos[0]?.dueDate || '未设置'}` : '点击添加任务'}</div>
      </div>
      <div class="home-stat" onclick="App.loadModule('fitness')">
        <div class="home-stat-icon" style="background:#ecfdf5">💪</div>
        <div class="home-stat-value">${streak}<span class="unit">天</span></div>
        <div class="home-stat-label">连续打卡</div>
        <div class="home-stat-trend">${todayCheckedIn ? '✅ 今天已打卡' : '⚠️ 今日未打卡'}</div>
      </div>
      <div class="home-stat" onclick="App.loadModule('english')">
        <div class="home-stat-icon" style="background:#f5f3ff">🗣️</div>
        <div class="home-stat-value">${solvingProblems}<span class="unit">个</span></div>
        <div class="home-stat-label">口语待解决</div>
        <div class="home-stat-trend">${solvingProblems > 0 ? '📝 继续练习吧' : '✨ 已全部解决'}</div>
      </div>
      <div class="home-stat" onclick="App.loadModule('capture')">
        <div class="home-stat-icon" style="background:#fff7ed">⚡</div>
        <div class="home-stat-value">${captureCount}<span class="unit">条</span></div>
        <div class="home-stat-label">采集入库</div>
        <div class="home-stat-trend">来自小红书/抖音</div>
      </div>
    </div>`;

    // Quick actions
    html += `<div class="home-actions">
      <button class="home-action-btn primary" onclick="App.loadModule('capture')">⚡ 快速采集</button>
      <button class="home-action-btn" onclick="TodoModule.openForm()">＋ 加任务</button>
      <button class="home-action-btn" onclick="NotesModule.openForm()">💡 写笔记</button>
      <button class="home-action-btn" onclick="FitnessModule.toggleCheckin()">💪 ${todayCheckedIn ? '已打卡 ✓' : '今日打卡'}</button>
      <button class="home-action-btn" onclick="App.loadModule('jobs')">💼 求职${interviewingJobs > 0 ? `(${interviewingJobs}面)` : ''}</button>
    </div>`;

    // Recent activity
    html += `<div class="home-recent">`;

    // Left: today's tasks + recent notes
    html += `<div>
      <div class="section-title">⭐ 今日待办</div>`;
      if (recentTodos.length === 0) {
        html += `<div class="empty" style="padding:24px"><div class="empty-text">所有任务都已完成 🎉</div></div>`;
      } else {
        recentTodos.forEach(t => {
          const isOverdue = t.dueDate && t.dueDate < new Date().toISOString().split('T')[0];
          html += `<div class="home-recent-item" onclick="TodoModule.openForm('${t.id}')">
            <div class="home-recent-icon" style="background:#dbeafe">📋</div>
            <div class="home-recent-info">
              <div class="home-recent-title">${esc(t.title)}</div>
              <div class="home-recent-meta">
                ${t.dueDate ? `<span style="color:${isOverdue?'#dc2626':'var(--text-tertiary)'}">${isOverdue?'⚠️':'📅'} ${t.dueDate}</span>` : ''}
                ${t.remind ? '<span>🔔 已设提醒</span>' : ''}
              </div>
            </div>
          </div>`;
        });
      }

      if (recentNotes.length > 0) {
        html += `<div class="section-title">📝 最近笔记</div>`;
        recentNotes.forEach(n => {
          html += `<div class="home-recent-item" onclick="NotesModule.openForm('${n.id}')">
            <div class="home-recent-icon" style="background:#fef3c7">💡</div>
            <div class="home-recent-info">
              <div class="home-recent-title">${esc(n.title)}</div>
              <div class="home-recent-meta">${n.updatedAt || n.createdAt} · ${n.tags.slice(0,2).map(t => `#${esc(t)}`).join(' ')}</div>
            </div>
          </div>`;
        });
      }

    html += `</div>`;

    // Right: quick stats + recent capture
    html += `<div>`;
    html += `<div class="section-title">📊 各模块进度</div>`;
    html += `<div class="card" style="padding:16px">`;
    html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span>💼 求职进度</span><strong>${DB.get('jobs').length} 条投递</strong></div>`;
    html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span>📱 自媒体内容</span><strong>${DB.get('media').ideas.length} 个选题 · ${DB.get('media').posts.length} 篇已发</strong></div>`;
    html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span>🗣️ 口语技巧</span><strong>${DB.get('english').techniques.length} 个技巧</strong></div>`;
    html += `<div style="display:flex;justify-content:space-between;padding:8px 0"><span>💡 灵感笔记</span><strong>${notes} 条</strong></div>`;
    html += `</div>`;

    if (recentCapture.length > 0) {
      html += `<div class="section-title">⚡ 最近采集</div>`;
      recentCapture.forEach(c => {
        const src = c.source === 'xiaohongshu' ? '📕' : c.source === 'douyin' ? '🎵' : '📝';
        html += `<div class="home-recent-item" onclick="App.loadModule('capture')">
          <div class="home-recent-icon" style="background:#fff7ed">${src}</div>
          <div class="home-recent-info">
            <div class="home-recent-title">${esc(c.title || '未命名').slice(0, 30)}</div>
            <div class="home-recent-meta">${c.date}</div>
          </div>
        </div>`;
      });
    }

    html += `</div>`;
    html += `</div>`;

    return html;
  }

  return { render };
})();

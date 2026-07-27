/**
 * Quick Capture Module
 * Paste links from Xiaohongshu/Douyin, auto-categorize into target modules
 */
const CaptureModule = (() => {
  function genId() { return 'c' + Date.now() + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function today() { return new Date().toISOString().split('T')[0]; }

  const CATEGORIES = [
    { id: 'notes', label: '灵感笔记', icon: '💡', targetModule: 'notes', targetField: 'notes' },
    { id: 'jobs', label: '求职面试', icon: '💼', targetModule: 'jobs', targetField: 'jobs' },
    { id: 'vibe-coding', label: 'Vibe Coding', icon: '💻', targetModule: 'notes', targetField: 'notes', tag: 'vibe coding' },
    { id: 'tech', label: '技术干货', icon: '🔧', targetModule: 'notes', targetField: 'notes', tag: '技术' },
    { id: 'english', label: '英语学习', icon: '🗣️', targetModule: 'english', targetField: 'english' },
    { id: 'media', label: '自媒体', icon: '📱', targetModule: 'media', targetField: 'media' },
  ];

  const QUICK_TAGS = ['今日必读', '稍后整理', '面试可用', '素材参考', '值得深挖'];

  let selectedCategory = 'notes';
  let selectedQuickTag = '';
  let fetchStatus = '';
  let fetchStatusType = '';

  function getHistory() {
    try {
      const raw = localStorage.getItem('wb_capture_history');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveHistory(items) {
    localStorage.setItem('wb_capture_history', JSON.stringify(items));
  }

  function detectSource(url) {
    if (/xiaohongshu\.com|xhslink\.com|xh-pacific/i.test(url)) return 'xiaohongshu';
    if (/douyin\.com|tiktok\.com|iesdouyin/i.test(url)) return 'douyin';
    return 'manual';
  }

  function render() {
    const history = getHistory();

    let html = `<div class="module-header">
      <div>
        <div class="module-title"><span class="module-title-icon">⚡</span>快速采集</div>
        <div class="module-desc">粘贴小红书/抖音链接，一键归入对应模块</div>
      </div>
    </div>`;

    // Hero capture input
    html += `<div class="capture-hero">
      <div class="capture-input-wrap">
        <input class="capture-input" id="captureInput"
          placeholder="粘贴小红书或抖音链接，或直接输入内容..."
          onkeydown="if(event.key==='Enter')CaptureModule.capture()"
          oninput="CaptureModule.onInputChange()">
        <button class="capture-btn" onclick="CaptureModule.capture()">采集</button>
      </div>
      <div class="capture-fetch-status ${fetchStatusType}" id="captureStatus">${fetchStatus}</div>

      <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:14px">选择归属模块</div>
      <div class="capture-categories" id="captureCats">
        ${CATEGORIES.map(c => `<div class="capture-cat ${c.id===selectedCategory?'selected':''}" data-cat="${c.id}" onclick="CaptureModule.selectCat('${c.id}')">${c.icon} ${c.label}</div>`).join('')}
      </div>

      <div style="font-size:12px;color:var(--text-tertiary);margin:14px 0 6px">快速标签（可选）</div>
      <div class="capture-quick-tags" id="captureQuickTags">
        ${QUICK_TAGS.map(t => `<div class="capture-quick-tag ${t===selectedQuickTag?'active':''}" onclick="CaptureModule.selectTag('${t}')">${t}</div>`).join('')}
      </div>

      <div class="capture-source-hint">
        <span class="capture-source-chip">📕 小红书 → 复制链接 → 粘贴到此</span>
        <span class="capture-source-chip">🎵 抖音 → 复制链接 → 粘贴到此</span>
      </div>
    </div>`;

    // History
    html += `<div class="section-title">📥 最近采集</div>`;
    if (history.length === 0) {
      html += `<div class="empty"><div class="empty-icon">📭</div><div class="empty-text">还没有采集记录，粘贴第一条链接开始吧</div></div>`;
    } else {
      html += `<div class="capture-history">`;
      history.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15).forEach(item => {
        const source = item.source || 'manual';
        const catInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];
        html += `<div class="capture-history-item" onclick="CaptureModule.openDetail('${item.id}')">
          <div class="capture-history-source ${source}">${source === 'xiaohongshu' ? '📕' : source === 'douyin' ? '🎵' : '📝'}</div>
          <div class="capture-history-info">
            <div class="capture-history-title">${esc(item.title || '未命名采集')}</div>
            <div class="capture-history-meta">
              <span>${catInfo.icon} ${catInfo.label}</span>
              <span>${item.date}</span>
              ${item.quickTag ? `<span class="tag tag-orange">${esc(item.quickTag)}</span>` : ''}
            </div>
          </div>
          <span class="capture-history-arrow">→</span>
        </div>`;
      });
      html += `</div>`;
      html += `<div style="text-align:center;margin-top:12px">
        <button class="btn btn-sm btn-danger" onclick="CaptureModule.clearHistory()">清空记录</button>
      </div>`;
    }

    return html;
  }

  function selectCat(id) {
    selectedCategory = id;
    document.querySelectorAll('.capture-cat').forEach(el => {
      el.classList.toggle('selected', el.dataset.cat === id);
    });
  }

  function selectTag(tag) {
    selectedQuickTag = selectedQuickTag === tag ? '' : tag;
    document.querySelectorAll('.capture-quick-tag').forEach(el => {
      el.classList.toggle('active', el.textContent === selectedQuickTag);
    });
  }

  function onInputChange() {
    const val = document.getElementById('captureInput')?.value || '';
    if (val.length > 5 && (val.includes('http') || val.includes('xhslink') || val.includes('douyin'))) {
      fetchStatus = '🔍 识别到链接，采集时将尝试获取标题...';
      fetchStatusType = '';
    } else {
      fetchStatus = '';
      fetchStatusType = '';
    }
    const statusEl = document.getElementById('captureStatus');
    if (statusEl) {
      statusEl.textContent = fetchStatus;
      statusEl.className = 'capture-fetch-status ' + fetchStatusType;
    }
  }

  async function capture() {
    const input = document.getElementById('captureInput');
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) { toast('请粘贴链接或输入内容'); return; }

    const source = detectSource(raw);
    const isURL = raw.startsWith('http');

    let title = raw;
    fetchStatus = '⏳ 正在获取标题...';
    fetchStatusType = '';
    updateStatus();

    // Try to fetch title from URL
    if (isURL) {
      try {
        const resp = await fetch(raw, { signal: AbortSignal.timeout(5000) });
        const html = await resp.text();
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (match) {
          title = match[1].trim()
            .replace(/[-–—|].*$/, '')  // Remove site name after separator
            .replace(/[\\s]{2,}/g, ' ')
            .slice(0, 100);
          fetchStatus = '✅ 已获取标题';
          fetchStatusType = 'success';
        } else {
          fetchStatus = '⚠️ 未能获取标题，将使用链接';
          fetchStatusType = 'error';
        }
      } catch (e) {
        fetchStatus = '⚠️ 无法访问链接，已作为文本保存';
        fetchStatusType = 'error';
      }
    } else {
      fetchStatus = '📝 已作为文本笔记保存';
      fetchStatusType = 'success';
    }
    updateStatus();

    // Save to history
    const history = getHistory();
    const captureItem = {
      id: genId(),
      title,
      url: isURL ? raw : '',
      source,
      category: selectedCategory,
      quickTag: selectedQuickTag,
      rawContent: raw,
      date: today(),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    history.unshift(captureItem);
    if (history.length > 50) history.length = 50;
    saveHistory(history);

    // Save to target module
    saveToModule(captureItem);

    // Reset
    input.value = '';
    selectedQuickTag = '';
    document.querySelectorAll('.capture-quick-tag').forEach(el => el.classList.remove('active'));
    refresh();
    toast(`已采集至「${CATEGORIES.find(c => c.id === captureItem.category)?.label || ''}」`);
  }

  function saveToModule(item) {
    const cat = CATEGORIES.find(c => c.id === item.category);
    if (!cat) return;
    const targetModule = cat.targetModule;

    if (targetModule === 'notes') {
      const notes = DB.get('notes');
      const tags = [cat.tag || cat.label, item.quickTag].filter(Boolean);
      if (item.source === 'xiaohongshu') tags.push('小红书');
      if (item.source === 'douyin') tags.push('抖音');
      notes.unshift({
        id: genId(),
        title: item.title,
        content: `📎 来源：${item.url || '手动输入'}\n\n${item.rawContent}`,
        tags,
        createdAt: item.date,
        updatedAt: item.date,
        sourceUrl: item.url,
      });
      DB.set('notes', notes);
    } else if (targetModule === 'jobs') {
      const jobs = DB.get('jobs');
      jobs.unshift({
        id: genId(),
        company: item.title,
        position: item.quickTag || '待定',
        industry: '待分类',
        crossIndustry: false,
        date: item.date,
        status: 'applied',
        stage: '待投递',
        note: `📎 采集来源：${item.source === 'xiaohongshu' ? '小红书' : item.source === 'douyin' ? '抖音' : '手动'}\n${item.url}`,
        review: '',
      });
      DB.set('jobs', jobs);
    } else if (targetModule === 'english') {
      const data = DB.get('english');
      data.techniques.unshift({
        id: genId(),
        title: item.title,
        content: `📎 来源：${item.url || '手动输入'}\n\n${item.rawContent}`,
        tags: [item.quickTag || '采集'].filter(Boolean),
        date: item.date,
      });
      DB.set('english', data);
    } else if (targetModule === 'media') {
      const data = DB.get('media');
      data.ideas.unshift({
        id: genId(),
        title: item.title,
        platform: item.source === 'douyin' ? '抖音' : '小红书',
        category: item.quickTag || '选题',
        score: 5,
        note: item.url || item.rawContent,
        date: item.date,
      });
      DB.set('media', data);
    }
  }

  function updateStatus() {
    const el = document.getElementById('captureStatus');
    if (el) {
      el.textContent = fetchStatus;
      el.className = 'capture-fetch-status ' + fetchStatusType;
    }
  }

  function openDetail(id) {
    const history = getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;
    const cat = CATEGORIES.find(c => c.id === item.category);
    const html = `<div class="modal-overlay" onclick="if(event.target===this)CaptureModule.closeForm()">
      <div class="modal"><div class="modal-title">采集详情</div>
        <div style="margin-bottom:12px"><span class="tag tag-orange">${cat?.icon||''} ${cat?.label||''}</span> ${item.quickTag ? `<span class="tag tag-blue">${esc(item.quickTag)}</span>` : ''}</div>
        <div style="font-weight:650;margin-bottom:8px">${esc(item.title)}</div>
        ${item.url ? `<div style="font-size:13px;color:var(--accent);margin-bottom:8px;word-break:break-all"><a href="${esc(item.url)}" target="_blank">🔗 ${esc(item.url)}</a></div>` : ''}
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">${esc(item.rawContent)}</div>
        <div style="font-size:12px;color:var(--text-tertiary);margin-top:12px">${item.date} ${item.time} · 来源：${item.source==='xiaohongshu'?'📕 小红书':item.source==='douyin'?'🎵 抖音':'📝 手动'}</div>
        <div class="modal-actions">
          <button class="btn btn-danger btn-sm" onclick="CaptureModule.deleteItem('${id}')">删除</button>
          <button class="btn btn-secondary" onclick="CaptureModule.closeForm()">关闭</button>
        </div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function deleteItem(id) {
    if (!confirm('确定删除？')) return;
    const history = getHistory().filter(h => h.id !== id);
    saveHistory(history);
    closeForm();
    refresh();
    toast('已删除');
  }

  function clearHistory() {
    if (!confirm('确定清空所有采集记录？注意：已归入各模块的内容不受影响。')) return;
    saveHistory([]);
    refresh();
    toast('采集记录已清空');
  }

  function closeForm() { document.getElementById('modalContainer').innerHTML = ''; }
  function refresh() { App.loadModule('capture'); }

  return { render, capture, selectCat, selectTag, onInputChange, openDetail, deleteItem, clearHistory, closeForm, refresh };
})();

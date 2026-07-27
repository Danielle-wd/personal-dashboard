/**
 * Social Media Module - Content ideas, post tracking, analytics, review
 */
const MediaModule = (() => {
  function genId() { return 'm' + Date.now() + Math.random().toString(36).slice(2,6); }
  function getData() { return DB.get('media'); }
  function saveData(data) { DB.set('media', data); }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  let tab = 'ideas';
  let filterPlatform = 'all';

  function render() {
    const data = getData();
    const { ideas, posts } = data;

    // Analytics
    const totalViews = posts.reduce((s, p) => s + p.views, 0);
    const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments, 0);
    const totalShares = posts.reduce((s, p) => s + p.shares, 0);
    const avgEngagement = posts.length > 0 ? ((totalLikes + totalComments + totalShares) / (totalViews || 1) * 100).toFixed(1) : '0';
    const platforms = [...new Set(posts.map(p => p.platform))];

    let html = `<div class="module-header">
      <div><div class="module-title"><span class="module-title-icon">📱</span>自媒体运营</div><div class="module-desc">选题管理 · 数据追踪 · 复盘分析</div></div>
    </div>`;

    // Analytics dashboard
    html += `<div class="card" style="margin-bottom:20px"><div class="card-header"><h3>📊 数据看板</h3></div>
      <div class="metrics-grid">
        <div class="stat-card"><div class="stat-number">${posts.length}</div><div class="stat-label">发布数</div></div>
        <div class="stat-card"><div class="stat-number">${formatNum(totalViews)}</div><div class="stat-label">总阅读量</div></div>
        <div class="stat-card"><div class="stat-number">${formatNum(totalLikes)}</div><div class="stat-label">总点赞</div></div>
        <div class="stat-card"><div class="stat-number">${avgEngagement}%</div><div class="stat-label">互动率</div></div>
      </div>
    </div>`;

    // Review summary
    html += `<div class="card review-card" style="margin-bottom:20px">
      <div class="card-header"><h3>📝 复盘分析</h3></div>
      ${generateReview(posts, ideas)}
    </div>`;

    // Post performance list
    if (posts.length > 0) {
      html += `<div class="card" style="margin-bottom:20px"><div class="card-header"><h3>🏆 内容表现</h3></div>`;
      posts.sort((a,b) => (b.views + b.likes*10 + b.comments*5 + b.shares*8) - (a.views + a.likes*10 + a.comments*5 + a.shares*8)).slice(0,5).forEach((p,i) => {
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px;font-weight:700;color:var(--text-tertiary);width:24px">${i+1}</span>
            <div><strong>${esc(p.title)}</strong><div style="font-size:12px;color:var(--text-tertiary)">${esc(p.platform)} · ${p.date}</div></div>
          </div>
          <div style="display:flex;gap:16px;font-size:12px;color:var(--text-secondary)">
            <span>👁 ${formatNum(p.views)}</span><span>❤️ ${formatNum(p.likes)}</span><span>💬 ${formatNum(p.comments)}</span><span>🔄 ${formatNum(p.shares)}</span>
          </div>
        </div>`;
      });
      html += '</div>';
    }

    // Tabs
    html += `<div class="english-tabs" style="margin-bottom:16px">
      <div class="english-tab ${tab==='ideas'?'active':''}" onclick="MediaModule.switchTab('ideas')">💡 选题库 (${ideas.length})</div>
      <div class="english-tab ${tab==='posts'?'active':''}" onclick="MediaModule.switchTab('posts')">📝 发布记录 (${posts.length})</div>
    </div>`;

    if (tab === 'ideas') {
      html += `<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-primary btn-sm" onclick="MediaModule.openIdeaForm()">+ 新选题</button></div>`;
      if (ideas.length === 0) {
        html += `<div class="empty"><div class="empty-icon">💡</div><div class="empty-text">选题库还是空的，看到好点子就记下来吧</div></div>`;
      } else {
        html += '<div class="grid-2">';
        ideas.sort((a,b) => b.score - a.score).forEach(idea => {
          html += `<div class="media-idea-card" style="cursor:pointer" onclick="MediaModule.openIdeaForm('${idea.id}')">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <strong>${esc(idea.title)}</strong><span style="font-size:12px;color:var(--accent);font-weight:600">★ ${idea.score}/10</span>
            </div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${esc(idea.note||'')}</div>
            <div style="display:flex;gap:6px">
              <span class="tag tag-blue">${esc(idea.platform)}</span><span class="tag tag-purple">${esc(idea.category)}</span><span style="font-size:11px;color:var(--text-tertiary);margin-left:auto">${idea.date}</span>
            </div>
          </div>`;
        });
        html += '</div>';
      }
    } else {
      html += `<div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <select class="select" style="width:auto" onchange="MediaModule.setPlatform(this.value)"><option value="all">全部平台</option>${platforms.map(p=>`<option value="${p}" ${filterPlatform===p?'selected':''}>${esc(p)}</option>`).join('')}</select>
        <button class="btn btn-primary btn-sm" onclick="MediaModule.openPostForm()">+ 记录发布</button>
      </div>`;
      let filtered = posts; if (filterPlatform !== 'all') filtered = filtered.filter(p => p.platform === filterPlatform);
      if (filtered.length === 0) {
        html += `<div class="empty"><div class="empty-icon">📝</div><div class="empty-text">还没有发布记录</div></div>`;
      } else {
        filtered.sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(p => {
          html += `<div class="card" style="margin-bottom:10px" onclick="MediaModule.openPostForm('${p.id}')">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div><strong>${esc(p.title)}</strong><span style="font-size:12px;color:var(--text-tertiary);margin-left:10px">${esc(p.platform)} · ${p.date}</span></div>
              <div style="display:flex;gap:16px;font-size:12px;color:var(--text-secondary)">
                <span>👁 ${formatNum(p.views)}</span><span>❤️ ${formatNum(p.likes)}</span><span>💬 ${formatNum(p.comments)}</span>
              </div>
            </div>
          </div>`;
        });
      }
    }

    return html;
  }

  function generateReview(posts, ideas) {
    if (posts.length === 0) {
      return '<div style="font-size:13px;color:var(--text-tertiary)">发布内容后，这里将自动生成数据复盘分析。</div>';
    }
    const sorted = [...posts].sort((a,b) => (b.views+b.likes*10+b.comments*5+b.shares*8) - (a.views+a.likes*10+a.comments*5+b.shares*8));
    const best = sorted[0];
    const byPlatform = {}; posts.forEach(p => { byPlatform[p.platform] = (byPlatform[p.platform]||0) + p.views; });
    const topPlatform = Object.entries(byPlatform).sort((a,b)=>b[1]-a[1])[0];

    let html = '<ul style="font-size:13px;color:var(--text-secondary);line-height:1.8">';
    html += `<li>🏆 表现最佳：「${esc(best.title)}」— ${formatNum(best.views)} 阅读 / ${formatNum(best.likes)} 点赞</li>`;
    if (topPlatform) html += `<li>📱 流量最高平台：<strong>${esc(topPlatform[0])}</strong>（${formatNum(topPlatform[1])} 总阅读）</li>`;
    html += `<li>📊 共发布 <strong>${posts.length}</strong> 篇内容</li>`;
    html += `<li>💡 选题库储备 <strong>${ideas.length}</strong> 个 idea</li>`;
    if (ideas.length > 0) {
      const topIdea = [...ideas].sort((a,b)=>b.score-a.score)[0];
      html += `<li>⭐ 高分待做选题：「${esc(topIdea.title)}」（评分 ${topIdea.score}/10）</li>`;
    }
    html += '</ul>';
    return html;
  }

  function formatNum(n) { if (n >= 10000) return (n/10000).toFixed(1)+'w'; if (n >= 1000) return (n/1000).toFixed(1)+'k'; return String(n); }

  function switchTab(t) { tab = t; refresh(); }
  function setPlatform(p) { filterPlatform = p; refresh(); }

  function openIdeaForm(id) {
    const idea = id ? getData().ideas.find(i => i.id === id) : null;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)MediaModule.closeForm()">
      <div class="modal"><div class="modal-title">${idea?'编辑':'新增'}选题</div>
        <div class="form-group"><label class="form-label">标题</label><input class="input" id="miTitle" value="${idea?esc(idea.title):''}"></div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">平台</label><select class="select" id="miPlatform"><option value="小红书" ${idea&&idea.platform==='小红书'?'selected':''}>小红书</option><option value="公众号" ${idea&&idea.platform==='公众号'?'selected':''}>公众号</option><option value="抖音" ${idea&&idea.platform==='抖音'?'selected':''}>抖音</option><option value="B站" ${idea&&idea.platform==='B站'?'selected':''}>B站</option><option value="知乎" ${idea&&idea.platform==='知乎'?'selected':''}>知乎</option><option value="微博" ${idea&&idea.platform==='微博'?'selected':''}>微博</option></select></div>
          <div class="form-group"><label class="form-label">分类</label><input class="input" id="miCategory" value="${idea?esc(idea.category):''}"></div>
        </div>
        <div class="form-group"><label class="form-label">爆款指数 (1-10)</label><input class="input" id="miScore" type="number" min="1" max="10" value="${idea?idea.score:'5'}"></div>
        <div class="form-group"><label class="form-label">备注</label><textarea class="input textarea" id="miNote">${idea?esc(idea.note||''):''}</textarea></div>
        <div class="modal-actions">
          ${idea ? `<button class="btn btn-danger" onclick="MediaModule.deleteIdea('${id}')">删除</button>` : ''}
          <button class="btn btn-secondary" onclick="MediaModule.closeForm()">取消</button><button class="btn btn-primary" onclick="MediaModule.saveIdea('${idea?id:''}')">保存</button>
        </div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function saveIdea(id) {
    const title = document.getElementById('miTitle').value.trim(); if (!title) { toast('请输入标题'); return; }
    const data = getData(); const platform = document.getElementById('miPlatform').value;
    const category = document.getElementById('miCategory').value.trim();
    const score = parseInt(document.getElementById('miScore').value)||5;
    const note = document.getElementById('miNote').value.trim();
    if (id) { const idx = data.ideas.findIndex(i=>i.id===id); if (idx>=0) Object.assign(data.ideas[idx], {title,platform,category,score,note}); }
    else { data.ideas.push({ id: genId(), title, platform, category, score, note, date: new Date().toISOString().split('T')[0] }); }
    saveData(data); closeForm(); refresh(); toast('保存成功');
  }

  function deleteIdea(id) { if (!confirm('确定删除？')) return; const data = getData(); data.ideas = data.ideas.filter(i => i.id !== id); saveData(data); refresh(); toast('已删除'); }

  function openPostForm(id) {
    const post = id ? getData().posts.find(p => p.id === id) : null;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)MediaModule.closeForm()">
      <div class="modal"><div class="modal-title">${post?'编辑':'新增'}发布记录</div>
        <div class="form-group"><label class="form-label">标题</label><input class="input" id="mpTitle" value="${post?esc(post.title):''}"></div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">平台</label><select class="select" id="mpPlatform"><option value="小红书" ${post&&post.platform==='小红书'?'selected':''}>小红书</option><option value="公众号" ${post&&post.platform==='公众号'?'selected':''}>公众号</option><option value="抖音" ${post&&post.platform==='抖音'?'selected':''}>抖音</option><option value="B站" ${post&&post.platform==='B站'?'selected':''}>B站</option><option value="知乎" ${post&&post.platform==='知乎'?'selected':''}>知乎</option><option value="微博" ${post&&post.platform==='微博'?'selected':''}>微博</option></select></div>
          <div class="form-group"><label class="form-label">发布日期</label><input class="input" id="mpDate" type="date" value="${post?post.date:new Date().toISOString().split('T')[0]}"></div>
        </div>
        <div class="grid-4">
          <div class="form-group"><label class="form-label">阅读量</label><input class="input" id="mpViews" type="number" value="${post?post.views:'0'}"></div>
          <div class="form-group"><label class="form-label">点赞</label><input class="input" id="mpLikes" type="number" value="${post?post.likes:'0'}"></div>
          <div class="form-group"><label class="form-label">评论</label><input class="input" id="mpComments" type="number" value="${post?post.comments:'0'}"></div>
          <div class="form-group"><label class="form-label">分享</label><input class="input" id="mpShares" type="number" value="${post?post.shares:'0'}"></div>
        </div>
        <div class="modal-actions">
          ${post?`<button class="btn btn-danger" onclick="MediaModule.deletePost('${id}')">删除</button>`:''}
          <button class="btn btn-secondary" onclick="MediaModule.closeForm()">取消</button><button class="btn btn-primary" onclick="MediaModule.savePost('${post?id:''}')">保存</button>
        </div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function savePost(id) {
    const title = document.getElementById('mpTitle').value.trim(); if (!title) { toast('请输入标题'); return; }
    const data = getData(); const post = { platform: document.getElementById('mpPlatform').value, date: document.getElementById('mpDate').value, views: parseInt(document.getElementById('mpViews').value)||0, likes: parseInt(document.getElementById('mpLikes').value)||0, comments: parseInt(document.getElementById('mpComments').value)||0, shares: parseInt(document.getElementById('mpShares').value)||0 };
    if (id) { const idx = data.posts.findIndex(p=>p.id===id); if (idx>=0) { post.title = title; Object.assign(data.posts[idx], post); } }
    else { data.posts.push({ id: genId(), title, ...post }); }
    saveData(data); closeForm(); refresh(); toast('保存成功');
  }

  function deletePost(id) { if (!confirm('确定删除？')) return; const data = getData(); data.posts = data.posts.filter(p => p.id !== id); saveData(data); refresh(); toast('已删除'); }

  function closeForm() { document.getElementById('modalContainer').innerHTML = ''; }
  function refresh() { App.loadModule('media'); }

  return { render, switchTab, setPlatform, openIdeaForm, saveIdea, deleteIdea, openPostForm, savePost, deletePost, closeForm, refresh };
})();

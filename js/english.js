/**
 * English Speaking Module
 * Problem tracker, technique library, auto-review summary
 */
const EnglishModule = (() => {
  function genId() { return 'e' + Date.now() + Math.random().toString(36).slice(2,6); }
  function getData() { return DB.get('english'); }
  function saveData(data) { DB.set('english', data); }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  const CATEGORIES = {
    pronunciation: { label: '发音', color: 'tag-blue' },
    fluency: { label: '流利度', color: 'tag-green' },
    grammar: { label: '语法', color: 'tag-orange' },
    vocabulary: { label: '词汇', color: 'tag-purple' },
    expression: { label: '表达', color: 'tag-red' },
    listening: { label: '听力理解', color: 'tag-orange' },
  };

  let tab = 'problems';

  function render() {
    const data = getData();
    const { problems, techniques } = data;
    const unsolved = problems.filter(p => !p.solved).length;
    const totalProblems = problems.length;
    const totalTechniques = techniques.length;
    const recentProblems = problems.filter(p => {
      const d = new Date(p.date); const weekAgo = Date.now() - 7*86400000;
      return d.getTime() > weekAgo;
    }).length;

    let html = `<div class="module-header">
      <div><div class="module-title"><span class="module-title-icon">🗣️</span>口语训练</div><div class="module-desc">记录口语问题、积累技巧、自动复盘</div></div>
    </div>`;

    // Stats row
    html += `<div class="grid-4" style="margin-bottom:20px">
      <div class="card stat-card"><div class="stat-number" style="color:var(--danger)">${unsolved}</div><div class="stat-label">待解决问题</div></div>
      <div class="card stat-card"><div class="stat-number">${totalProblems}</div><div class="stat-label">累计问题</div></div>
      <div class="card stat-card"><div class="stat-number">${totalTechniques}</div><div class="stat-label">技巧积累</div></div>
      <div class="card stat-card"><div class="stat-number">${recentProblems}</div><div class="stat-label">近7天新问题</div></div>
    </div>`;

    // Auto review
    html += `<div class="card" style="margin-bottom:20px">
      <div class="card-header"><h3>📊 自动复盘摘要</h3></div>
      ${generateReview(problems, techniques)}
    </div>`;

    // Tabs
    html += `<div class="english-tabs">
      <div class="english-tab ${tab==='problems'?'active':''}" onclick="EnglishModule.switchTab('problems')">口语问题 (${problems.length})</div>
      <div class="english-tab ${tab==='techniques'?'active':''}" onclick="EnglishModule.switchTab('techniques')">技巧库 (${techniques.length})</div>
    </div>`;

    if (tab === 'problems') {
      html += `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn btn-primary btn-sm" onclick="EnglishModule.openProblemForm()">+ 记录问题</button>
      </div>`;
      if (problems.length === 0) {
        html += `<div class="empty"><div class="empty-icon">🗣️</div><div class="empty-text">还没有记录口语问题</div></div>`;
      } else {
        problems.sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(p => {
          const cat = CATEGORIES[p.category] || CATEGORIES.pronunciation;
          html += `<div class="card" style="margin-bottom:10px;${p.solved?'opacity:0.6':''}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <div><span class="tag ${cat.color}">${cat.label}</span> <strong style="margin-left:8px">${esc(p.title)}</strong></div>
              <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:12px;color:var(--text-tertiary)">${p.date}</span>
                ${p.solved ? '<span class="tag tag-green">已解决</span>' : `<button class="btn btn-sm btn-secondary" onclick="EnglishModule.toggleSolved('${p.id}')">标记解决</button>`}
                <button class="btn btn-sm btn-danger" onclick="EnglishModule.deleteProblem('${p.id}')" style="font-size:12px">删除</button>
              </div>
            </div>
            <div style="color:var(--text-secondary);font-size:13px;margin-bottom:6px">${esc(p.detail)}</div>
            ${p.solution ? `<div style="background:var(--accent-light);padding:8px 12px;border-radius:6px;font-size:13px">💡 ${esc(p.solution)}</div>` : ''}
          </div>`;
        });
      }
    } else {
      html += `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn btn-primary btn-sm" onclick="EnglishModule.openTechniqueForm()">+ 添加技巧</button>
      </div>`;
      if (techniques.length === 0) {
        html += `<div class="empty"><div class="empty-icon">📚</div><div class="empty-text">技巧库还是空的</div></div>`;
      } else {
        techniques.sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(t => {
          html += `<div class="card" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <strong>${esc(t.title)}</strong>
              <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:12px;color:var(--text-tertiary)">${t.date}</span>
                <button class="btn btn-sm btn-danger" onclick="EnglishModule.deleteTechnique('${t.id}')" style="font-size:12px">删除</button>
              </div>
            </div>
            <div style="color:var(--text-secondary);font-size:13px;margin-bottom:6px">${esc(t.content)}</div>
            <div>${t.tags.map(tag => `<span class="tag tag-blue">${esc(tag)}</span>`).join(' ')}</div>
          </div>`;
        });
      }
    }

    return html;
  }

  function generateReview(problems, techniques) {
    if (problems.length === 0) return '<div style="color:var(--text-tertiary);font-size:13px">记录口语问题后，这里会自动生成复盘摘要。</div>';

    const unsolved = problems.filter(p => !p.solved);
    const byCat = {};
    problems.forEach(p => {
      const cat = CATEGORIES[p.category]?.label || '其他';
      byCat[cat] = (byCat[cat] || 0) + 1;
    });

    const topCat = Object.entries(byCat).sort((a,b) => b[1]-a[1])[0];
    const recent = problems.filter(p => {
      const d = new Date(p.date); return (Date.now() - d.getTime()) < 14 * 86400000;
    });

    let html = '<ul style="font-size:13px;color:var(--text-secondary);line-height:1.8">';
    html += `<li>📌 共记录 <strong>${problems.length}</strong> 个问题，其中 <strong style="color:var(--danger)">${unsolved.length}</strong> 个待解决</li>`;
    if (topCat) html += `<li>🔍 最常见问题类型：<strong>${topCat[0]}</strong>（${topCat[1]} 次）</li>`;
    html += `<li>📅 近两周新增 <strong>${recent.length}</strong> 个问题</li>`;
    if (techniques.length > 0) html += `<li>📚 技巧库已有 <strong>${techniques.length}</strong> 个方法</li>`;
    if (unsolved.length > 0) html += `<li>⏰ 建议优先解决「${unsolved[0].title}」</li>`;
    html += '</ul>';
    return html;
  }

  function switchTab(t) { tab = t; refresh(); }

  function openProblemForm(id) {
    const p = id ? getData().problems.find(x => x.id === id) : null;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)EnglishModule.closeForm()">
      <div class="modal"><div class="modal-title">${p?'编辑':'记录'}口语问题</div>
        <div class="form-group"><label class="form-label">标题</label><input class="input" id="epTitle" value="${p?esc(p.title):''}"></div>
        <div class="form-group"><label class="form-label">分类</label><select class="select" id="epCat">${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}" ${p&&p.category===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">问题描述</label><textarea class="input textarea" id="epDetail">${p?esc(p.detail):''}</textarea></div>
        <div class="form-group"><label class="form-label">解决方法（可选）</label><textarea class="input textarea" id="epSolution">${p?esc(p.solution||''):''}</textarea></div>
        <div class="modal-actions"><button class="btn btn-secondary" onclick="EnglishModule.closeForm()">取消</button><button class="btn btn-primary" onclick="EnglishModule.saveProblem('${p?p.id:''}')">保存</button></div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function saveProblem(id) {
    const title = document.getElementById('epTitle').value.trim(); if (!title) { toast('请输入标题'); return; }
    const data = getData();
    if (id) { const idx = data.problems.findIndex(x => x.id === id); if (idx>=0) { data.problems[idx].title=title; data.problems[idx].category=document.getElementById('epCat').value; data.problems[idx].detail=document.getElementById('epDetail').value; data.problems[idx].solution=document.getElementById('epSolution').value; }}
    else { data.problems.unshift({ id: genId(), title, category: document.getElementById('epCat').value, detail: document.getElementById('epDetail').value, solution: document.getElementById('epSolution').value, date: new Date().toISOString().split('T')[0], solved: false }); }
    saveData(data); closeForm(); refresh(); toast('保存成功');
  }

  function toggleSolved(id) {
    const data = getData(); const p = data.problems.find(x => x.id === id); if (p) p.solved = !p.solved;
    saveData(data); refresh();
  }

  function deleteProblem(id) { if (!confirm('确定删除？')) return; const data = getData(); data.problems = data.problems.filter(x => x.id !== id); saveData(data); refresh(); toast('已删除'); }

  function openTechniqueForm(id) {
    const t = id ? getData().techniques.find(x => x.id === id) : null;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)EnglishModule.closeForm()">
      <div class="modal"><div class="modal-title">${t?'编辑':'添加'}技巧</div>
        <div class="form-group"><label class="form-label">标题</label><input class="input" id="etTitle" value="${t?esc(t.title):''}"></div>
        <div class="form-group"><label class="form-label">内容</label><textarea class="input textarea" id="etContent">${t?esc(t.content):''}</textarea></div>
        <div class="form-group"><label class="form-label">标签（逗号分隔）</label><input class="input" id="etTags" value="${t?t.tags.join(','):''}"></div>
        <div class="modal-actions"><button class="btn btn-secondary" onclick="EnglishModule.closeForm()">取消</button><button class="btn btn-primary" onclick="EnglishModule.saveTechnique('${t?t.id:''}')">保存</button></div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function saveTechnique(id) {
    const title = document.getElementById('etTitle').value.trim(); if (!title) { toast('请输入标题'); return; }
    const data = getData(); const content = document.getElementById('etContent').value; const tags = document.getElementById('etTags').value.split(/[,，]/).map(t=>t.trim()).filter(Boolean);
    if (id) { const idx = data.techniques.findIndex(x=>x.id===id); if (idx>=0) { data.techniques[idx].title=title; data.techniques[idx].content=content; data.techniques[idx].tags=tags; } }
    else { data.techniques.unshift({ id: genId(), title, content, tags, date: new Date().toISOString().split('T')[0] }); }
    saveData(data); closeForm(); refresh(); toast('保存成功');
  }

  function deleteTechnique(id) { if (!confirm('确定删除？')) return; const data = getData(); data.techniques = data.techniques.filter(x => x.id !== id); saveData(data); refresh(); toast('已删除'); }

  function closeForm() { document.getElementById('modalContainer').innerHTML = ''; }
  function refresh() { App.loadModule('english'); }

  return { render, switchTab, openProblemForm, saveProblem, deleteProblem, toggleSolved, openTechniqueForm, saveTechnique, deleteTechnique, closeForm, refresh };
})();

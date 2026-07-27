/**
 * Job Hunting Module - Application tracker with cross-industry support
 */
const JobsModule = (() => {
  function genId() { return 'j' + Date.now() + Math.random().toString(36).slice(2,6); }
  function getData() { return DB.get('jobs'); }
  function saveData(data) { DB.set('jobs', data); }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  const STATUS_CONFIG = {
    applied: { label: '已投递', css: 'status-applied' },
    interview: { label: '面试中', css: 'status-interview' },
    offer: { label: '已获Offer', css: 'status-offer' },
    rejected: { label: '未通过', css: 'status-rejected' },
  };

  let filterStatus = 'all';
  let filterIndustry = 'all';

  function render() {
    const jobs = getData();
    let filtered = jobs;
    if (filterStatus !== 'all') filtered = filtered.filter(j => j.status === filterStatus);
    if (filterIndustry !== 'all') filtered = filtered.filter(j => j.industry === filterIndustry);

    const industries = [...new Set(jobs.map(j => j.industry))];
    const stats = { applied: jobs.filter(j=>j.status==='applied').length, interview: jobs.filter(j=>j.status==='interview').length, offer: jobs.filter(j=>j.status==='offer').length, rejected: jobs.filter(j=>j.status==='rejected').length };

    let html = `<div class="module-header">
      <div><div class="module-title"><span class="module-title-icon">💼</span>求职管理</div><div class="module-desc">投递追踪 + 跨行业管理 + 面试复盘</div></div>
      <button class="btn btn-primary" onclick="JobsModule.openForm()">+ 新增投递</button>
    </div>`;

    // Stats
    html += `<div class="grid-4" style="margin-bottom:20px">
      <div class="card stat-card"><div class="stat-number">${jobs.length}</div><div class="stat-label">总投递数</div></div>
      <div class="card stat-card"><div class="stat-number" style="color:var(--orange)">${stats.interview}</div><div class="stat-label">面试中</div></div>
      <div class="card stat-card"><div class="stat-number" style="color:var(--success)">${stats.offer}</div><div class="stat-label">Offer</div></div>
      <div class="card stat-card"><div class="stat-number">${industries.length}</div><div class="stat-label">覆盖行业</div></div>
    </div>`;

    // Filters
    html += `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <span style="font-size:13px;color:var(--text-secondary)">筛选：</span>
      <select class="select" style="width:auto" onchange="JobsModule.setFilter('status',this.value)"><option value="all">全部状态</option>${Object.entries(STATUS_CONFIG).map(([k,v])=>`<option value="${k}" ${filterStatus===k?'selected':''}>${v.label}</option>`).join('')}</select>
      <select class="select" style="width:auto" onchange="JobsModule.setFilter('industry',this.value)"><option value="all">全部行业</option>${industries.map(i=>`<option value="${i}" ${filterIndustry===i?'selected':''}>${esc(i)}</option>`).join('')}</select>
    </div>`;

    if (filtered.length === 0) {
      html += `<div class="empty"><div class="empty-icon">💼</div><div class="empty-text">还没有投递记录</div></div>`;
    } else {
      filtered.sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(job => {
        const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.applied;
        html += `<div class="card job-card ${sc.css}" style="margin-bottom:10px" onclick="JobsModule.openForm('${job.id}')">
          <div style="display:flex;justify-content:space-between;align-items:start">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                <strong>${esc(job.company)}</strong>
                <span class="tag tag-gray">${esc(job.position)}</span>
                <span class="job-industry tag ${job.crossIndustry?'tag-orange':'tag-blue'}">${esc(job.industry)}${job.crossIndustry?' 🔄 跨行业':''}</span>
              </div>
              <div class="job-date">📅 ${job.date} · ${esc(job.stage||'')}</div>
              ${job.note ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${esc(job.note)}</div>` : ''}
            </div>
            <span class="tag tag-${job.status==='applied'?'blue':job.status==='interview'?'orange':job.status==='offer'?'green':'red'}">${sc.label}</span>
          </div>
          ${job.review ? `<div style="margin-top:10px;background:var(--accent-light);padding:10px;border-radius:6px;font-size:13px">📝 <strong>复盘：</strong>${esc(job.review)}</div>` : ''}
        </div>`;
      });
    }

    // Cross-industry summary
    if (industries.length > 1) {
      html += `<div class="card" style="margin-top:20px"><div class="card-header"><h3>🔄 跨行业分布</h3></div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">`;
      industries.forEach(ind => {
        const count = jobs.filter(j => j.industry === ind).length;
        const interviews = jobs.filter(j => j.industry === ind && j.status === 'interview').length;
        html += `<div style="text-align:center"><div style="font-size:24px;font-weight:700">${count}</div><div style="font-size:12px;color:var(--text-secondary)">${esc(ind)}</div><div style="font-size:11px;color:var(--text-tertiary)">${interviews}个面试</div></div>`;
      });
      html += '</div></div>';
    }

    return html;
  }

  function setFilter(type, val) { if (type === 'status') filterStatus = val; else filterIndustry = val; refresh(); }

  function openForm(id) {
    const job = id ? getData().find(j => j.id === id) : null;
    const isEdit = !!job;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)JobsModule.closeForm()">
      <div class="modal" style="max-width:550px"><div class="modal-title">${isEdit?'编辑':'新增'}投递</div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">公司</label><input class="input" id="jCompany" value="${job?esc(job.company):''}"></div>
          <div class="form-group"><label class="form-label">职位</label><input class="input" id="jPosition" value="${job?esc(job.position):''}"></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">行业</label><input class="input" id="jIndustry" value="${job?esc(job.industry):''}" placeholder="如：互联网、新能源汽车"></div>
          <div class="form-group"><label class="form-label">状态</label><select class="select" id="jStatus">${Object.entries(STATUS_CONFIG).map(([k,v])=>`<option value="${k}" ${job&&job.status===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">投递日期</label><input class="input" id="jDate" type="date" value="${job?job.date:new Date().toISOString().split('T')[0]}"></div>
          <div class="form-group"><label class="form-label">当前阶段</label><input class="input" id="jStage" value="${job?esc(job.stage||''):''}" placeholder="如：一面、二面、已投递"></div>
        </div>
        <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="jCross" ${job&&job.crossIndustry?'checked':''}> 跨行业投递</label></div>
        <div class="form-group"><label class="form-label">备注</label><input class="input" id="jNote" value="${job?esc(job.note||''):''}"></div>
        <div class="form-group"><label class="form-label">复盘笔记</label><textarea class="input textarea" id="jReview" placeholder="面试后的反思和总结...">${job?esc(job.review||''):''}</textarea></div>
        <div class="modal-actions">
          ${isEdit ? `<button class="btn btn-danger" onclick="JobsModule.deleteItem('${id}')">删除</button>` : ''}
          <button class="btn btn-secondary" onclick="JobsModule.closeForm()">取消</button>
          <button class="btn btn-primary" onclick="JobsModule.saveItem('${isEdit?id:''}')">保存</button>
        </div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function closeForm() { document.getElementById('modalContainer').innerHTML = ''; }

  function saveItem(existingId) {
    const company = document.getElementById('jCompany').value.trim(); if (!company) { toast('请输入公司名'); return; }
    const position = document.getElementById('jPosition').value.trim();
    const industry = document.getElementById('jIndustry').value.trim();
    const status = document.getElementById('jStatus').value;
    const date = document.getElementById('jDate').value;
    const stage = document.getElementById('jStage').value.trim();
    const crossIndustry = document.getElementById('jCross').checked;
    const note = document.getElementById('jNote').value.trim();
    const review = document.getElementById('jReview').value.trim();

    const jobs = getData();
    if (existingId) {
      const idx = jobs.findIndex(j => j.id === existingId);
      if (idx >= 0) Object.assign(jobs[idx], { company, position, industry, status, date, stage, crossIndustry, note, review });
    } else {
      jobs.unshift({ id: genId(), company, position, industry, status, date, stage, crossIndustry, note, review });
    }
    saveData(jobs); closeForm(); refresh(); toast(existingId ? '已更新' : '已添加');
  }

  function deleteItem(id) { if (!confirm('确定删除？')) return; saveData(getData().filter(j => j.id !== id)); closeForm(); refresh(); toast('已删除'); }
  function refresh() { App.loadModule('jobs'); }

  return { render, openForm, closeForm, saveItem, deleteItem, setFilter, refresh };
})();

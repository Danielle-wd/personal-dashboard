/**
 * Fitness Module - Weight tracking chart, check-in calendar, workout log
 */
const FitnessModule = (() => {
  function genId() { return 'f' + Date.now() + Math.random().toString(36).slice(2,6); }
  function getData() { return DB.get('fitness'); }
  function saveData(data) { DB.set('fitness', data); }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function render() {
    const data = getData();
    const { records, checkins, workouts } = data;
    const weights = records.filter(r => r.type === 'weight').sort((a,b) => new Date(a.date)-new Date(b.date));
    const latestWeight = weights.length > 0 ? weights[weights.length-1].value : '--';
    const earliestWeight = weights.length > 1 ? weights[0].value : null;
    const weightChange = earliestWeight ? (parseFloat(latestWeight) - parseFloat(earliestWeight)).toFixed(1) : null;

    const streak = calcStreak(checkins);
    const monthCheckins = countMonthCheckins(checkins);
    const totalWorkouts = workouts.length;

    let html = `<div class="module-header">
      <div><div class="module-title"><span class="module-title-icon">💪</span>健身记录</div><div class="module-desc">追踪体重、打卡记录、训练日志</div></div>
      <button class="btn btn-primary" onclick="FitnessModule.openWorkoutForm()">+ 记录训练</button>
    </div>`;

    // Stats
    html += `<div class="grid-4" style="margin-bottom:20px">
      <div class="card stat-card"><div class="stat-number">${latestWeight}<span style="font-size:14px;color:var(--text-tertiary)"> kg</span></div><div class="stat-label">当前体重${weightChange ? ' <span style="color:'+(parseFloat(weightChange)<=0?'var(--success)':'var(--danger)')+'">'+(parseFloat(weightChange)>0?'+':'')+weightChange+'kg</span>' : ''}</div></div>
      <div class="card stat-card"><div class="stat-number" style="color:var(--success)">${streak}</div><div class="stat-label">连续打卡天数</div></div>
      <div class="card stat-card"><div class="stat-number">${monthCheckins}</div><div class="stat-label">本月打卡</div></div>
      <div class="card stat-card"><div class="stat-number">${totalWorkouts}</div><div class="stat-label">累计训练</div></div>
    </div>`;

    // Weight chart + check-in side by side
    html += `<div class="grid-2" style="margin-bottom:20px">
      <div class="card"><div class="card-header"><h3>📈 体重趋势</h3>
        <button class="btn btn-sm btn-secondary" onclick="FitnessModule.openWeightForm()">+ 记录体重</button>
      </div><div class="weight-chart-wrap"><canvas id="weightChart"></canvas></div></div>
      <div class="card"><div class="card-header"><h3>🗓️ 本月打卡</h3>
        <button class="btn btn-sm btn-secondary" onclick="FitnessModule.toggleCheckin()">${checkins.includes(today()) ? '取消今日打卡' : '今日打卡'}</button>
      </div>${renderCalendar(checkins)}</div>
    </div>`;

    // Workout log
    html += `<div class="card"><div class="card-header"><h3>🏋️ 训练日志</h3></div>`;
    if (workouts.length === 0) {
      html += `<div class="empty"><div class="empty-text">还没有训练记录</div></div>`;
    } else {
      workouts.sort((a,b) => new Date(b.date)-new Date(a.date)).forEach(w => {
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light)">
          <div><strong>${esc(w.name)}</strong><span style="color:var(--text-tertiary);font-size:12px;margin-left:10px">${w.date}</span></div>
          <div style="display:flex;gap:16px;align-items:center;font-size:13px;color:var(--text-secondary)">
            <span>⏱ ${w.duration}分钟</span><span>${esc(w.note||'')}</span>
            <button class="btn btn-sm btn-danger" onclick="FitnessModule.deleteWorkout('${w.id}')">删除</button>
          </div>
        </div>`;
      });
    }
    html += '</div>';

    // Render chart after DOM update
    setTimeout(() => drawWeightChart(weights), 100);
    return html;
  }

  function today() { return new Date().toISOString().split('T')[0]; }

  function calcStreak(checkins) {
    let streak = 0; const d = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = d.toISOString().split('T')[0];
      if (checkins.includes(ds)) { streak++; d.setDate(d.getDate()-1); }
      else if (i === 0) { d.setDate(d.getDate()-1); continue; }
      else break;
    }
    return streak;
  }

  function countMonthCheckins(checkins) {
    const now = new Date(); const m = now.toISOString().slice(0,7);
    return checkins.filter(d => d.startsWith(m)).length;
  }

  function renderCalendar(checkins) {
    const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    let html = '<div class="checkin-grid">';
    ['日','一','二','三','四','五','六'].forEach(d => { html += `<div style="text-align:center;font-size:11px;color:var(--text-tertiary);padding:4px">${d}</div>`; });
    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isDone = checkins.includes(ds); const isToday = ds === today();
      html += `<div class="checkin-day ${isDone?'done':''} ${isToday?'today':''}" title="${ds}">${d}</div>`;
    }
    html += '</div>';
    return html;
  }

  function drawWeightChart(weights) {
    const canvas = document.getElementById('weightChart'); if (!canvas || weights.length < 2) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = 240 * dpr;
    canvas.style.width = rect.width + 'px'; canvas.style.height = '240px';
    ctx.scale(dpr, dpr);

    const vals = weights.map(w => parseFloat(w.value));
    const min = Math.floor(Math.min(...vals) - 1); const max = Math.ceil(Math.max(...vals) + 1);
    const range = max - min || 1;
    const w = rect.width; const h = 200;
    const pad = { top: 10, right: 20, bottom: 30, left: 45 };
    const chartW = w - pad.left - pad.right; const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#e5e5ea'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH/4)*i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w-pad.right, y); ctx.stroke();
      ctx.fillStyle = '#86868b'; ctx.font = '11px -apple-system,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText((max - (range/4)*i).toFixed(1), pad.left-6, y+4);
    }

    // Draw line
    ctx.beginPath(); ctx.strokeStyle = '#0071e3'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    weights.forEach((wItem, i) => {
      const x = pad.left + (chartW/(weights.length-1||1))*i;
      const y = pad.top + chartH - ((parseFloat(wItem.value)-min)/range)*chartH;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // Draw dots and labels
    weights.forEach((wItem, i) => {
      const x = pad.left + (chartW/(weights.length-1||1))*i;
      const y = pad.top + chartH - ((parseFloat(wItem.value)-min)/range)*chartH;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fillStyle = '#0071e3'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#86868b'; ctx.font = '10px -apple-system,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(wItem.date.slice(5), x, h-8);
    });
  }

  function toggleCheckin() {
    const data = getData(); const t = today();
    if (data.checkins.includes(t)) { data.checkins = data.checkins.filter(d => d !== t); toast('已取消打卡'); }
    else { data.checkins.push(t); toast('打卡成功 💪'); }
    saveData(data); refresh();
  }

  function openWeightForm() {
    const html = `<div class="modal-overlay" onclick="if(event.target===this)FitnessModule.closeForm()">
      <div class="modal"><div class="modal-title">记录体重</div>
        <div class="form-group"><label class="form-label">体重 (kg)</label><input class="input" id="fwValue" type="number" step="0.1" placeholder="65.0"></div>
        <div class="form-group"><label class="form-label">日期</label><input class="input" id="fwDate" type="date" value="${today()}"></div>
        <div class="modal-actions"><button class="btn btn-secondary" onclick="FitnessModule.closeForm()">取消</button><button class="btn btn-primary" onclick="FitnessModule.saveWeight()">保存</button></div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function saveWeight() {
    const v = document.getElementById('fwValue').value; if (!v) { toast('请输入体重'); return; }
    const date = document.getElementById('fwDate').value;
    const data = getData(); data.records.push({ id: genId(), type: 'weight', value: v, date });
    saveData(data); closeForm(); refresh(); toast('体重已记录');
  }

  function openWorkoutForm(id) {
    const w = id ? getData().workouts.find(x => x.id === id) : null;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)FitnessModule.closeForm()">
      <div class="modal"><div class="modal-title">${w?'编辑':'新增'}训练</div>
        <div class="form-group"><label class="form-label">训练项目</label><input class="input" id="fwname" value="${w?esc(w.name):''}"></div>
        <div class="form-group"><label class="form-label">时长（分钟）</label><input class="input" id="fwdur" type="number" value="${w?w.duration:''}"></div>
        <div class="form-group"><label class="form-label">日期</label><input class="input" id="fwdate" type="date" value="${w?w.date:today()}"></div>
        <div class="form-group"><label class="form-label">备注</label><input class="input" id="fwnote" value="${w?esc(w.note||''):''}"></div>
        <div class="modal-actions"><button class="btn btn-secondary" onclick="FitnessModule.closeForm()">取消</button><button class="btn btn-primary" onclick="FitnessModule.saveWorkout('${w?w.id:''}')">保存</button></div>
      </div></div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function saveWorkout(id) {
    const name = document.getElementById('fwname').value.trim(); if (!name) { toast('请输入项目名'); return; }
    const duration = parseInt(document.getElementById('fwdur').value)||0;
    const date = document.getElementById('fwdate').value;
    const note = document.getElementById('fwnote').value;
    const data = getData();
    if (id) { const idx = data.workouts.findIndex(x=>x.id===id); if (idx>=0) { data.workouts[idx].name=name; data.workouts[idx].duration=duration; data.workouts[idx].date=date; data.workouts[idx].note=note; } }
    else { data.workouts.push({ id: genId(), name, duration, date, note }); }
    if (!data.checkins.includes(date)) data.checkins.push(date);
    saveData(data); closeForm(); refresh(); toast('训练已记录');
  }

  function deleteWorkout(id) { if (!confirm('确定删除？')) return; const data = getData(); data.workouts = data.workouts.filter(x => x.id !== id); saveData(data); refresh(); toast('已删除'); }

  function closeForm() { document.getElementById('modalContainer').innerHTML = ''; }
  function refresh() { App.loadModule('fitness'); }

  return { render, toggleCheckin, openWeightForm, saveWeight, openWorkoutForm, saveWorkout, deleteWorkout, closeForm, refresh };
})();

/**
 * Todo Kanban Module
 * Three-column kanban with due dates and browser reminders
 */
const TodoModule = (() => {
  const STATUS_MAP = { todo: '待办', doing: '进行中', done: '已完成' };
  const STATUS_KEYS = ['todo', 'doing', 'done'];

  function genId() { return 't' + Date.now() + Math.random().toString(36).slice(2, 6); }

  function getData() { return DB.get('todo'); }
  function saveData(data) { DB.set('todo', data); }

  function checkReminders() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const items = getData();
    const today = new Date().toISOString().split('T')[0];
    items.forEach(item => {
      if (item.remind && item.dueDate === today && item.status !== 'done') {
        try { new Notification('待办提醒', { body: `📋 ${item.title} — 今天截止！`, icon: '📋' }); } catch {}
      }
    });
  }

  function render() {
    const items = getData();
    let html = `<div class="module-header">
      <div>
        <div class="module-title"><span class="module-title-icon">📋</span>待办看板</div>
        <div class="module-desc">管理你的任务，设置截止日期和提醒</div>
      </div>
      <button class="btn btn-primary" onclick="TodoModule.openForm()">+ 新建任务</button>
    </div><div class="kanban">`;

    STATUS_KEYS.forEach(status => {
      const filtered = items.filter(i => i.status === status);
      html += `<div class="kanban-col" data-status="${status}">
        <div class="kanban-col-title">${STATUS_MAP[status]}<span class="count">${filtered.length}</span></div>`;
      filtered.forEach(item => {
        const isOverdue = item.status !== 'done' && item.dueDate && item.dueDate < new Date().toISOString().split('T')[0];
        const isDone = item.status === 'done';
        html += `<div class="kanban-item${isDone?' done':''}" data-id="${item.id}">
          <div class="kanban-item-delete" onclick="TodoModule.swipeDelete('${item.id}')">删除</div>
          <div class="kanban-item-inner" onclick="TodoModule.openForm('${item.id}')">
            <div class="kanban-item-row">
              <button class="kanban-check" onclick="event.stopPropagation();TodoModule.toggleStatus('${item.id}')">${isDone ? '✓' : '○'}</button>
              <div>
                <div class="kanban-item-title">${esc(item.title)}</div>
                <div class="kanban-item-meta">
                  ${item.dueDate ? `<span class="kanban-item-date ${isOverdue ? 'overdue' : ''}">${isOverdue ? '⚠️ ' : '📅 '}${item.dueDate}</span>` : ''}
                  ${item.remind ? '<span>🔔 已设提醒</span>' : ''}
                </div>
              </div>
              <span class="kanban-edit-icon" onclick="event.stopPropagation();TodoModule.openForm('${item.id}')">✎</span>
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    });
    html += '</div>';
    return html;
  }

  function openForm(id) {
    const item = id ? getData().find(i => i.id === id) : null;
    const isEdit = !!item;
    const title = item ? item.title : '';
    const dueDate = item ? item.dueDate : '';
    const status = item ? item.status : 'todo';
    const remind = item ? item.remind : false;

    const html = `<div class="modal-overlay" onclick="if(event.target===this)TodoModule.closeForm()">
      <div class="modal">
        <div class="modal-title">${isEdit ? '编辑任务' : '新建任务'}</div>
        <div class="form-group"><label class="form-label">任务名称</label><input class="input" id="todoTitle" value="${esc(title)}" placeholder="输入任务名称..."></div>
        <div class="form-group"><label class="form-label">截止日期</label><input class="input" id="todoDueDate" type="date" value="${dueDate}"></div>
        <div class="form-group"><label class="form-label">状态</label><select class="select" id="todoStatus">${STATUS_KEYS.map(s => `<option value="${s}" ${s===status?'selected':''}>${STATUS_MAP[s]}</option>`).join('')}</select></div>
        <div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="todoRemind" ${remind?'checked':''}> 到期日浏览器提醒</label></div>
        <div class="modal-actions">
          ${isEdit ? `<button class="btn btn-danger" onclick="TodoModule.deleteItem('${id}')">删除</button>` : ''}
          <button class="btn btn-secondary" onclick="TodoModule.closeForm()">取消</button>
          <button class="btn btn-primary" onclick="TodoModule.saveItem('${isEdit?id:''}')">保存</button>
        </div>
      </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function closeForm() {
    document.getElementById('modalContainer').innerHTML = '';
  }

  function saveItem(existingId) {
    const title = document.getElementById('todoTitle').value.trim();
    if (!title) { toast('请输入任务名称'); return; }
    const dueDate = document.getElementById('todoDueDate').value;
    const status = document.getElementById('todoStatus').value;
    const remind = document.getElementById('todoRemind').checked;

    const items = getData();
    if (existingId) {
      const idx = items.findIndex(i => i.id === existingId);
      if (idx >= 0) { items[idx].title = title; items[idx].dueDate = dueDate; items[idx].status = status; items[idx].remind = remind; }
    } else {
      items.unshift({ id: genId(), title, dueDate, status, remind });
    }
    saveData(items);
    closeForm();
    refresh();
    toast(existingId ? '任务已更新' : '任务已创建');
  }

  function toggleStatus(id) {
    const items = getData();
    const found = items.find(i => i.id === id);
    if (!found) return;
    // Toggle between done and todo
    found.status = found.status === 'done' ? 'todo' : 'done';
    saveData(items);
    refresh();
    toast(found.status === 'done' ? '✅ 已完成' : '🔄 已恢复');
  }

  function swipeDelete(id) {
    if (!confirm('确定删除这个任务？')) return;
    const items = getData().filter(i => i.id !== id);
    saveData(items);
    refresh();
    toast('🗑️ 已删除');
  }

  function initSwipe() {
    document.querySelectorAll('.kanban-item-inner').forEach(function(el) {
      var startX = 0, startY = 0, currentX = 0;
      var parent = el.closest('.kanban-item');

      el.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = 0;
        el.style.transition = 'none';
      }, { passive: true });

      el.addEventListener('touchmove', function(e) {
        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        if (Math.abs(dy) > Math.abs(dx)) return;
        if (dx > 0) return;
        currentX = Math.max(dx, -75);
        el.style.transform = 'translateX(' + currentX + 'px)';
      }, { passive: true });

      el.addEventListener('touchend', function() {
        el.style.transition = 'transform 0.2s ease';
        if (currentX < -25) {
          el.style.transform = 'translateX(-75px)';
          document.querySelectorAll('.kanban-item-inner').forEach(function(other) {
            if (other !== el) { other.style.transition = 'transform 0.2s ease'; other.style.transform = 'translateX(0)'; }
          });
        } else {
          el.style.transform = 'translateX(0)';
        }
      });

      document.addEventListener('click', function(e) {
        if (!parent.contains(e.target)) {
          el.style.transition = 'transform 0.2s ease';
          el.style.transform = 'translateX(0)';
        }
      });
    });
  }

  function deleteItem(id) {
    if (!confirm('确定删除这个任务？')) return;
    const items = getData().filter(i => i.id !== id);
    saveData(items);
    closeForm();
    refresh();
    toast('任务已删除');
  }

  function refresh() { App.loadModule('todo'); setTimeout(initSwipe, 100); }

  // Call swipe init on first render too
  var origRender = render;
  render = function() { var h = origRender(); setTimeout(initSwipe, 100); return h; };

  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Initialize reminder check every minute
  setInterval(checkReminders, 60000);
  checkReminders();

  return { render, openForm, closeForm, saveItem, deleteItem, toggleStatus, swipeDelete, initSwipe, refresh, checkReminders };
})();

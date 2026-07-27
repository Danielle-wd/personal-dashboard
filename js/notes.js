/**
 * Notes Module - Quick capture, tags, search
 */
const NotesModule = (() => {
  function genId() { return 'n' + Date.now() + Math.random().toString(36).slice(2,6); }
  function getData() { return DB.get('notes'); }
  function saveData(data) { DB.set('notes', data); }
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  let searchTerm = '';

  function render() {
    const notes = getData();
    const filtered = searchTerm
      ? notes.filter(n => n.title.includes(searchTerm) || n.content.includes(searchTerm) || n.tags.some(t => t.includes(searchTerm)))
      : notes;

    let html = `<div class="module-header">
      <div><div class="module-title"><span class="module-title-icon">💡</span>灵感笔记</div><div class="module-desc">快速记录想法，用标签归类整理</div></div>
      <div style="display:flex;gap:8px">
        <input class="input" placeholder="搜索笔记..." style="width:200px" id="notesSearch" value="${esc(searchTerm)}" oninput="NotesModule.setSearch(this.value)">
        <button class="btn btn-primary" onclick="NotesModule.openForm()">+ 新建笔记</button>
      </div>
    </div>`;

    if (filtered.length === 0) {
      html += `<div class="empty"><div class="empty-icon">💡</div><div class="empty-text">${searchTerm ? '没有匹配的笔记' : '还没有笔记，点击上方按钮创建第一条吧'}</div></div>`;
    } else {
      html += `<div class="note-grid">`;
      filtered.forEach(note => {
        const preview = note.content.length > 100 ? note.content.slice(0, 100) + '...' : note.content;
        html += `<div class="note-card" onclick="NotesModule.openForm('${note.id}')">
          <div class="note-card-title">${esc(note.title)}</div>
          <div class="note-card-preview">${esc(preview)}</div>
          <div class="note-card-footer">${note.tags.map(t => `<span class="tag tag-blue">${esc(t)}</span>`).join('')}</div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  }

  function setSearch(val) { searchTerm = val; refresh(); }

  function openForm(id) {
    const note = id ? getData().find(n => n.id === id) : null;
    const isEdit = !!note;
    const html = `<div class="modal-overlay" onclick="if(event.target===this)NotesModule.closeForm()">
      <div class="modal" style="max-width:600px">
        <div class="modal-title">${isEdit ? '编辑笔记' : '新建笔记'}</div>
        <div class="form-group"><label class="form-label">标题</label><input class="input" id="noteTitle" value="${note ? esc(note.title) : ''}" placeholder="笔记标题..."></div>
        <div class="form-group"><label class="form-label">标签（用逗号分隔）</label><input class="input" id="noteTags" value="${note ? note.tags.join(', ') : ''}" placeholder="例如: 想法, 工作, 英语"></div>
        <div class="form-group"><label class="form-label">内容</label><textarea class="input textarea" id="noteContent" placeholder="写下你的想法...">${note ? esc(note.content) : ''}</textarea></div>
        <div class="modal-actions">
          ${isEdit ? `<button class="btn btn-danger" onclick="NotesModule.deleteItem('${id}')">删除</button>` : ''}
          <button class="btn btn-secondary" onclick="NotesModule.closeForm()">取消</button>
          <button class="btn btn-primary" onclick="NotesModule.saveItem('${isEdit?id:''}')">保存</button>
        </div>
      </div>
    </div>`;
    document.getElementById('modalContainer').innerHTML = html;
  }

  function closeForm() { document.getElementById('modalContainer').innerHTML = ''; }

  function saveItem(existingId) {
    const title = document.getElementById('noteTitle').value.trim();
    if (!title) { toast('请输入标题'); return; }
    const content = document.getElementById('noteContent').value.trim();
    const tagsRaw = document.getElementById('noteTags').value;
    const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [];
    const now = new Date().toISOString().split('T')[0];

    const notes = getData();
    if (existingId) {
      const idx = notes.findIndex(n => n.id === existingId);
      if (idx >= 0) { notes[idx].title = title; notes[idx].content = content; notes[idx].tags = tags; notes[idx].updatedAt = now; }
    } else {
      notes.unshift({ id: genId(), title, content, tags, createdAt: now, updatedAt: now });
    }
    saveData(notes); closeForm(); refresh(); toast(existingId ? '笔记已更新' : '笔记已创建');
  }

  function deleteItem(id) { if (!confirm('确定删除这条笔记？')) return; saveData(getData().filter(n => n.id !== id)); closeForm(); refresh(); toast('笔记已删除'); }
  function refresh() { App.loadModule('notes'); }

  return { render, openForm, closeForm, saveItem, deleteItem, setSearch, refresh };
})();

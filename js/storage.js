/**
 * Storage Layer - localStorage wrapper with default data
 */
const DB = (() => {
  const KEYS = {
    todo: 'wb_todo',
    notes: 'wb_notes',
    english: 'wb_english',
    fitness: 'wb_fitness',
    jobs: 'wb_jobs',
    media: 'wb_media',
  };

  const DEFAULTS = {
    todo: [
      { id: 't1', title: '示例：完成工作台 MVP 搭建', status: 'done', dueDate: '2026-07-26', remind: false },
      { id: 't2', title: '整理口语训练材料', status: 'doing', dueDate: '2026-07-28', remind: true },
      { id: 't3', title: '投递 XX 公司产品经理', status: 'todo', dueDate: '2026-07-30', remind: false },
    ],
    notes: [
      { id: 'n1', title: '关于自媒体定位的思考', content: '想做生活方式+职场成长双轨...', tags: ['自媒体', '规划'], createdAt: '2026-07-25', updatedAt: '2026-07-25' },
      { id: 'n2', title: '英语口语Shadowing练习法', content: '每天跟读15分钟，选择TED演讲片段，重点关注连读和语调。效果比单纯朗读好很多。', tags: ['英语', '方法'], createdAt: '2026-07-24', updatedAt: '2026-07-24' },
    ],
    english: {
      problems: [
        { id: 'ep1', category: 'pronunciation', title: 'th 发音不自然', detail: 'thing, think, through 这些词的 th 音总是发成 s 或 f', solution: '舌尖轻触上齿，气流从舌齿间通过。每天练习"thirty-three thousand"', date: '2026-07-25', solved: false },
        { id: 'ep2', category: 'fluency', title: '说长句时卡顿严重', detail: '脑子里想好了，但一说出来就断断续续，尤其是从句多的句子', solution: '先拆短句练习，熟练后再合并。使用"chunking"法分段表达', date: '2026-07-24', solved: false },
      ],
      techniques: [
        { id: 'et1', title: 'Shadowing 影子跟读法', content: '选择比自己水平略高的音频，延迟0.5秒跟读。重点模仿语调、节奏、连读。推荐材料：NPR播客、TED演讲。', tags: ['发音', '听力'], date: '2026-07-23' },
        { id: 'et2', title: '自言自语练习法', content: '每天选一个主题，用英语自言自语3分钟，录音后回听找问题。推荐话题：描述今天发生的事、发表对某个新闻的看法、模拟面试问答。', tags: ['流利度', '思维'], date: '2026-07-22' },
      ],
    },
    fitness: {
      records: [
        { id: 'f1', type: 'weight', value: '65.0', date: '2026-07-20' },
        { id: 'f2', type: 'weight', value: '64.5', date: '2026-07-23' },
        { id: 'f3', type: 'weight', value: '64.2', date: '2026-07-26' },
      ],
      checkins: ['2026-07-22', '2026-07-23', '2026-07-25', '2026-07-26'],
      workouts: [
        { id: 'w1', name: '上肢力量训练', duration: 45, date: '2026-07-25', note: '卧推 3x10, 引体向上 4x8' },
        { id: 'w2', name: '跑步', duration: 30, date: '2026-07-26', note: '5公里轻松跑' },
      ],
    },
    jobs: [
      { id: 'j1', company: '字节跳动', position: '产品经理', industry: '互联网/科技', crossIndustry: false, date: '2026-07-22', status: 'interview', stage: '二面', note: '面试官问了关于用户增长的问题', review: '' },
      { id: 'j2', company: '蔚来汽车', position: '产品运营', industry: '新能源汽车', crossIndustry: true, date: '2026-07-25', status: 'applied', stage: '已投递', note: '跨行业尝试，关注用户体验方向', review: '' },
    ],
    media: {
      ideas: [
        { id: 'mi1', title: '30天口语逆袭挑战', platform: '小红书', category: '教育', score: 8, note: '可做成系列，每天一个口语技巧+跟练', date: '2026-07-25' },
        { id: 'mi2', title: '跨行业求职经验分享', platform: '公众号', category: '职场', score: 7, note: '从互联网到新能源汽车的真实经历', date: '2026-07-24' },
      ],
      posts: [
        { id: 'mp1', title: '英语口语影子跟读法全攻略', platform: '小红书', date: '2026-07-20', views: 3200, likes: 186, comments: 42, shares: 28 },
        { id: 'mp2', title: '应届生简历这样写，面试邀请翻倍', platform: '公众号', date: '2026-07-18', views: 5800, likes: 267, comments: 55, shares: 89 },
      ],
    },
  };

  function get(key) {
    try {
      const raw = localStorage.getItem(KEYS[key]);
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULTS[key]));
    } catch {
      return JSON.parse(JSON.stringify(DEFAULTS[key]));
    }
  }

  function set(key, data) {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  }

  function reset(key) {
    localStorage.removeItem(KEYS[key]);
    return get(key);
  }

  function exportAll() {
    const data = {};
    Object.keys(KEYS).forEach(k => { data[k] = get(k); });
    return data;
  }

  function importAll(data) {
    Object.keys(KEYS).forEach(k => {
      if (data[k]) set(k, data[k]);
    });
  }

  return { get, set, reset, exportAll, importAll, KEYS };
})();

// Cloudflare Workers兼容写法 (避免模板字符串)
const HTML = String.raw`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XiYue Chat - Telegram风格聊天</title>
  <style>
    :root {
      --tg-bg: #1c2733;
      --tg-panel: #222e3b;
      --tg-accent: #0088cc;
      --tg-text: #f5f5f5;
      --tg-border: #334250;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background-color: var(--tg-bg);
      color: var(--tg-text);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    #app { display: none; }
    .page { display: none; }
    .page.active { display: flex; }
    .header {
      background-color: var(--tg-panel);
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--tg-border);
    }
    .logo { font-weight: bold; font-size: 1.2em; color: var(--tg-accent); }
    .uptime { font-size: 0.85em; color: #8899a6; }
    
    /* 注册/登录页 */
    .auth-page {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .auth-card {
      background: var(--tg-panel);
      border-radius: 12px;
      padding: 30px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .auth-title { text-align: center; margin-bottom: 25px; font-size: 1.8em; }
    .form-group { margin-bottom: 20px; }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #aebac7;
    }
    .form-control {
      width: 100%;
      padding: 12px 15px;
      background: #2a3744;
      border: 1px solid var(--tg-border);
      border-radius: 8px;
      color: var(--tg-text);
      font-size: 1em;
    }
    .btn {
      background: var(--tg-accent);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 1em;
      cursor: pointer;
      width: 100%;
      transition: background 0.2s;
    }
    .btn:hover { background: #0077b3; }
    .switch-auth { text-align: center; margin-top: 20px; }
    .error { color: #ff5252; margin-top: 8px; font-size: 0.9em; }
    
    /* 聊天页 */
    .chat-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .sidebar {
      width: 300px;
      background: var(--tg-panel);
      border-right: 1px solid var(--tg-border);
      overflow-y: auto;
    }
    .search-box {
      padding: 10px 15px;
      background: #2a3744;
      border-radius: 8px;
      margin: 10px;
    }
    .user-list { list-style: none; }
    .user-item {
      padding: 12px 15px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--tg-border);
      cursor: pointer;
      transition: background 0.1s;
    }
    .user-item:hover { background: #2a3744; }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-right: 12px;
      object-fit: cover;
      background: #334250;
    }
    .user-info { flex: 1; }
    .username { font-weight: 500; }
    .user-title { font-size: 0.8em; color: #8899a6; }
    .online-dot { width: 10px; height: 10px; background: #4cc965; border-radius: 50%; margin-left: 5px; }
    
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chat-header {
      padding: 15px;
      background: var(--tg-panel);
      border-bottom: 1px solid var(--tg-border);
    }
    .chat-with { display: flex; align-items: center; }
    .chat-avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; }
    .message-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .message {
      max-width: 70%;
      padding: 10px 15px;
      margin-bottom: 15px;
      border-radius: 18px;
      line-height: 1.4;
    }
    .message.own { 
      background: var(--tg-accent); 
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 5px;
    }
    .message.other { 
      background: #2a3744; 
      align-self: flex-start;
      border-bottom-left-radius: 5px;
    }
    .input-area {
      padding: 15px;
      background: var(--tg-panel);
      border-top: 1px solid var(--tg-border);
      display: flex;
      gap: 10px;
    }
    .message-input {
      flex: 1;
      padding: 12px 15px;
      background: #2a3744;
      border: 1px solid var(--tg-border);
      border-radius: 20px;
      color: var(--tg-text);
    }
    .send-btn {
      background: var(--tg-accent);
      color: white;
      border: none;
      width: 50px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2em;
    }
    
    .footer {
      text-align: center;
      padding: 15px;
      font-size: 0.85em;
      color: #8899a6;
      border-top: 1px solid var(--tg-border);
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- 首页 (注册/登录) -->
    <div id="home-page" class="page active auth-page">
      <div class="auth-card">
        <h1 class="auth-title">XiYue Chat</h1>
        <button id="show-login" class="btn" style="margin-bottom: 15px;">登录</button>
        <button id="show-register" class="btn" style="background: #5a6978;">注册</button>
        <div class="footer">本站已运行 <span id="uptime">0天 0小时 0分 0秒</span></div>
      </div>
    </div>

    <!-- 登录页 -->
    <div id="login-page" class="page auth-page">
      <div class="auth-card">
        <h1 class="auth-title">登录</h1>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" id="login-username" class="form-control" placeholder="输入用户名">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="login-password" class="form-control" placeholder="输入密码">
        </div>
        <div class="form-group">
          <label>头像链接 (可选)</label>
          <input type="url" id="login-avatar" class="form-control" placeholder="https://...">
        </div>
        <div id="login-error" class="error"></div>
        <button id="login-submit" class="btn">登录</button>
        <div class="switch-auth">
          <a href="#" id="back-to-home">返回首页</a>
        </div>
      </div>
    </div>

    <!-- 注册页 -->
    <div id="register-page" class="page auth-page">
      <div class="auth-card">
        <h1 class="auth-title">注册</h1>
        <div class="form-group">
          <label>昵称</label>
          <input type="text" id="reg-nickname" class="form-control" placeholder="输入昵称">
        </div>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" id="reg-username" class="form-control" placeholder="唯一用户名">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="reg-password" class="form-control" placeholder="至少6位">
        </div>
        <div class="form-group">
          <label>邀请码</label>
          <input type="text" id="reg-invite" class="form-control" placeholder="xiyue666">
        </div>
        <div class="form-group">
          <label>头像链接</label>
          <input type="url" id="reg-avatar" class="form-control" placeholder="https://..." value="https://i.imgur.com/0rxFJnF.png">
        </div>
        <div class="form-group">
          <label>性别</label>
          <select id="reg-gender" class="form-control">
            <option value="♂">♂ 男</option>
            <option value="♀">♀ 女</option>
          </select>
        </div>
        <div class="form-group">
          <label>个人签名</label>
          <input type="text" id="reg-signature" class="form-control" placeholder="一句话介绍自己">
        </div>
        <div id="register-error" class="error"></div>
        <button id="register-submit" class="btn">注册</button>
        <div class="switch-auth">
          <a href="#" id="back-to-home-2">返回首页</a>
        </div>
      </div>
    </div>

    <!-- 聊天页 -->
    <div id="chat-page" class="page">
      <div class="header">
        <div class="logo">XiYue Chat</div>
        <div class="uptime" id="chat-uptime">已运行 <span>0天 0小时 0分 0秒</span></div>
      </div>
      <div class="chat-container">
        <div class="sidebar">
          <div class="search-box">
            <input type="text" id="search-user" class="form-control" placeholder="搜索用户名...">
          </div>
          <ul class="user-list" id="user-list"></ul>
        </div>
        <div class="chat-area">
          <div class="chat-header">
            <div class="chat-with">
              <img id="chat-avatar" class="chat-avatar" src="https://i.imgur.com/0rxFJnF.png">
              <div>
                <div id="chat-username" class="username">选择联系人</div>
                <div id="chat-title" class="user-title"></div>
              </div>
            </div>
          </div>
          <div class="message-area" id="message-area"></div>
          <div class="input-area">
            <input type="text" id="message-input" class="message-input" placeholder="输入消息...">
            <button id="send-btn" class="send-btn">➤</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // 运行时间计算
    const startTime = new Date('2024-06-01T00:00:00Z');
    function updateUptime() {
      const now = new Date();
      const diff = now - startTime;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      document.getElementById('uptime').textContent = 
        \`\${days}天 \${hours}小时 \${minutes}分 \${seconds}秒\`;
      document.querySelector('#chat-uptime span').textContent = 
        \`\${days}天 \${hours}小时 \${minutes}分 \${seconds}秒\`;
    }
    setInterval(updateUptime, 1000);
    updateUptime();

    // 页面路由
    function showPage(pageId) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById(pageId).classList.add('active');
    }

    // 初始化
    document.getElementById('app').style.display = 'flex';
    showPage('home-page');

    // 事件监听
    document.getElementById('show-login').addEventListener('click', () => showPage('login-page'));
    document.getElementById('show-register').addEventListener('click', () => showPage('register-page'));
    document.getElementById('back-to-home').addEventListener('click', () => showPage('home-page'));
    document.getElementById('back-to-home-2').addEventListener('click', () => showPage('home-page'));

    // 全局状态
    let currentUser = null;
    let currentChat = null;

    // 工具函数
    function authFetch(url, options) {
      if (!currentUser) return Promise.reject('Not logged in');
      const headers = options.headers || {};
      headers['Authorization'] = btoa(\`\${currentUser.username}:\${currentUser.password}\`);
      return fetch(url, { ...options, headers });
    }

    // 注册逻辑
    document.getElementById('register-submit').addEventListener('click', async () => {
      const errorEl = document.getElementById('register-error');
      errorEl.textContent = '';
      
      const data = {
        nickname: document.getElementById('reg-nickname').value,
        username: document.getElementById('reg-username').value,
        password: document.getElementById('reg-password').value,
        inviteCode: document.getElementById('reg-invite').value,
        avatar: document.getElementById('reg-avatar').value,
        gender: document.getElementById('reg-gender').value,
        signature: document.getElementById('reg-signature').value
      };

      // 前端验证
      if (data.password.length < 6) {
        errorEl.textContent = '密码至少6位';
        return;
      }
      if (data.inviteCode !== 'xiyue666') {
        errorEl.textContent = '邀请码错误';
        return;
      }

      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          alert('注册成功！请登录');
          showPage('login-page');
        } else {
          const err = await res.json();
          errorEl.textContent = err.error || '注册失败';
        }
      } catch (e) {
        errorEl.textContent = '网络错误';
      }
    });

    // 登录逻辑
    document.getElementById('login-submit').addEventListener('click', async () => {
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = '';
      
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      const avatar = document.getElementById('login-avatar').value;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, avatar })
        });

        if (res.ok) {
          const user = await res.json();
          currentUser = { ...user, password };
          startChat();
        } else {
          const err = await res.json();
          errorEl.textContent = err.error || '登录失败';
        }
      } catch (e) {
        errorEl.textContent = '网络错误';
      }
    });

    // 启动聊天
    function startChat() {
      showPage('chat-page');
      loadUsers();
      setupChatListeners();
      startMessagePolling();
    }

    // 加载用户列表
    async function loadUsers() {
      try {
        const res = await authFetch('/api/users');
        if (res.ok) {
          const users = await res.json();
          const userList = document.getElementById('user-list');
          userList.innerHTML = '';
          
          users.forEach(user => {
            if (user.username === currentUser.username) return;
            
            const li = document.createElement('li');
            li.className = 'user-item';
            li.innerHTML = \`
              <img src="\${user.avatar || 'https://i.imgur.com/0rxFJnF.png'}" class="avatar">
              <div class="user-info">
                <div class="username">\${user.nickname}</div>
                <div class="user-title">\${user.title}</div>
              </div>
              \${user.username === 'admin' ? '<span class="online-dot"></span>' : ''}
            \`;
            li.addEventListener('click', () => startChatWith(user));
            userList.appendChild(li);
          });
        }
      } catch (e) {
        console.error('加载用户失败', e);
      }
    }

    // 开始会话
    function startChatWith(user) {
      currentChat = user;
      document.getElementById('chat-username').textContent = user.nickname;
      document.getElementById('chat-title').innerHTML = user.title;
      document.getElementById('chat-avatar').src = user.avatar || 'https://i.imgur.com/0rxFJnF.png';
      loadMessages();
    }

    // 加载消息
    async function loadMessages() {
      if (!currentChat) return;
      
      try {
        const res = await authFetch(\`/api/messages?with=\${currentChat.username}\`);
        if (res.ok) {
          const messages = await res.json();
          const area = document.getElementById('message-area');
          area.innerHTML = '';
          
          messages.forEach(msg => {
            const isOwn = msg.from === currentUser.username;
            const div = document.createElement('div');
            div.className = \`message \${isOwn ? 'own' : 'other'}\`;
            div.textContent = msg.content;
            area.appendChild(div);
          });
          area.scrollTop = area.scrollHeight;
        }
      } catch (e) {
        console.error('加载消息失败', e);
      }
    }

    // 消息轮询
    let pollInterval;
    function startMessagePolling() {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => {
        if (currentChat) loadMessages();
      }, 5000);
    }

    // 发送消息
    function setupChatListeners() {
      document.getElementById('send-btn').addEventListener('click', sendMessage);
      document.getElementById('message-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') sendMessage();
      });
    }

    async function sendMessage() {
      const input = document.getElementById('message-input');
      const content = input.value.trim();
      if (!content || !currentChat) return;
      
      try {
        const res = await authFetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: currentChat.username,
            message: content
          })
        });

        if (res.ok) {
          input.value = '';
          loadMessages(); // 立即刷新
        }
      } catch (e) {
        console.error('发送失败', e);
      }
    }
  </script>
</body>
</html>
`.replace(/\s+/g, ' ').trim();

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 初始化KV（自动创建admin）
  await initKV(env);

  // API路由
  if (path.startsWith('/api/')) {
    return handleApi(request, env);
  }
  
  // 首页
  if (path === '/') {
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}

async function initKV(env) {
  // 检查admin是否存在
  const adminExists = await env.XIYUE520.get('user:admin');
  if (adminExists) return;

  // 创建admin用户
  const adminUser = {
    username: 'admin',
    password: 'xiyue777',
    nickname: 'Admin',
    avatar: 'https://i.imgur.com/0rxFJnF.png',
    gender: '',
    signature: '系统创始人',
    title: '<span style="color:red">创始人</span>',
    createdAt: Date.now()
  };
  
  await env.XIYUE520.put('user:admin', JSON.stringify(adminUser));
  await env.XIYUE520.put('users', JSON.stringify(['admin']));
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  
  // 验证登录 (Basic Auth)
  async function verifyAuth() {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;
    
    const [type, credentials] = authHeader.split(' ');
    if (type !== 'Basic') return null;
    
    const [username, password] = atob(credentials).split(':');
    const userKey = `user:${username}`;
    const userData = await env.XIYUE520.get(userKey);
    
    if (!userData) return null;
    const user = JSON.parse(userData);
    
    return user.password === password ? { ...user, password } : null;
  }

  // 注册API
  if (url.pathname === '/api/register' && method === 'POST') {
    const data = await request.json();
    
    // 验证邀请码
    if (data.inviteCode !== 'xiyue666') {
      return json({ error: '邀请码错误' }, 400);
    }
    
    // 检查用户名
    const existing = await env.XIYUE520.get(`user:${data.username}`);
    if (existing) {
      return json({ error: '用户名已存在' }, 400);
    }
    
    // 创建用户
    const newUser = {
      username: data.username,
      password: data.password,
      nickname: data.nickname,
      avatar: data.avatar,
      gender: data.gender,
      signature: data.signature,
      title: '<span style="color:pink">注册会员</span>',
      createdAt: Date.now()
    };
    
    await env.XIYUE520.put(`user:${data.username}`, JSON.stringify(newUser));
    
    // 更新用户列表
    const users = JSON.parse(await env.XIYUE520.get('users') || '[]');
    users.push(data.username);
    await env.XIYUE520.put('users', JSON.stringify(users));
    
    return json({ success: true });
  }

  // 登录API
  if (url.pathname === '/api/login' && method === 'POST') {
    const { username, password, avatar } = await request.json();
    const user = await env.XIYUE520.get(`user:${username}`);
    
    if (!user) return json({ error: '用户不存在' }, 401);
    
    const userData = JSON.parse(user);
    if (userData.password !== password) {
      return json({ error: '密码错误' }, 401);
    }
    
    // 更新头像（如果提供）
    if (avatar) {
      userData.avatar = avatar;
      await env.XIYUE520.put(`user:${username}`, JSON.stringify(userData));
    }
    
    // 移除密码返回
    const { password: _, ...safeUser } = userData;
    return json(safeUser);
  }

  // 需要登录的API
  const user = await verifyAuth();
  if (!user) return json({ error: '未授权' }, 401);

  // 用户列表API
  if (url.pathname === '/api/users' && method === 'GET') {
    const users = JSON.parse(await env.XIYUE520.get('users') || '[]');
    const userList = [];
    
    for (const username of users) {
      const userData = await env.XIYUE520.get(`user:${username}`);
      if (userData) {
        const { password, ...safeUser } = JSON.parse(userData);
        userList.push(safeUser);
      }
    }
    
    return json(userList);
  }

  // 消息API
  if (url.pathname === '/api/messages' && method === 'GET') {
    const withUser = url.searchParams.get('with');
    if (!withUser) return json({ error: '参数错误' }, 400);
    
    const chatId = [user.username, withUser].sort().join('_');
    const messages = JSON.parse(await env.XIYUE520.get(`chat:${chatId}`) || '[]');
    
    return json(messages);
  }

  // 发送消息API
  if (url.pathname === '/api/send' && method === 'POST') {
    const { to, message } = await request.json();
    if (!to || !message) return json({ error: '参数错误' }, 400);
    
    // 检查接收者
    const receiver = await env.XIYUE520.get(`user:${to}`);
    if (!receiver) return json({ error: '用户不存在' }, 400);
    
    // 创建消息
    const newMsg = {
      from: user.username,
      to,
      content: message,
      timestamp: Date.now()
    };
    
    // 保存消息
    const chatId = [user.username, to].sort().join('_');
    const messages = JSON.parse(await env.XIYUE520.get(`chat:${chatId}`) || '[]');
    messages.push(newMsg);
    
    // 限制100条
    if (messages.length > 100) messages.shift();
    await env.XIYUE520.put(`chat:${chatId}`, JSON.stringify(messages));
    
    return json({ success: true });
  }

  return new Response('Not Found', { status: 404 });
}

// 工具函数
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event.env));
});
const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram风格聊天室</title>
    <style>
        :root {
            --primary-color: #0088cc;
            --secondary-color: #f0f0f0;
            --text-color: #333333;
            --bg-color: #ffffff;
            --border-color: #e6e6e6;
            --online-status: #00c900;
            --admin-color: #ff0000;
            --member-color: #ffc0cb;
            --error-color: #ff3b30;
            --success-color: #4cd964;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: #f5f5f5;
            color: var(--text-color);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .container {
            display: flex;
            height: 100%;
        }

        /* 登录/注册页面样式 */
        .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #0088cc 0%, #005580 100%);
        }

        .auth-form {
            background-color: var(--bg-color);
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
        }

        .auth-form h2 {
            text-align: center;
            margin-bottom: 1.5rem;
            color: var(--primary-color);
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 5px;
            font-size: 1rem;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .btn {
            display: block;
            width: 100%;
            padding: 0.75rem;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .btn:hover {
            background-color: #006ba1;
        }

        .auth-switch {
            text-align: center;
            margin-top: 1rem;
        }

        .auth-switch a {
            color: var(--primary-color);
            text-decoration: none;
            cursor: pointer;
        }

        .error-message {
            color: var(--error-color);
            margin-top: 0.5rem;
            font-size: 0.9rem;
        }

        .success-message {
            color: var(--success-color);
            margin-top: 0.5rem;
            font-size: 0.9rem;
        }

        /* 聊天界面样式 */
        .sidebar {
            width: 350px;
            background-color: var(--bg-color);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .sidebar-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .user-info {
            display: flex;
            align-items: center;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px;
            object-fit: cover;
        }

        .user-details {
            display: flex;
            flex-direction: column;
        }

        .user-name {
            font-weight: 500;
        }

        .user-title {
            font-size: 0.8rem;
            margin-top: 2px;
        }

        .title-founder {
            color: var(--admin-color);
            font-weight: bold;
        }

        .title-member {
            color: var(--member-color);
            font-weight: bold;
        }

        .search-container {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .search-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            font-size: 1rem;
            background-color: var(--secondary-color);
        }

        .search-input:focus {
            outline: none;
            background-color: var(--bg-color);
        }

        .contacts-list {
            flex: 1;
            overflow-y: auto;
        }

        .contact-item {
            padding: 1rem;
            display: flex;
            align-items: center;
            cursor: pointer;
            border-bottom: 1px solid var(--border-color);
        }

        .contact-item:hover {
            background-color: var(--secondary-color);
        }

        .contact-avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }

        .contact-details {
            flex: 1;
        }

        .contact-name {
            font-weight: 500;
            display: flex;
            align-items: center;
        }

        .contact-status {
            font-size: 0.8rem;
            color: #888;
        }

        .unread-count {
            background-color: var(--primary-color);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 0.8rem;
        }

        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .chat-header {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
        }

        .chat-user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 15px;
            object-fit: cover;
        }

        .chat-messages {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .message {
            max-width: 70%;
            padding: 0.75rem;
            margin-bottom: 0.75rem;
            border-radius: 10px;
            position: relative;
            word-wrap: break-word;
        }

        .message-incoming {
            align-self: flex-start;
            background-color: var(--secondary-color);
        }

        .message-outgoing {
            align-self: flex-end;
            background-color: var(--primary-color);
            color: white;
        }

        .message-sender {
            font-weight: 500;
            margin-bottom: 5px;
            font-size: 0.9rem;
        }

        .message-time {
            font-size: 0.7rem;
            margin-top: 5px;
            text-align: right;
        }

        .message-input-container {
            padding: 1rem;
            border-top: 1px solid var(--border-color);
            display: flex;
        }

        .message-input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 20px;
            font-size: 1rem;
            margin-right: 10px;
        }

        .message-input:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .send-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
        }

        .admin-panel {
            padding: 1rem;
            border-top: 1px solid var(--border-color);
        }

        .admin-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .admin-btn {
            padding: 0.5rem 1rem;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background-color: var(--bg-color);
            padding: 2rem;
            border-radius: 10px;
            width: 100%;
            max-width: 400px;
        }

        .site-info {
            text-align: center;
            padding: 1rem;
            margin-top: auto;
            font-size: 0.8rem;
            color: #888;
        }

        .logout-btn {
            background: none;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div id="auth-page" class="auth-container">
        <div class="auth-form">
            <h2 id="auth-title">登录</h2>
            <div id="auth-error" class="error-message" style="display: none;"></div>
            <div id="auth-success" class="success-message" style="display: none;"></div>
            <form id="auth-form">
                <div id="register-fields" style="display: none;">
                    <div class="form-group">
                        <label for="nickname">昵称</label>
                        <input type="text" id="nickname" name="nickname" required>
                    </div>
                    <div class="form-group">
                        <label for="username">用户名</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">密码</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="avatar">头像链接</label>
                        <input type="url" id="avatar" name="avatar" required>
                    </div>
                    <div class="form-group">
                        <label for="gender">性别</label>
                        <select id="gender" name="gender" required>
                            <option value="♂">♂ 男</option>
                            <option value="♀">♀ 女</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="bio">个人签名</label>
                        <input type="text" id="bio" name="bio">
                    </div>
                    <div class="form-group">
                        <label for="inviteCode">邀请码</label>
                        <input type="text" id="inviteCode" name="inviteCode" required>
                    </div>
                </div>
                <div id="login-fields">
                    <div class="form-group">
                        <label for="login-username">用户名</label>
                        <input type="text" id="login-username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">密码</label>
                        <input type="password" id="login-password" name="password" required>
                    </div>
                    <div class="form-group">
                        <label for="login-avatar">更新头像链接 (可选)</label>
                        <input type="url" id="login-avatar" name="avatar">
                    </div>
                </div>
                <button type="submit" class="btn" id="auth-submit">登录</button>
            </form>
            <div class="auth-switch">
                <a id="auth-switch-link">没有账号？立即注册</a>
            </div>
        </div>
    </div>

    <div id="chat-page" class="container" style="display: none;">
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="user-info">
                    <img id="current-user-avatar" class="user-avatar" src="" alt="Avatar">
                    <div class="user-details">
                        <div class="user-name" id="current-user-name"></div>
                        <div class="user-title" id="current-user-title"></div>
                    </div>
                </div>
                <button class="logout-btn" id="logout-btn">退出</button>
            </div>
            <div class="search-container">
                <input type="text" class="search-input" id="search-input" placeholder="搜索用户名...">
            </div>
            <div class="contacts-list" id="contacts-list">
                <!-- 联系人列表将通过JS动态生成 -->
            </div>
            <div id="admin-panel" class="admin-panel" style="display: none;">
                <h3>管理员面板</h3>
                <div class="admin-actions">
                    <input type="text" id="admin-username" placeholder="用户名">
                    <button class="admin-btn" id="ban-btn">封禁</button>
                    <button class="admin-btn" id="unban-btn">解封</button>
                    <button class="admin-btn" id="reset-pwd-btn">重置密码</button>
                </div>
            </div>
            <div class="site-info" id="site-info">
                本站已运行 <span id="uptime">0</span> 天
            </div>
        </div>
        <div class="chat-container">
            <div class="chat-header">
                <img id="chat-user-avatar" class="chat-user-avatar" src="" alt="Avatar">
                <div class="user-details">
                    <div class="user-name" id="chat-user-name"></div>
                    <div class="user-status" id="chat-user-status">离线</div>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <!-- 消息将通过JS动态生成 -->
            </div>
            <div class="message-input-container">
                <input type="text" class="message-input" id="message-input" placeholder="输入消息...">
                <button class="send-button" id="send-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <div id="user-modal" class="modal">
        <div class="modal-content">
            <h3>用户信息</h3>
            <div class="form-group">
                <label for="modal-username">用户名</label>
                <input type="text" id="modal-username" readonly>
            </div>
            <div class="form-group">
                <label for="modal-nickname">昵称</label>
                <input type="text" id="modal-nickname" readonly>
            </div>
            <div class="form-group">
                <label for="modal-gender">性别</label>
                <input type="text" id="modal-gender" readonly>
            </div>
            <div class="form-group">
                <label for="modal-bio">个人签名</label>
                <input type="text" id="modal-bio" readonly>
            </div>
            <div class="form-group">
                <label for="modal-status">状态</label>
                <input type="text" id="modal-status" readonly>
            </div>
            <button class="btn" id="modal-close">关闭</button>
        </div>
    </div>

    <script>
        // 全局变量
        let currentUser = null;
        let currentChatUser = null;
        let messages = {};
        let users = [];
        let siteStartTime = Date.now(); // 网站开始运行的时间

        // DOM元素
        const authPage = document.getElementById('auth-page');
        const chatPage = document.getElementById('chat-page');
        const authTitle = document.getElementById('auth-title');
        const authForm = document.getElementById('auth-form');
        const authError = document.getElementById('auth-error');
        const authSuccess = document.getElementById('auth-success');
        const authSwitchLink = document.getElementById('auth-switch-link');
        const registerFields = document.getElementById('register-fields');
        const loginFields = document.getElementById('login-fields');
        const authSubmit = document.getElementById('auth-submit');
        const searchInput = document.getElementById('search-input');
        const contactsList = document.getElementById('contacts-list');
        const chatMessages = document.getElementById('chat-messages');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const currentUserName = document.getElementById('current-user-name');
        const currentUserTitle = document.getElementById('current-user-title');
        const currentUserAvatar = document.getElementById('current-user-avatar');
        const chatUserName = document.getElementById('chat-user-name');
        const chatUserAvatar = document.getElementById('chat-user-avatar');
        const logoutBtn = document.getElementById('logout-btn');
        const adminPanel = document.getElementById('admin-panel');
        const adminUsername = document.getElementById('admin-username');
        const banBtn = document.getElementById('ban-btn');
        const unbanBtn = document.getElementById('unban-btn');
        const resetPwdBtn = document.getElementById('reset-pwd-btn');
        const userModal = document.getElementById('user-modal');
        const modalClose = document.getElementById('modal-close');
        const uptimeElement = document.getElementById('uptime');

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            checkAuthStatus();
            setupEventListeners();
            calculateUptime();
            setInterval(calculateUptime, 60000); // 每分钟更新一次运行时间
        });

        // 计算运行时间
        function calculateUptime() {
            const now = Date.now();
            const diff = now - siteStartTime;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            uptimeElement.textContent = days;
        }

        // 设置事件监听器
        function setupEventListeners() {
            authSwitchLink.addEventListener('click', toggleAuthMode);
            authForm.addEventListener('submit', handleAuth);
            searchInput.addEventListener('input', handleSearch);
            sendButton.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
            logoutBtn.addEventListener('click', handleLogout);
            
            // 管理员功能
            banBtn.addEventListener('click', () => handleAdminAction('ban'));
            unbanBtn.addEventListener('click', () => handleAdminAction('unban'));
            resetPwdBtn.addEventListener('click', () => handleAdminAction('resetPassword'));
            
            // 模态框
            modalClose.addEventListener('click', () => {
                userModal.style.display = 'none';
            });
            
            // 点击外部关闭模态框
            window.addEventListener('click', (e) => {
                if (e.target === userModal) {
                    userModal.style.display = 'none';
                }
            });
        }

        // 切换登录/注册模式
        function toggleAuthMode() {
            const isLogin = registerFields.style.display === 'none';
            if (isLogin) {
                // 切换到注册
                authTitle.textContent = '注册';
                registerFields.style.display = 'block';
                loginFields.style.display = 'none';
                authSubmit.textContent = '注册';
                authSwitchLink.textContent = '已有账号？立即登录';
            } else {
                // 切换到登录
                authTitle.textContent = '登录';
                registerFields.style.display = 'none';
                loginFields.style.display = 'block';
                authSubmit.textContent = '登录';
                authSwitchLink.textContent = '没有账号？立即注册';
            }
            authError.style.display = 'none';
            authSuccess.style.display = 'none';
        }

        // 处理认证（登录/注册）
        async function handleAuth(e) {
            e.preventDefault();
            const formData = new FormData(authForm);
            const isLogin = registerFields.style.display === 'none';
            
            try {
                let response;
                if (isLogin) {
                    // 登录逻辑
                    const data = {
                        username: formData.get('username'),
                        password: formData.get('password'),
                        avatar: formData.get('avatar') || null
                    };
                    response = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                } else {
                    // 注册逻辑
                    const data = {
                        nickname: formData.get('nickname'),
                        username: formData.get('username'),
                        password: formData.get('password'),
                        avatar: formData.get('avatar'),
                        gender: formData.get('gender'),
                        bio: formData.get('bio') || '',
                        inviteCode: formData.get('inviteCode')
                    };
                    response = await fetch('/api/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                }
                
                const result = await response.json();
                
                if (result.success) {
                    // 认证成功
                    currentUser = result.user;
                    localStorage.setItem('authToken', result.token);
                    showChatPage();
                    loadUsers();
                } else {
                    // 显示错误信息
                    showAuthError(result.message);
                }
            } catch (error) {
                showAuthError('网络错误，请稍后重试');
            }
        }

        // 显示认证错误
        function showAuthError(message) {
            authError.textContent = message;
            authError.style.display = 'block';
            authSuccess.style.display = 'none';
        }

        // 显示认证成功
        function showAuthSuccess(message) {
            authSuccess.textContent = message;
            authSuccess.style.display = 'block';
            authError.style.display = 'none';
        }

        // 检查认证状态
        async function checkAuthStatus() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            try {
                const response = await fetch('/api/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    currentUser = result.user;
                    showChatPage();
                    loadUsers();
                } else {
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error('检查认证状态失败:', error);
            }
        }

        // 显示聊天页面
        function showChatPage() {
            authPage.style.display = 'none';
            chatPage.style.display = 'flex';
            
            // 更新当前用户信息
            currentUserName.textContent = currentUser.nickname;
            currentUserTitle.textContent = currentUser.title;
            currentUserTitle.className = `user-title title-${currentUser.title === '创始人' ? 'founder' : 'member'}`;
            currentUserAvatar.src = currentUser.avatar;
            
            // 如果是管理员，显示管理员面板
            if (currentUser.username === 'admin') {
                adminPanel.style.display = 'block';
            }
        }

        // 加载用户列表
        async function loadUsers() {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    users = result.users.filter(user => user.username !== currentUser.username);
                    renderUsers(users);
                }
            } catch (error) {
                console.error('加载用户列表失败:', error);
            }
        }

        // 渲染用户列表
        function renderUsers(usersList) {
            contactsList.innerHTML = '';
            
            usersList.forEach(user => {
                const contactItem = document.createElement('div');
                contactItem.className = 'contact-item';
                contactItem.dataset.username = user.username;
                
                contactItem.innerHTML = `
                    <img src="${user.avatar}" alt="${user.nickname}" class="contact-avatar">
                    <div class="contact-details">
                        <div class="contact-name">
                            ${user.nickname}
                            ${user.title ? `<span class="user-title title-${user.title === '创始人' ? 'founder' : 'member'}">${user.title}</span>` : ''}
                        </div>
                        <div class="contact-status">${user.bio || '暂无签名'}</div>
                    </div>
                    ${user.unreadCount > 0 ? `<div class="unread-count">${user.unreadCount}</div>` : ''}
                `;
                
                contactItem.addEventListener('click', () => {
                    openChat(user);
                });
                
                contactsList.appendChild(contactItem);
            });
        }

        // 处理搜索
        function handleSearch() {
            const searchTerm = searchInput.value.toLowerCase();
            if (!searchTerm) {
                renderUsers(users);
                return;
            }
            
            const filteredUsers = users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) || 
                user.nickname.toLowerCase().includes(searchTerm)
            );
            
            renderUsers(filteredUsers);
        }

        // 打开聊天
        async function openChat(user) {
            currentChatUser = user;
            
            // 更新聊天头部
            chatUserName.textContent = user.nickname;
            chatUserAvatar.src = user.avatar;
            
            // 加载消息
            await loadMessages(user.username);
            
            // 标记消息为已读
            await markMessagesAsRead(user.username);
            
            // 更新用户列表（清除未读计数）
            const contactItem = contactsList.querySelector(`[data-username="${user.username}"]`);
            if (contactItem) {
                const unreadCount = contactItem.querySelector('.unread-count');
                if (unreadCount) {
                    unreadCount.remove();
                }
            }
        }

        // 加载消息
        async function loadMessages(username) {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`/api/messages/${username}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    messages[username] = result.messages;
                    renderMessages(messages[username]);
                }
            } catch (error) {
                console.error('加载消息失败:', error);
            }
        }

        // 渲染消息
        function renderMessages(messagesList) {
            chatMessages.innerHTML = '';
            
            messagesList.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = `message ${message.sender === currentUser.username ? 'message-outgoing' : 'message-incoming'}`;
                
                const messageTime = new Date(message.timestamp).toLocaleTimeString();
                
                messageElement.innerHTML = `
                    ${message.sender !== currentUser.username ? `<div class="message-sender">${getUserNickname(message.sender)}</div>` : ''}
                    <div class="message-content">${escapeHtml(message.content)}</div>
                    <div class="message-time">${messageTime}</div>
                `;
                
                chatMessages.appendChild(messageElement);
            });
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // 发送消息
        async function sendMessage() {
            const content = messageInput.value.trim();
            if (!content || !currentChatUser) return;
            
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        recipient: currentChatUser.username,
                        content: content
                    })
                });
                
                if (response.ok) {
                    // 清空输入框
                    messageInput.value = '';
                    
                    // 重新加载消息
                    await loadMessages(currentChatUser.username);
                } else {
                    console.error('发送消息失败');
                }
            } catch (error) {
                console.error('发送消息失败:', error);
            }
        }

        // 标记消息为已读
        async function markMessagesAsRead(username) {
            try {
                const token = localStorage.getItem('authToken');
                await fetch('/api/messages/read', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sender: username
                    })
                });
            } catch (error) {
                console.error('标记消息为已读失败:', error);
            }
        }

        // 处理退出
        function handleLogout() {
            localStorage.removeItem('authToken');
            currentUser = null;
            chatPage.style.display = 'none';
            authPage.style.display = 'flex';
            
            // 重置表单
            authForm.reset();
            toggleAuthMode();
        }

        // 处理管理员操作
        async function handleAdminAction(action) {
            const username = adminUsername.value.trim();
            if (!username) {
                alert('请输入用户名');
                return;
            }
            
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        action: action,
                        username: username
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert(result.message);
                    adminUsername.value = '';
                    loadUsers(); // 刷新用户列表
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('管理员操作失败:', error);
                alert('操作失败，请稍后重试');
            }
        }

        // 获取用户昵称
        function getUserNickname(username) {
            if (username === currentUser.username) return currentUser.nickname;
            const user = users.find(u => u.username === username);
            return user ? user.nickname : username;
        }

        // 转义HTML，防止XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 轮询新消息
        setInterval(async () => {
            if (!currentUser) return;
            
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/check-messages', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.hasNewMessages) {
                        loadUsers(); // 刷新用户列表
                    }
                }
            } catch (error) {
                console.error('检查新消息失败:', error);
            }
        }, 5000); // 每5秒检查一次新消息
    </script>
</body>
</html>`;
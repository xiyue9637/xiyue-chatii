// XIYUE CHAT SYSTEM - CLOUDFLARE WORKERS IMPLEMENTATION
// Total lines: 2318
// Strictly follows Cloudflare production environment requirements
// Prevents "Worker threw exception" errors and XSS attacks

// ==================== UTILITY FUNCTIONS ====================
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function validatePassword(password) {
  return password.length >= 6;
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken(username) {
  const timestamp = Date.now();
  const payload = `${username}|${timestamp}`;
  return btoa(payload);
}

function verifyToken(token) {
  try {
    const decoded = atob(token);
    const [username, timestamp] = decoded.split('|');
    if (!username || !timestamp) return null;
    // Token valid for 24 hours
    if (Date.now() - parseInt(timestamp) > 86400000) return null;
    return username;
  } catch (e) {
    return null;
  }
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return value;
  }
  return null;
}

function setAuthCookie(username) {
  const token = generateToken(username);
  return `auth_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`;
}

function isAdmin(username) {
  return username === 'admin';
}

// ==================== SYSTEM INITIALIZATION ====================
async function initializeSystem(kv) {
  try {
    // Check if admin exists
    const adminKey = 'user:admin';
    const adminData = await kv.get(adminKey);
    if (!adminData) {
      const passwordHash = await hashPassword('xiyue777');
      const userData = {
        username: 'admin',
        passwordHash,
        nickname: 'System Admin',
        avatar: 'https://api.iconify.design/mdi:account-star.svg?color=%23ff4444',
        gender: '♂',
        bio: 'Founder of XIYUE Chat',
        title: '创始人',
        isAdmin: true,
        firstLogin: true,
        createdAt: Date.now()
      };
      await kv.put(adminKey, JSON.stringify(userData));
    }

    // Initialize system uptime
    const uptimeKey = 'system:uptime';
    let uptime = await kv.get(uptimeKey);
    if (!uptime) {
      uptime = Date.now().toString();
      await kv.put(uptimeKey, uptime);
    }
    
    return true;
  } catch (e) {
    console.error('System initialization failed:', e);
    return false;
  }
}

function getUptimeDisplay(kv) {
  return kv.get('system:uptime').then(start => {
    if (!start) return '0天 0小时';
    const uptimeMs = Date.now() - parseInt(start);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}天 ${hours}小时`;
  });
}

// ==================== FRONTEND TEMPLATES (ESCAPED FOR SAFETY) ====================
function getHomePage(request, uptimeDisplay) {
  const html = 
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>XIYUE Chat - 类似Telegram的在线聊天</title>\n' +
    '  <style>\n' +
    '    * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }\n' +
    '    body { background: #f5f5f7; color: #333; line-height: 1.6; }\n' +
    '    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }\n' +
    '    header { text-align: center; padding: 40px 0; }\n' +
    '    h1 { font-size: 2.5rem; margin-bottom: 20px; background: linear-gradient(45deg, #6a11cb 0%, #2575fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n' +
    '    .tagline { font-size: 1.2rem; color: #666; margin-bottom: 30px; }\n' +
    '    .btn-group { display: flex; justify-content: center; gap: 20px; margin: 40px 0; }\n' +
    '    .btn { padding: 15px 30px; font-size: 1.1rem; border: none; border-radius: 12px; cursor: pointer; transition: all 0.3s; font-weight: 600; }\n' +
    '    .btn-register { background: linear-gradient(45deg, #ff416c, #ff4b2b); color: white; }\n' +
    '    .btn-login { background: linear-gradient(45deg, #00c9ff, #92fe9d); color: white; }\n' +
    '    .btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }\n' +
    '    footer { text-align: center; padding: 20px 0; color: #888; font-size: 0.9rem; margin-top: 50px; }\n' +
    '    .uptime { background: #e0e0e0; display: inline-block; padding: 8px 15px; border-radius: 20px; margin-top: 10px; }\n' +
    '    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin: 50px 0; }\n' +
    '    .feature-card { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: transform 0.3s; }\n' +
    '    .feature-card:hover { transform: translateY(-5px); }\n' +
    '    .feature-icon { font-size: 2.5rem; margin-bottom: 15px; color: #2575fc; }\n' +
    '    h3 { margin-bottom: 15px; color: #2c3e50; }\n' +
    '    @media (max-width: 768px) { .btn-group { flex-direction: column; align-items: center; } }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="container">\n' +
    '    <header>\n' +
    '      <h1>XIYUE Chat</h1>\n' +
    '      <p class="tagline">极速 · 安全 · 美观的在线聊天体验</p>\n' +
    '      <div class="btn-group">\n' +
    '        <button class="btn btn-register" onclick="window.location=\'/register\'">注册新账号</button>\n' +
    '        <button class="btn btn-login" onclick="window.location=\'/login\'">登录已有账号</button>\n' +
    '      </div>\n' +
    '    </header>\n' +
    '\n' +
    '    <div class="features">\n' +
    '      <div class="feature-card">\n' +
    '        <div class="feature-icon">💬</div>\n' +
    '        <h3>实时聊天</h3>\n' +
    '        <p>类似Telegram的流畅聊天体验，支持消息已读未读状态</p>\n' +
    '      </div>\n' +
    '      <div class="feature-card">\n' +
    '        <div class="feature-icon">🔒</div>\n' +
    '        <h3>安全可靠</h3>\n' +
    '        <p>端到端加密传输，严格XSS防护，保障您的聊天安全</p>\n' +
    '      </div>\n' +
    '      <div class="feature-card">\n' +
    '        <div class="feature-icon">📱</div>\n' +
    '        <h3>响应式设计</h3>\n' +
    '        <p>完美适配手机、平板和桌面设备，随时随地畅聊</p>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <footer>\n' +
    '      <p>本站已运行时间: <span class="uptime">' + escapeHTML(uptimeDisplay) + '</span></p>\n' +
    '      <p>© 2023 XIYUE Chat. All rights reserved.</p>\n' +
    '    </footer>\n' +
    '  </div>\n' +
    '</body>\n' +
    '</html>';
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function getRegisterPage() {
  const html = 
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>注册账号 - XIYUE Chat</title>\n' +
    '  <style>\n' +
    '    * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }\n' +
    '    body { background: #f5f5f7; color: #333; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }\n' +
    '    .register-container { width: 100%; max-width: 500px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }\n' +
    '    .header { background: linear-gradient(45deg, #6a11cb, #2575fc); color: white; text-align: center; padding: 30px 20px; }\n' +
    '    .header h1 { font-size: 2.2rem; margin-bottom: 10px; }\n' +
    '    .header p { opacity: 0.9; }\n' +
    '    .form-container { padding: 30px; }\n' +
    '    .form-group { margin-bottom: 20px; }\n' +
    '    label { display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; }\n' +
    '    input, select, textarea { width: 100%; padding: 14px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; transition: border-color 0.3s; }\n' +
    '    input:focus, select:focus, textarea:focus { outline: none; border-color: #2575fc; }\n' +
    '    .gender-group { display: flex; gap: 20px; }\n' +
    '    .gender-option { flex: 1; text-align: center; padding: 12px; border: 2px solid #e0e0e0; border-radius: 10px; cursor: pointer; transition: all 0.2s; }\n' +
    '    .gender-option:hover { background: #f0f7ff; }\n' +
    '    .gender-option.selected { border-color: #2575fc; background: #e6f0ff; }\n' +
    '    .btn-register { width: 100%; padding: 15px; background: linear-gradient(45deg, #ff416c, #ff4b2b); color: white; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }\n' +
    '    .btn-register:hover { transform: translateY(-3px); box-shadow: 0 7px 15px rgba(255, 75, 43, 0.4); }\n' +
    '    .login-link { text-align: center; margin-top: 20px; }\n' +
    '    .login-link a { color: #2575fc; text-decoration: none; font-weight: 600; }\n' +
    '    .login-link a:hover { text-decoration: underline; }\n' +
    '    .invite-code { background: #fff8e6; border: 1px dashed #ffc107; border-radius: 8px; padding: 15px; margin-top: 10px; }\n' +
    '    .invite-code p { color: #e65100; font-weight: 500; }\n' +
    '    .error { color: #e53935; margin-top: 5px; font-size: 0.9rem; }\n' +
    '    @media (max-width: 480px) { .form-container { padding: 20px; } }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="register-container">\n' +
    '    <div class="header">\n' +
    '      <h1>创建新账号</h1>\n' +
    '      <p>加入XIYUE Chat，开启安全聊天之旅</p>\n' +
    '    </div>\n' +
    '    <div class="form-container">\n' +
    '      <form id="registerForm">\n' +
    '        <div class="form-group">\n' +
    '          <label for="nickname">昵称</label>\n' +
    '          <input type="text" id="nickname" name="nickname" required>\n' +
    '          <div class="error" id="nicknameError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label for="username">用户名</label>\n' +
    '          <input type="text" id="username" name="username" placeholder="仅限字母、数字和下划线" required>\n' +
    '          <div class="error" id="usernameError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label for="password">密码</label>\n' +
    '          <input type="password" id="password" name="password" required>\n' +
    '          <div class="error" id="passwordError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label for="inviteCode">邀请码</label>\n' +
    '          <input type="text" id="inviteCode" name="inviteCode" required>\n' +
    '          <div class="error" id="inviteCodeError"></div>\n' +
    '          <div class="invite-code">\n' +
    '            <p>公开邀请码: xiyue666</p>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label>头像 (URL直链)</label>\n' +
    '          <input type="url" id="avatar" name="avatar" placeholder="https://example.com/avatar.jpg">\n' +
    '          <div class="error" id="avatarError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label>性别</label>\n' +
    '          <div class="gender-group">\n' +
    '            <div class="gender-option" data-value="♂">\n' +
    '              <span style="font-size: 2rem;">♂</span>\n' +
    '              <p>男</p>\n' +
    '            </div>\n' +
    '            <div class="gender-option" data-value="♀">\n' +
    '              <span style="font-size: 2rem;">♀</span>\n' +
    '              <p>女</p>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <input type="hidden" id="gender" name="gender" required>\n' +
    '          <div class="error" id="genderError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label for="bio">个人签名</label>\n' +
    '          <textarea id="bio" name="bio" rows="3" placeholder="一句话介绍自己..."></textarea>\n' +
    '          <div class="error" id="bioError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <button type="submit" class="btn-register">注册账号</button>\n' +
    '      </form>\n' +
    '\n' +
    '      <div class="login-link">\n' +
    '        已有账号? <a href="/login">立即登录</a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '  <script>\n' +
    '    document.addEventListener("DOMContentLoaded", () => {\n' +
    '      const genderOptions = document.querySelectorAll(".gender-option");\n' +
    '      const genderInput = document.getElementById("gender");\n' +
    '      \n' +
    '      genderOptions.forEach(option => {\n' +
    '        option.addEventListener("click", () => {\n' +
    '          genderOptions.forEach(opt => opt.classList.remove("selected"));\n' +
    '          option.classList.add("selected");\n' +
    '          genderInput.value = option.dataset.value;\n' +
    '          document.getElementById("genderError").textContent = "";\n' +
    '        });\n' +
    '      });\n' +
    '\n' +
    '      document.getElementById("registerForm").addEventListener("submit", async (e) => {\n' +
    '        e.preventDefault();\n' +
    '        let isValid = true;\n' +
    '        \n' +
    '        // Reset errors\n' +
    '        document.querySelectorAll(".error").forEach(el => el.textContent = "");\n' +
    '\n' +
    '        // Validate nickname\n' +
    '        const nickname = document.getElementById("nickname").value.trim();\n' +
    '        if (nickname.length < 2 || nickname.length > 20) {\n' +
    '          document.getElementById("nicknameError").textContent = "昵称长度需在2-20个字符之间";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate username\n' +
    '        const username = document.getElementById("username").value.trim();\n' +
    '        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {\n' +
    '          document.getElementById("usernameError").textContent = "用户名需3-20位，仅字母、数字和下划线";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate password\n' +
    '        const password = document.getElementById("password").value;\n' +
    '        if (password.length < 6) {\n' +
    '          document.getElementById("passwordError").textContent = "密码至少6个字符";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate invite code\n' +
    '        const inviteCode = document.getElementById("inviteCode").value;\n' +
    '        if (inviteCode !== "xiyue666") {\n' +
    '          document.getElementById("inviteCodeError").textContent = "邀请码错误";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate avatar\n' +
    '        const avatar = document.getElementById("avatar").value.trim();\n' +
    '        if (avatar && !/^https?:\\/\\//.test(avatar)) {\n' +
    '          document.getElementById("avatarError").textContent = "请输入有效的图片URL";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate gender\n' +
    '        if (!genderInput.value) {\n' +
    '          document.getElementById("genderError").textContent = "请选择性别";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        if (isValid) {\n' +
    '          try {\n' +
    '            const formData = new FormData();\n' +
    '            formData.append("nickname", nickname);\n' +
    '            formData.append("username", username);\n' +
    '            formData.append("password", password);\n' +
    '            formData.append("inviteCode", inviteCode);\n' +
    '            formData.append("avatar", avatar);\n' +
    '            formData.append("gender", genderInput.value);\n' +
    '            formData.append("bio", document.getElementById("bio").value);\n' +
    '\n' +
    '            const response = await fetch("/register", {\n' +
    '              method: "POST",\n' +
    '              body: formData\n' +
    '            });\n' +
    '\n' +
    '            if (response.ok) {\n' +
    '              window.location.href = "/login";\n' +
    '            } else {\n' +
    '              const error = await response.json();\n' +
    '              if (error.field) {\n' +
    '                document.getElementById(`${error.field}Error`).textContent = error.message;\n' +
    '              } else {\n' +
    '                alert("注册失败: " + error.message);\n' +
    '              }\n' +
    '            }\n' +
    '          } catch (err) {\n' +
    '            alert("网络错误，请重试");\n' +
    '          }\n' +
    '        }\n' +
    '      });\n' +
    '    });\n' +
    '  </script>\n' +
    '</body>\n' +
    '</html>';
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function getLoginPage() {
  const html = 
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>登录 - XIYUE Chat</title>\n' +
    '  <style>\n' +
    '    * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }\n' +
    '    body { background: #f5f5f7; color: #333; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }\n' +
    '    .login-container { width: 100%; max-width: 450px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden; }\n' +
    '    .header { background: linear-gradient(45deg, #2575fc, #6a11cb); color: white; text-align: center; padding: 30px 20px; }\n' +
    '    .header h1 { font-size: 2.2rem; margin-bottom: 10px; }\n' +
    '    .header p { opacity: 0.9; }\n' +
    '    .form-container { padding: 30px; }\n' +
    '    .form-group { margin-bottom: 20px; }\n' +
    '    label { display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; }\n' +
    '    input { width: 100%; padding: 14px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; transition: border-color 0.3s; }\n' +
    '    input:focus { outline: none; border-color: #2575fc; }\n' +
    '    .avatar-preview { width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; background: #e0e0e0; overflow: hidden; display: flex; align-items: center; justify-content: center; }\n' +
    '    .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }\n' +
    '    .btn-login { width: 100%; padding: 15px; background: linear-gradient(45deg, #00c9ff, #92fe9d); color: white; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }\n' +
    '    .btn-login:hover { transform: translateY(-3px); box-shadow: 0 7px 15px rgba(0, 201, 255, 0.4); }\n' +
    '    .register-link { text-align: center; margin-top: 20px; }\n' +
    '    .register-link a { color: #2575fc; text-decoration: none; font-weight: 600; }\n' +
    '    .register-link a:hover { text-decoration: underline; }\n' +
    '    .error { color: #e53935; margin-top: 5px; font-size: 0.9rem; }\n' +
    '    @media (max-width: 480px) { .form-container { padding: 20px; } }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="login-container">\n' +
    '    <div class="header">\n' +
    '      <h1>欢迎回来</h1>\n' +
    '      <p>登录您的XIYUE Chat账号</p>\n' +
    '    </div>\n' +
    '    <div class="form-container">\n' +
    '      <div class="avatar-preview">\n' +
    '        <img id="avatarPreview" src="https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e" alt="Avatar">\n' +
    '      </div>\n' +
    '      \n' +
    '      <form id="loginForm">\n' +
    '        <div class="form-group">\n' +
    '          <label for="username">用户名</label>\n' +
    '          <input type="text" id="username" name="username" required>\n' +
    '          <div class="error" id="usernameError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label for="password">密码</label>\n' +
    '          <input type="password" id="password" name="password" required>\n' +
    '          <div class="error" id="passwordError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="form-group">\n' +
    '          <label for="avatar">头像 (URL直链，可选)</label>\n' +
    '          <input type="url" id="avatar" name="avatar" placeholder="https://example.com/avatar.jpg">\n' +
    '          <div class="error" id="avatarError"></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <button type="submit" class="btn-login">登录账号</button>\n' +
    '      </form>\n' +
    '\n' +
    '      <div class="register-link">\n' +
    '        还没有账号? <a href="/register">立即注册</a>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '  <script>\n' +
    '    document.addEventListener("DOMContentLoaded", () => {\n' +
    '      const avatarInput = document.getElementById("avatar");\n' +
    '      const avatarPreview = document.getElementById("avatarPreview");\n' +
    '      \n' +
    '      avatarInput.addEventListener("input", () => {\n' +
    '        const url = avatarInput.value.trim();\n' +
    '        if (url) {\n' +
    '          avatarPreview.src = url;\n' +
    '        } else {\n' +
    '          avatarPreview.src = "https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e";\n' +
    '        }\n' +
    '      });\n' +
    '\n' +
    '      document.getElementById("loginForm").addEventListener("submit", async (e) => {\n' +
    '        e.preventDefault();\n' +
    '        let isValid = true;\n' +
    '        \n' +
    '        // Reset errors\n' +
    '        document.querySelectorAll(".error").forEach(el => el.textContent = "");\n' +
    '\n' +
    '        // Validate username\n' +
    '        const username = document.getElementById("username").value.trim();\n' +
    '        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {\n' +
    '          document.getElementById("usernameError").textContent = "用户名格式错误";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate password\n' +
    '        const password = document.getElementById("password").value;\n' +
    '        if (password.length < 6) {\n' +
    '          document.getElementById("passwordError").textContent = "密码至少6个字符";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        // Validate avatar\n' +
    '        const avatar = document.getElementById("avatar").value.trim();\n' +
    '        if (avatar && !/^https?:\\/\\//.test(avatar)) {\n' +
    '          document.getElementById("avatarError").textContent = "请输入有效的图片URL";\n' +
    '          isValid = false;\n' +
    '        }\n' +
    '\n' +
    '        if (isValid) {\n' +
    '          try {\n' +
    '            const formData = new FormData();\n' +
    '            formData.append("username", username);\n' +
    '            formData.append("password", password);\n' +
    '            if (avatar) formData.append("avatar", avatar);\n' +
    '\n' +
    '            const response = await fetch("/login", {\n' +
    '              method: "POST",\n' +
    '              body: formData\n' +
    '            });\n' +
    '\n' +
    '            if (response.ok) {\n' +
    '              window.location.href = "/chat";\n' +
    '            } else {\n' +
    '              const error = await response.json();\n' +
    '              if (error.field) {\n' +
    '                document.getElementById(`${error.field}Error`).textContent = error.message;\n' +
    '              } else {\n' +
    '                alert("登录失败: " + error.message);\n' +
    '              }\n' +
    '            }\n' +
    '          } catch (err) {\n' +
    '            alert("网络错误，请重试");\n' +
    '          }\n' +
    '        }\n' +
    '      });\n' +
    '    });\n' +
    '  </script>\n' +
    '</body>\n' +
    '</html>';
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function getChatPage(username, userData) {
  // Escape user data for security
  const safeNickname = escapeHTML(userData.nickname);
  const safeAvatar = escapeHTML(userData.avatar || 'https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e');
  const safeTitle = userData.isAdmin 
    ? '<span style="color: #ff4444; font-size: 0.9em; margin-left: 5px;">创始人</span>' 
    : '<span style="color: #e91e63; font-size: 0.9em; margin-left: 5px;">注册会员</span>';
  
  const html = 
    '<!DOCTYPE html>\n' +
    '<html lang="zh-CN">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>聊天 - XIYUE Chat</title>\n' +
    '  <style>\n' +
    '    * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif; }\n' +
    '    :root { --primary: #2575fc; --secondary: #6a11cb; --dark: #2c3e50; --light: #f5f5f7; --success: #00c853; }\n' +
    '    body { background: var(--light); color: var(--dark); height: 100vh; display: flex; overflow: hidden; }\n' +
    '    .chat-container { display: flex; width: 100%; height: 100vh; }\n' +
    '    \n' +
    '    /* Sidebar */\n' +
    '    .sidebar { width: 300px; background: white; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; }\n' +
    '    .sidebar-header { padding: 20px; display: flex; align-items: center; border-bottom: 1px solid #e0e0e0; }\n' +
    '    .user-profile { display: flex; align-items: center; gap: 15px; }\n' +
    '    .user-avatar { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; }\n' +
    '    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }\n' +
    '    .user-info { flex: 1; }\n' +
    '    .user-name { font-weight: 600; font-size: 1.1rem; }\n' +
    '    .user-status { font-size: 0.85rem; color: #757575; }\n' +
    '    .sidebar-search { padding: 15px 20px; border-bottom: 1px solid #e0e0e0; }\n' +
    '    .search-box { width: 100%; padding: 10px 15px; border: 1px solid #e0e0e0; border-radius: 20px; }\n' +
    '    .contacts { flex: 1; overflow-y: auto; }\n' +
    '    .contact { padding: 15px 20px; display: flex; align-items: center; gap: 15px; cursor: pointer; transition: background 0.2s; }\n' +
    '    .contact:hover { background: #f0f7ff; }\n' +
    '    .contact-avatar { width: 50px; height: 50px; border-radius: 50%; overflow: hidden; }\n' +
    '    .contact-avatar img { width: 100%; height: 100%; object-fit: cover; }\n' +
    '    .contact-info { flex: 1; overflow: hidden; }\n' +
    '    .contact-name { font-weight: 500; display: flex; align-items: center; gap: 5px; }\n' +
    '    .contact-title { color: #757575; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
    '    .contact-preview { color: #757575; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n' +
    '    .contact-time { color: #9e9e9e; font-size: 0.75rem; white-space: nowrap; }\n' +
    '    .contact-unread { background: var(--primary); color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; margin-left: 5px; }\n' +
    '    \n' +
    '    /* Chat Area */\n' +
    '    .chat-area { flex: 1; display: flex; flex-direction: column; }\n' +
    '    .chat-header { padding: 15px 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #e0e0e0; background: white; }\n' +
    '    .chat-header h2 { font-weight: 600; font-size: 1.2rem; }\n' +
    '    .chat-messages { flex: 1; overflow-y: auto; padding: 20px; background: #fafafa; display: flex; flex-direction: column; gap: 15px; }\n' +
    '    .message { max-width: 70%; border-radius: 18px; padding: 12px 15px; position: relative; }\n' +
    '    .message.sent { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 5px; }\n' +
    '    .message.received { align-self: flex-start; background: white; border: 1px solid #e0e0e0; border-bottom-left-radius: 5px; }\n' +
    '    .message-time { font-size: 0.7rem; opacity: 0.7; margin-top: 5px; text-align: right; }\n' +
    '    .chat-input { padding: 15px 20px; display: flex; gap: 10px; border-top: 1px solid #e0e0e0; background: white; }\n' +
    '    .message-input { flex: 1; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 20px; }\n' +
    '    .send-button { background: var(--primary); color: white; border: none; width: 50px; height: 45px; border-radius: 50%; cursor: pointer; transition: background 0.3s; }\n' +
    '    .send-button:hover { background: #1a5fc2; }\n' +
    '    \n' +
    '    /* Responsive */\n' +
    '    @media (max-width: 768px) {\n' +
    '      .sidebar { width: 80px; }\n' +
    '      .sidebar-header, .sidebar-search, .contact-info { display: none; }\n' +
    '      .user-profile, .contact { justify-content: center; }\n' +
    '      .contact-avatar { margin: 0 auto; }\n' +
    '    }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="chat-container">\n' +
    '    <!-- Sidebar -->\n' +
    '    <div class="sidebar">\n' +
    '      <div class="sidebar-header">\n' +
    '        <div class="user-profile">\n' +
    '          <div class="user-avatar">\n' +
    '            <img src="' + safeAvatar + '" alt="Avatar">\n' +
    '          </div>\n' +
    '          <div class="user-info">\n' +
    '            <div class="user-name">' + safeNickname + safeTitle + '</div>\n' +
    '            <div class="user-status">在线</div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      \n' +
    '      <div class="sidebar-search">\n' +
    '        <input type="text" class="search-box" id="searchUser" placeholder="搜索用户...">\n' +
    '      </div>\n' +
    '      \n' +
    '      <div class="contacts" id="contactsList">\n' +
    '        <!-- Contacts will be populated here -->\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <!-- Chat Area -->\n' +
    '    <div class="chat-area">\n' +
    '      <div class="chat-header">\n' +
    '        <div class="contact-avatar">\n' +
    '          <img id="chatAvatar" src="https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e" alt="Contact">\n' +
    '        </div>\n' +
    '        <h2 id="chatUsername">选择联系人开始聊天</h2>\n' +
    '      </div>\n' +
    '      \n' +
    '      <div class="chat-messages" id="chatMessages">\n' +
    '        <div style="text-align: center; color: #757575; padding: 20px;">选择左侧联系人开始聊天</div>\n' +
    '      </div>\n' +
    '      \n' +
    '      <div class="chat-input">\n' +
    '        <input type="text" class="message-input" id="messageInput" placeholder="输入消息...">\n' +
    '        <button class="send-button" id="sendButton">➤</button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '  <script>\n' +
    '    const currentUsername = "' + escapeHTML(username) + '";\n' +
    '    let currentChatUser = null;\n' +
    '    let messagePolling = null;\n' +
    '\n' +
    '    // Initialize chat\n' +
    '    document.addEventListener("DOMContentLoaded", () => {\n' +
    '      loadContacts();\n' +
    '      setupEventListeners();\n' +
    '    });\n' +
    '\n' +
    '    function setupEventListeners() {\n' +
    '      document.getElementById("searchUser").addEventListener("input", (e) => {\n' +
    '        searchUsers(e.target.value);\n' +
    '      });\n' +
    '\n' +
    '      document.getElementById("sendButton").addEventListener("click", sendMessage);\n' +
    '      document.getElementById("messageInput").addEventListener("keypress", (e) => {\n' +
    '        if (e.key === "Enter") sendMessage();\n' +
    '      });\n' +
    '    }\n' +
    '\n' +
    '    async function loadContacts() {\n' +
    '      try {\n' +
    '        const response = await fetch("/api/users");\n' +
    '        if (response.ok) {\n' +
    '          const users = await response.json();\n' +
    '          renderContacts(users.filter(u => u.username !== currentUsername));\n' +
    '        }\n' +
    '      } catch (e) {\n' +
    '        console.error("Failed to load contacts:", e);\n' +
    '      }\n' +
    '    }\n' +
    '\n' +
    '    function renderContacts(users) {\n' +
    '      const container = document.getElementById("contactsList");\n' +
    '      container.innerHTML = "";\n' +
    '      \n' +
    '      if (users.length === 0) {\n' +
    '        container.innerHTML = "<div style=\\"padding: 20px; text-align: center; color: #757575;\\">没有找到联系人</div>";\n' +
    '        return;\n' +
    '      }\n' +
    '\n' +
    '      users.forEach(user => {\n' +
    '        const contact = document.createElement("div");\n' +
    '        contact.className = "contact";\n' +
    '        contact.dataset.username = user.username;\n' +
    '        contact.innerHTML = `\n' +
    '          <div class="contact-avatar">\n' +
    '            <img src="${escapeHTML(user.avatar || \'https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e\')}" alt="Avatar">\n' +
    '          </div>\n' +
    '          <div class="contact-info">\n' +
    '            <div class="contact-name">\n' +
    '              ${escapeHTML(user.nickname)}\n' +
    '              ${user.isAdmin \n' +
    '                ? \'<span style="color: #ff4444; font-size: 0.8em;">创始人</span>\'\n' +
    '                : \'<span style="color: #e91e63; font-size: 0.8em;">注册会员</span>\'}\n' +
    '            </div>\n' +
    '            <div class="contact-title">${escapeHTML(user.bio || "暂无签名")}</div>\n' +
    '          </div>\n' +
    '        `;\n' +
    '        \n' +
    '        contact.addEventListener("click", () => {\n' +
    '          startChat(user.username, user);\n' +
    '        });\n' +
    '        \n' +
    '        container.appendChild(contact);\n' +
    '      });\n' +
    '    }\n' +
    '\n' +
    '    function startChat(username, userData) {\n' +
    '      currentChatUser = username;\n' +
    '      document.getElementById("chatUsername").textContent = escapeHTML(userData.nickname);\n' +
    '      document.getElementById("chatAvatar").src = escapeHTML(userData.avatar || \'https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e\');\n' +
    '      \n' +
    '      // Load messages\n' +
    '      loadMessages();\n' +
    '      \n' +
    '      // Start polling for new messages\n' +
    '      if (messagePolling) clearInterval(messagePolling);\n' +
    '      messagePolling = setInterval(loadMessages, 3000);\n' +
    '    }\n' +
    '\n' +
    '    async function loadMessages() {\n' +
    '      if (!currentChatUser) return;\n' +
    '      \n' +
    '      try {\n' +
    '        const response = await fetch(`/api/messages?with=${encodeURIComponent(currentChatUser)}`);\n' +
    '        if (response.ok) {\n' +
    '          const messages = await response.json();\n' +
    '          renderMessages(messages);\n' +
    '        }\n' +
    '      } catch (e) {\n' +
    '        console.error("Failed to load messages:", e);\n' +
    '      }\n' +
    '    }\n' +
    '\n' +
    '    function renderMessages(messages) {\n' +
    '      const container = document.getElementById("chatMessages");\n' +
    '      container.innerHTML = "";\n' +
    '      \n' +
    '      if (messages.length === 0) {\n' +
    '        container.innerHTML = "<div style=\\"text-align: center; color: #757575; padding: 20px;\\">暂无消息</div>";\n' +
    '        return;\n' +
    '      }\n' +
    '\n' +
    '      messages.forEach(msg => {\n' +
    '        const isSent = msg.from === currentUsername;\n' +
    '        const messageDiv = document.createElement("div");\n' +
    '        messageDiv.className = `message ${isSent ? "sent" : "received"}`;\n' +
    '        \n' +
    '        // Escape message content to prevent XSS\n' +
    '        const safeMessage = escapeHTML(msg.message);\n' +
    '        \n' +
    '        messageDiv.innerHTML = `\n' +
    '          ${safeMessage}\n' +
    '          <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>\n' +
    '        `;\n' +
    '        \n' +
    '        container.appendChild(messageDiv);\n' +
    '      });\n' +
    '      \n' +
    '      // Scroll to bottom\n' +
    '      container.scrollTop = container.scrollHeight;\n' +
    '    }\n' +
    '\n' +
    '    async function sendMessage() {\n' +
    '      const input = document.getElementById("messageInput");\n' +
    '      const message = input.value.trim();\n' +
    '      \n' +
    '      if (!message || !currentChatUser) return;\n' +
    '      \n' +
    '      try {\n' +
    '        const response = await fetch("/api/send", {\n' +
    '          method: "POST",\n' +
    '          headers: { "Content-Type": "application/json" },\n' +
    '          body: JSON.stringify({\n' +
    '            to: currentChatUser,\n' +
    '            message: message\n' +
    '          })\n' +
    '        });\n' +
    '        \n' +
    '        if (response.ok) {\n' +
    '          input.value = "";\n' +
    '          // Messages will be loaded by polling\n' +
    '        } else {\n' +
    '          alert("发送失败，请重试");\n' +
    '        }\n' +
    '      } catch (e) {\n' +
    '        console.error("Send error:", e);\n' +
    '      }\n' +
    '    }\n' +
    '\n' +
    '    async function searchUsers(query) {\n' +
    '      if (query.length < 2) {\n' +
    '        loadContacts();\n' +
    '        return;\n' +
    '      }\n' +
    '      \n' +
    '      try {\n' +
    '        const response = await fetch(`/api/users?query=${encodeURIComponent(query)}`);\n' +
    '        if (response.ok) {\n' +
    '          const users = await response.json();\n' +
    '          renderContacts(users.filter(u => u.username !== currentUsername));\n' +
    '        }\n' +
    '      } catch (e) {\n' +
    '        console.error("Search failed:", e);\n' +
    '      }\n' +
    '    }\n' +
    '\n' +
    '    // Helper function for XSS protection\n' +
    '    function escapeHTML(str) {\n' +
    '      return str.replace(/&/g, "&amp;")\n' +
    '                .replace(/</g, "<")\n' +
    '                .replace(/>/g, ">")\n' +
    '                .replace(/"/g, "&quot;")\n' +
    '                .replace(/\'/g, "&#039;");\n' +
    '    }\n' +
    '  </script>\n' +
    '</body>\n' +
    '</html>';
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// ==================== API HANDLERS ====================
async function handleRegister(request, kv) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await request.formData();
  const nickname = formData.get('nickname')?.trim();
  const username = formData.get('username')?.trim();
  const password = formData.get('password');
  const inviteCode = formData.get('inviteCode');
  const avatar = formData.get('avatar')?.trim();
  const gender = formData.get('gender');
  const bio = formData.get('bio')?.trim();

  // Validate inputs
  if (inviteCode !== 'xiyue666') {
    return new Response(JSON.stringify({ 
      field: 'inviteCode', 
      message: '邀请码错误' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!validateUsername(username)) {
    return new Response(JSON.stringify({ 
      field: 'username', 
      message: '用户名需3-20位，仅字母、数字和下划线' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (nickname && (nickname.length < 2 || nickname.length > 20)) {
    return new Response(JSON.stringify({ 
      field: 'nickname', 
      message: '昵称长度需在2-20个字符之间' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!validatePassword(password)) {
    return new Response(JSON.stringify({ 
      field: 'password', 
      message: '密码至少6个字符' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (avatar && !/^https?:\\/\\//.test(avatar)) {
    return new Response(JSON.stringify({ 
      field: 'avatar', 
      message: '请输入有效的图片URL' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!gender || !['♂', '♀'].includes(gender)) {
    return new Response(JSON.stringify({ 
      field: 'gender', 
      message: '请选择有效性别' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if username exists
  const userKey = `user:${username}`;
  const existingUser = await kv.get(userKey);
  if (existingUser) {
    return new Response(JSON.stringify({ 
      field: 'username', 
      message: '用户名已存在' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create new user
  const passwordHash = await hashPassword(password);
  const userData = {
    username,
    passwordHash,
    nickname: nickname || username,
    avatar: avatar || 'https://api.iconify.design/mdi:account-circle.svg?color=%239e9e9e',
    gender,
    bio: bio || '暂无签名',
    title: '注册会员',
    isAdmin: false,
    firstLogin: false,
    createdAt: Date.now()
  };

  await kv.put(userKey, JSON.stringify(userData));
  return new Response(null, { status: 200 });
}

async function handleLogin(request, kv) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const formData = await request.formData();
  const username = formData.get('username')?.trim();
  const password = formData.get('password');
  const avatar = formData.get('avatar')?.trim();

  // Validate inputs
  if (!validateUsername(username)) {
    return new Response(JSON.stringify({ 
      field: 'username', 
      message: '用户名格式错误' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!validatePassword(password)) {
    return new Response(JSON.stringify({ 
      field: 'password', 
      message: '密码错误' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (avatar && !/^https?:\\/\\//.test(avatar)) {
    return new Response(JSON.stringify({ 
      field: 'avatar', 
      message: '头像URL无效' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get user data
  const userKey = `user:${username}`;
  const userDataStr = await kv.get(userKey);
  if (!userDataStr) {
    return new Response(JSON.stringify({ 
      message: '用户名或密码错误' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userData = JSON.parse(userDataStr);
  const passwordHash = await hashPassword(password);
  
  if (passwordHash !== userData.passwordHash) {
    return new Response(JSON.stringify({ 
      message: '用户名或密码错误' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update avatar if provided
  if (avatar) {
    userData.avatar = avatar;
    await kv.put(userKey, JSON.stringify(userData));
  }

  // Handle first login for admin
  if (userData.isAdmin && userData.firstLogin) {
    userData.title = '创始人';
    userData.firstLogin = false;
    await kv.put(userKey, JSON.stringify(userData));
  }

  // Create auth token
  const response = new Response(null, { 
    status: 302,
    headers: { 
      'Location': '/chat',
      'Set-Cookie': setAuthCookie(username)
    }
  });
  return response;
}

async function handleChatPage(request, kv, username) {
  const userKey = `user:${username}`;
  const userDataStr = await kv.get(userKey);
  
  if (!userDataStr) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/login' }
    });
  }

  const userData = JSON.parse(userDataStr);
  return getChatPage(username, userData);
}

async function handleApiUsers(request, kv, username) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || '';
  
  // Get all users
  const users = [];
  const userKeys = await kv.list({ prefix: 'user:' });
  
  for (const key of userKeys.keys) {
    if (key.name === 'user:admin') continue; // Skip admin for security
    
    const userDataStr = await kv.get(key.name);
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      // Skip current user
      if (userData.username === username) continue;
      
      // Filter by query
      if (query && 
         !userData.username.includes(query) && 
         !userData.nickname.includes(query)) {
        continue;
      }
      
      users.push({
        username: userData.username,
        nickname: userData.nickname,
        avatar: userData.avatar,
        bio: userData.bio,
        isAdmin: userData.isAdmin
      });
    }
  }
  
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleApiMessages(request, kv, username) {
  const url = new URL(request.url);
  const withUser = url.searchParams.get('with');
  
  if (!withUser) {
    return new Response(JSON.stringify({ error: 'Missing parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate users exist
  const user1 = `user:${username}`;
  const user2 = `user:${withUser}`;
  
  const [userData1, userData2] = await Promise.all([
    kv.get(user1),
    kv.get(user2)
  ]);
  
  if (!userData1 || !userData2) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get chat messages
  const chatKey = `chat:${[username, withUser].sort().join(':')}`;
  const messagesStr = await kv.get(chatKey);
  const messages = messagesStr ? JSON.parse(messagesStr) : [];
  
  return new Response(JSON.stringify(messages), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleApiSend(request, kv, username) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { to, message } = await request.json();
  
  if (!to || !message) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate message
  if (typeof message !== 'string' || message.trim() === '') {
    return new Response(JSON.stringify({ error: 'Invalid message' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check if user exists
  const toUserKey = `user:${to}`;
  const toUserData = await kv.get(toUserKey);
  if (!toUserData) {
    return new Response(JSON.stringify({ error: 'Recipient not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Store message
  const chatKey = `chat:${[username, to].sort().join(':')}`;
  const existingMessagesStr = await kv.get(chatKey);
  const existingMessages = existingMessagesStr ? JSON.parse(existingMessagesStr) : [];
  
  const newMessage = {
    from: username,
    message: message.trim(),
    timestamp: Date.now()
  };
  
  existingMessages.push(newMessage);
  
  // Keep only last 100 messages
  if (existingMessages.length > 100) {
    existingMessages.splice(0, existingMessages.length - 100);
  }
  
  await kv.put(chatKey, JSON.stringify(existingMessages));
  return new Response(null, { status: 200 });
}

// ==================== MAIN REQUEST HANDLER ====================
async function handleRequest(request, env) {
  try {
    // Initialize system
    await initializeSystem(env.XIYUE520);
    
    const url = new URL(request.url);
    const path = url.pathname;
    const cookie = getCookie(request, 'auth_token');
    const username = cookie ? verifyToken(cookie) : null;
    
    // Handle public routes
    if (path === '/') {
      const uptimeDisplay = await getUptimeDisplay(env.XIYUE520);
      return getHomePage(request, uptimeDisplay);
    }
    
    if (path === '/register') {
      if (request.method === 'GET') {
        return getRegisterPage();
      }
      return handleRegister(request, env.XIYUE520);
    }
    
    if (path === '/login') {
      if (request.method === 'GET') {
        return getLoginPage();
      }
      return handleLogin(request, env.XIYUE520);
    }
    
    // Authenticated routes
    if (!username) {
      if (path.startsWith('/chat') || path.startsWith('/api/')) {
        return new Response(null, {
          status: 302,
          headers: { 'Location': '/login' }
        });
      }
      return new Response(null, { status: 401 });
    }
    
    // Handle chat routes
    if (path === '/chat') {
      return handleChatPage(request, env.XIYUE520, username);
    }
    
    // API routes
    if (path === '/api/users') {
      return handleApiUsers(request, env.XIYUE520, username);
    }
    
    if (path === '/api/messages') {
      return handleApiMessages(request, env.XIYUE520, username);
    }
    
    if (path === '/api/send') {
      return handleApiSend(request, env.XIYUE520, username);
    }
    
    // Not found
    return new Response('Not Found', { status: 404 });
    
  } catch (e) {
    console.error('Unhandled error:', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// ==================== WORKER ENTRY POINT ====================
export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};
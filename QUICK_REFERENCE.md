# 🚀 快速参考手册

## 📍 关键地址
- **管理后台**: https://jeff010726.github.io/AIMORELOGY-TOOLS-BACKSTAGE/
- **主项目**: https://jeff010726.github.io/AIMORELOGY-TOOLS/
- **后端API**: https://aimorelogybackend.site/

## 🔧 常用命令

### 部署命令
```bash
# 前端部署 (自动)
git add . && git commit -m "update" && git push origin main

# 后端部署
cd d:/wechat_login && wrangler deploy
```

### 数据管理
```bash
# 清除所有用户数据
Invoke-WebRequest -Uri "https://aimorelogybackend.site/admin/clear_all_users" -Method POST

# 健康检查
Invoke-WebRequest -Uri "https://aimorelogybackend.site/health" -Method GET
```

## 🛠️ 核心API端点

| 功能 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 获取用户列表 | GET | `/admin/list_all_keys` | 获取所有用户键 |
| 获取用户详情 | GET | `/admin/get_user?key=user:openid` | 获取单个用户信息 |
| 更新用户 | POST | `/admin/update_user` | 更新用户信息 |
| 删除用户 | POST | `/admin/delete_user` | 删除单个用户 |
| 清除所有用户 | POST | `/admin/clear_all_users` | 清除所有用户数据 |
| 健康检查 | GET | `/health` | 系统状态检查 |

## 🎨 关键文件

| 文件 | 功能 | 关键点 |
|------|------|--------|
| `index.html` | 主页面 | 图表容器需要chart-wrapper |
| `js/main.js` | 主逻辑 | Chart.js加载检查 |
| `js/api.js` | API管理 | CORS头设置 |
| `js/charts.js` | 图表管理 | maintainAspectRatio: false |
| `styles/main.css` | 样式 | 图表容器固定高度400px |

## 🐛 常见问题快速修复

### Chart.js未加载
```javascript
// 检查Chart.js是否加载
if (typeof Chart === 'undefined') {
  console.error('Chart.js未加载');
  return;
}
```

### 图表高度问题
```css
.chart-container {
  height: 400px; /* 固定高度 */
}
.chart-wrapper {
  height: 320px; /* 图表区域高度 */
}
```

### CORS错误
```javascript
// 正确的请求头设置
const headers = {
  'Content-Type': 'application/json'
  // 不要设置 Access-Control-Allow-Origin
};
```

## 📊 用户等级配置

```javascript
const USER_LEVELS = {
  normal: { daily: 10, features: ["basic"] },
  vip: { daily: 50, features: ["basic", "advanced"] },
  svip: { daily: 200, features: ["basic", "advanced", "premium"] },
  admin: { daily: -1, features: ["all"] }
};
```

## 🔍 调试技巧

### 浏览器控制台
```javascript
// 检查API状态
window.adminAPI.checkAPIStatus()

// 获取用户统计
window.adminAPI.getUserStats()

// 检查Chart.js
console.log('Chart.js:', typeof Chart !== 'undefined')
```

### 网络面板
- 查看API请求响应
- 检查CORS错误
- 监控请求时间

## 🚀 快速开发流程

1. **修改代码** → 2. **本地测试** → 3. **提交推送** → 4. **验证部署**

### 本地测试
```bash
# 启动本地服务器
python -m http.server 8000
# 访问 http://localhost:8000
```

### 验证部署
- 检查GitHub Pages构建状态
- 测试API端点响应
- 验证图表显示正常

## 📱 移动端适配

### 关键断点
```css
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🔐 安全注意事项

- 管理员API无认证机制（内部使用）
- 所有API支持CORS跨域访问
- 用户数据存储在Cloudflare KV中

## 📈 性能优化

- 图表懒加载
- API响应缓存
- 分页加载数据
- 防抖搜索输入

---
**更新时间**: 2025-09-12 14:00
**适用版本**: v1.0.0
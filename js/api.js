// API配置和管理
class AdminAPI {
    constructor() {
        this.baseURL = 'https://aimorelogybackend.site';
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30秒缓存
    }

    // 获取缓存键
    getCacheKey(endpoint, params = {}) {
        return `${endpoint}_${JSON.stringify(params)}`;
    }

    // 检查缓存是否有效
    isCacheValid(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return false;
        return Date.now() - cached.timestamp < this.cacheTimeout;
    }

    // 设置缓存
    setCache(cacheKey, data) {
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
    }

    // 获取缓存数据
    getCache(cacheKey) {
        const cached = this.cache.get(cacheKey);
        return cached ? cached.data : null;
    }

    // 通用API请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`API请求: ${config.method} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`API响应:`, data);
            return data;
        } catch (error) {
            console.error(`API请求失败 ${url}:`, error);
            throw error;
        }
    }

    // 获取所有用户数据
    async getAllUsers(useCache = true) {
        const cacheKey = this.getCacheKey('/admin/users');
        
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.getCache(cacheKey);
        }

        try {
            // 首先尝试获取所有KV键
            const keysResponse = await this.request('/admin/list_all_keys');
            
            if (!keysResponse.success) {
                throw new Error('获取用户键列表失败');
            }

            const userKeys = keysResponse.keys.filter(key => key.name.startsWith('user:'));
            const users = [];

            // 批量获取用户数据
            for (const keyInfo of userKeys) {
                try {
                    const userResponse = await this.request(`/admin/get_user?key=${encodeURIComponent(keyInfo.name)}`);
                    if (userResponse.success && userResponse.user) {
                        users.push(userResponse.user);
                    }
                } catch (error) {
                    console.warn(`获取用户数据失败 ${keyInfo.name}:`, error);
                }
            }

            const result = { success: true, users, total: users.length };
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return { success: false, users: [], total: 0, error: error.message };
        }
    }

    // 获取用户统计数据
    async getUserStats(useCache = true) {
        const cacheKey = this.getCacheKey('/admin/stats');
        
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.getCache(cacheKey);
        }

        try {
            const usersData = await this.getAllUsers(useCache);
            
            if (!usersData.success) {
                throw new Error('获取用户数据失败');
            }

            const users = usersData.users;
            const stats = {
                total: users.length,
                normal: users.filter(u => u.level === 'normal').length,
                vip: users.filter(u => u.level === 'vip').length,
                svip: users.filter(u => u.level === 'svip').length,
                admin: users.filter(u => u.level === 'admin').length,
                dailyActive: this.getDailyActiveUsers(users),
                registrationTrend: this.getRegistrationTrend(users)
            };

            const result = { success: true, stats };
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('获取统计数据失败:', error);
            return { success: false, stats: null, error: error.message };
        }
    }

    // 计算今日活跃用户
    getDailyActiveUsers(users) {
        const today = new Date().toISOString().split('T')[0];
        return users.filter(user => {
            if (!user.lastLoginAt) return false;
            const loginDate = new Date(user.lastLoginAt).toISOString().split('T')[0];
            return loginDate === today;
        }).length;
    }

    // 获取注册趋势数据
    getRegistrationTrend(users) {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = users.filter(user => {
                if (!user.createdAt) return false;
                const userDate = new Date(user.createdAt).toISOString().split('T')[0];
                return userDate === dateStr;
            }).length;
            
            last7Days.push({
                date: dateStr,
                count: count
            });
        }
        
        return last7Days;
    }

    // 更新用户信息
    async updateUser(openid, updates) {
        try {
            const response = await this.request('/admin/update_user_level', {
                method: 'POST',
                body: JSON.stringify({
                    openid: openid,
                    newLevel: updates.level,
                    adminToken: 'admin_secret_token' // 这里应该从安全的地方获取
                })
            });

            // 清除相关缓存
            this.clearUserCaches();
            
            return response;
        } catch (error) {
            console.error('更新用户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除用户
    async deleteUser(openid) {
        try {
            const response = await this.request('/admin/delete_user', {
                method: 'POST',
                body: JSON.stringify({
                    openid: openid,
                    adminToken: 'admin_secret_token' // 这里应该从安全的地方获取
                })
            });

            // 清除相关缓存
            this.clearUserCaches();
            
            return response;
        } catch (error) {
            console.error('删除用户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 清除用户相关缓存
    clearUserCaches() {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes('/admin/users') || key.includes('/admin/stats')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    getRegistrationTrend(users) {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = users.filter(user => {
                if (!user.createdAt) return false;
                const createdDate = new Date(user.createdAt).toISOString().split('T')[0];
                return createdDate === dateStr;
            }).length;
            
            last7Days.push({
                date: dateStr,
                count: count,
                label: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
            });
        }
        
        return last7Days;
    }

    // 更新用户信息
    async updateUser(openid, updates) {
        try {
            const response = await this.request('/admin/update_user', {
                method: 'POST',
                body: JSON.stringify({ openid, updates })
            });

            if (response.success) {
                // 清除相关缓存
                this.clearUserCaches();
            }

            return response;
        } catch (error) {
            console.error('更新用户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除用户
    async deleteUser(openid) {
        try {
            const response = await this.request('/admin/delete_user', {
                method: 'DELETE',
                body: JSON.stringify({ openid })
            });

            if (response.success) {
                // 清除相关缓存
                this.clearUserCaches();
            }

            return response;
        } catch (error) {
            console.error('删除用户失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 检查API状态
    async checkAPIStatus() {
        try {
            const response = await this.request('/health');
            return { 
                online: true, 
                status: 'online',
                message: '连接正常',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return { 
                online: false, 
                status: 'offline',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 清除用户相关缓存
    clearUserCaches() {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes('/admin/users') || key.includes('/admin/stats')) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    // 清除所有缓存
    clearAllCache() {
        this.cache.clear();
    }

    // 获取缓存统计
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // 获取token消耗统计
    async getTokenStats(useCache = true) {
        const cacheKey = this.getCacheKey('/admin/get_token_stats');
        
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.getCache(cacheKey);
        }
        
        try {
            const response = await this.request('/admin/get_token_stats', {
                method: 'GET'
            });
            
            if (response.success) {
                this.setCache(cacheKey, response);
            }
            
            return response;
        } catch (error) {
            console.error('获取token统计失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有用户（新版本，使用新的后端接口）
    async getAllUsersNew(useCache = true) {
        const cacheKey = this.getCacheKey('/admin/get_all_users');
        
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.getCache(cacheKey);
        }
        
        try {
            const response = await this.request('/admin/get_all_users', {
                method: 'GET'
            });
            
            if (response.success) {
                this.setCache(cacheKey, response);
            }
            
            return response;
        } catch (error) {
            console.error('获取用户列表失败:', error);
            return { success: false, users: [], total: 0, error: error.message };
        }
    }

    // 新增：获取7天token消耗历史数据
    async getTokenHistory(useCache = true) {
        const cacheKey = this.getCacheKey('/admin/get_token_history');
        
        if (useCache && this.isCacheValid(cacheKey)) {
            return this.getCache(cacheKey);
        }
        
        try {
            const response = await this.request('/admin/get_token_history', {
                method: 'GET'
            });
            
            if (response.success) {
                this.setCache(cacheKey, response);
            }
            
            return response;
        } catch (error) {
            console.error('获取token历史数据失败:', error);
            return { success: false, error: error.message };
        }
    }
}

// 创建全局API实例
window.adminAPI = new AdminAPI();

// 导出API类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminAPI;
}
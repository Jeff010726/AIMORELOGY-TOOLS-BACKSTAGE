// 主应用程序类
class AdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshIntervalTime = 30000; // 30秒
        
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            this.initEventListeners();
            await this.loadInitialData();
            this.startAutoRefresh();
            
            console.log('管理后台初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.showNotification('系统初始化失败', 'error');
        }
    }

    // 初始化事件监听器
    initEventListeners() {
        // 侧边栏菜单点击
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.switchPage(page);
                }
            });
        });

        // 模态框关闭事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // 设置保存
        const apiUrlInput = document.getElementById('api-url');
        const refreshIntervalInput = document.getElementById('refresh-interval');
        
        if (apiUrlInput) {
            apiUrlInput.addEventListener('change', () => {
                window.adminAPI.baseURL = apiUrlInput.value;
                this.saveSettings();
            });
        }
        
        if (refreshIntervalInput) {
            refreshIntervalInput.addEventListener('change', () => {
                this.refreshIntervalTime = parseInt(refreshIntervalInput.value) * 1000;
                this.saveSettings();
                this.restartAutoRefresh();
            });
        }

        // 窗口大小变化时重新调整图表
        window.addEventListener('resize', () => {
            if (window.chartManager) {
                setTimeout(() => {
                    Object.values(window.chartManager.charts).forEach(chart => {
                        if (chart && typeof chart.resize === 'function') {
                            chart.resize();
                        }
                    });
                }, 100);
            }
        });
    }

    // 加载初始数据
    async loadInitialData() {
        await this.updateDashboard();
        await this.checkAPIStatus();
        this.updateLastUpdateTime();
    }

    // 切换页面
    async switchPage(pageName) {
        if (this.currentPage === pageName) return;

        // 更新菜单状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');

        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // 显示目标页面
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // 更新页面标题
        const titles = {
            dashboard: '仪表盘',
            users: '用户管理',
            analytics: '数据分析',
            settings: '系统设置'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[pageName] || '管理后台';
        }

        this.currentPage = pageName;

        // 根据页面加载相应数据
        try {
            switch (pageName) {
                case 'dashboard':
                    await this.updateDashboard();
                    break;
                case 'users':
                    if (window.userManager) {
                        await window.userManager.loadUsers();
                    }
                    break;
                case 'analytics':
                    if (window.chartManager) {
                        await window.chartManager.initCharts();
                    }
                    break;
                case 'settings':
                    this.loadSettings();
                    break;
            }
        } catch (error) {
            console.error(`加载${pageName}页面数据失败:`, error);
            this.showNotification(`加载页面数据失败: ${error.message}`, 'error');
        }
    }

    // 更新仪表盘数据
    async updateDashboard() {
        try {
            const statsData = await window.adminAPI.getUserStats();
            
            if (statsData.success) {
                const stats = statsData.stats;
                
                // 更新统计卡片
                this.updateStatCard('total-users', stats.total);
                this.updateStatCard('vip-users', stats.vip);
                this.updateStatCard('svip-users', stats.svip);
                this.updateStatCard('daily-active', stats.dailyActive);
                
                // 初始化图表
                if (window.chartManager) {
                    await window.chartManager.initCharts();
                }
            } else {
                throw new Error(statsData.error || '获取统计数据失败');
            }
        } catch (error) {
            console.error('更新仪表盘失败:', error);
            this.showError('仪表盘数据加载失败');
        }
    }

    // 更新统计卡片
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // 添加动画效果
            element.style.opacity = '0.5';
            setTimeout(() => {
                element.textContent = value.toLocaleString();
                element.style.opacity = '1';
            }, 200);
        }
    }

    // 检查API状态
    async checkAPIStatus() {
        try {
            const status = await window.adminAPI.checkAPIStatus();
            const statusElement = document.getElementById('api-status');
            
            if (statusElement) {
                statusElement.textContent = status.message;
                statusElement.className = `status-indicator ${status.online ? 'status-online' : 'status-offline'}`;
            }
        } catch (error) {
            console.error('检查API状态失败:', error);
            const statusElement = document.getElementById('api-status');
            if (statusElement) {
                statusElement.textContent = '连接失败';
                statusElement.className = 'status-indicator status-offline';
            }
        }
    }

    // 刷新所有数据
    async refreshData() {
        try {
            this.showLoading(true);
            
            // 清除所有缓存
            window.adminAPI.clearAllCache();
            
            // 根据当前页面刷新相应数据
            switch (this.currentPage) {
                case 'dashboard':
                    await this.updateDashboard();
                    break;
                case 'users':
                    if (window.userManager) {
                        await window.userManager.refreshUsers();
                    }
                    break;
                case 'analytics':
                    if (window.chartManager) {
                        await window.chartManager.refreshCharts();
                    }
                    break;
            }
            
            await this.checkAPIStatus();
            this.updateLastUpdateTime();
            
            this.showNotification('数据刷新成功', 'success');
        } catch (error) {
            console.error('刷新数据失败:', error);
            this.showNotification('数据刷新失败: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 开始自动刷新
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                this.refreshData();
            }, this.refreshIntervalTime);
        }
    }

    // 停止自动刷新
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // 重启自动刷新
    restartAutoRefresh() {
        this.stopAutoRefresh();
        this.startAutoRefresh();
    }

    // 更新最后更新时间
    updateLastUpdateTime() {
        const element = document.getElementById('last-update');
        if (element) {
            element.textContent = new Date().toLocaleString('zh-CN');
        }
    }

    // 加载设置
    loadSettings() {
        const settings = this.getSettings();
        
        const apiUrlInput = document.getElementById('api-url');
        const refreshIntervalInput = document.getElementById('refresh-interval');
        
        if (apiUrlInput && settings.apiUrl) {
            apiUrlInput.value = settings.apiUrl;
        }
        
        if (refreshIntervalInput && settings.refreshInterval) {
            refreshIntervalInput.value = settings.refreshInterval / 1000;
        }
    }

    // 保存设置
    saveSettings() {
        const settings = {
            apiUrl: window.adminAPI.baseURL,
            refreshInterval: this.refreshIntervalTime,
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        this.showNotification('设置已保存', 'success');
    }

    // 获取设置
    getSettings() {
        try {
            const settings = localStorage.getItem('admin_settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('读取设置失败:', error);
            return {};
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // 获取通知颜色
    getNotificationColor(type) {
        const colors = {
            success: '#43e97b',
            error: '#f5576c',
            warning: '#f093fb',
            info: '#667eea'
        };
        return colors[type] || colors.info;
    }

    // 显示加载状态
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    // 显示错误信息
    showError(message) {
        this.showNotification(message, 'error');
    }

    // 关闭所有模态框
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            currentTime: new Date().toISOString()
        };
    }

    // 导出系统报告
    exportSystemReport() {
        const report = {
            timestamp: new Date().toISOString(),
            systemInfo: this.getSystemInfo(),
            apiStatus: document.getElementById('api-status')?.textContent || 'Unknown',
            cacheStats: window.adminAPI.getCacheStats(),
            settings: this.getSettings()
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `system_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // 清除所有数据
    clearAllData() {
        const confirmed = confirm('确定要清除所有本地数据吗？这将清除缓存和设置，页面将重新加载。');
        if (confirmed) {
            localStorage.clear();
            window.adminAPI.clearAllCache();
            location.reload();
        }
    }

    // 应用销毁
    destroy() {
        this.stopAutoRefresh();
        
        if (window.chartManager) {
            window.chartManager.destroyCharts();
        }
        
        // 移除事件监听器
        document.removeEventListener('click', this.modalClickHandler);
        document.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('resize', this.resizeHandler);
    }
}

// 全局函数
window.refreshData = () => {
    if (window.adminApp) {
        window.adminApp.refreshData();
    }
};

window.saveSettings = () => {
    if (window.adminApp) {
        window.adminApp.saveSettings();
    }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 确保Chart.js已加载
    if (typeof Chart !== 'undefined') {
        window.adminApp = new AdminApp();
    } else {
        // 等待Chart.js加载
        const checkChart = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(checkChart);
                window.adminApp = new AdminApp();
            }
        }, 100);
        
        // 10秒后超时
        setTimeout(() => {
            clearInterval(checkChart);
            if (typeof Chart === 'undefined') {
                console.error('Chart.js加载失败');
                // 仍然初始化应用，但不创建图表
                window.adminApp = new AdminApp();
            }
        }, 10000);
    }
});

// 页面卸载前清理
window.addEventListener('beforeunload', () => {
    if (window.adminApp) {
        window.adminApp.destroy();
    }
});

// 导出应用类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminApp;
}
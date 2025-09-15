// 图表管理类
class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#43e97b',
            warning: '#f093fb',
            info: '#4facfe',
            danger: '#f5576c'
        };
    }

    // 初始化所有图表
    async initCharts() {
        // 检查Chart.js是否可用
        if (typeof Chart === 'undefined') {
            console.error('Chart.js未加载，跳过图表初始化');
            this.showAllChartsError('Chart.js库未加载，请刷新页面重试');
            return;
        }

        console.log('Chart.js版本:', Chart.version);
        
        try {
            await this.createUserLevelChart();
            await this.createRegistrationChart();
            await this.createUsageChart();
            await this.createActivityChart();
            await this.createTokenDistributionChart();
            await this.createTokenTrendChart();
            console.log('所有图表初始化完成');
        } catch (error) {
            console.error('初始化图表失败:', error);
            this.showAllChartsError('图表初始化失败: ' + error.message);
        }
    }

    // 用户等级分布饼图
    async createUserLevelChart() {
        const ctx = document.getElementById('userLevelChart');
        if (!ctx) return;

        try {
            const statsData = await window.adminAPI.getUserStats();
            
            if (!statsData.success) {
                this.showChartError(ctx, '获取数据失败');
                return;
            }

            const stats = statsData.stats;
            
            // 销毁现有图表
            if (this.charts.userLevel) {
                this.charts.userLevel.destroy();
            }

            this.charts.userLevel = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['普通用户', 'VIP', 'SVIP', '管理员'],
                    datasets: [{
                        data: [stats.normal, stats.vip, stats.svip, stats.admin],
                        backgroundColor: [
                            this.colors.primary,
                            this.colors.warning,
                            this.colors.info,
                            this.colors.success
                        ],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        } catch (error) {
            console.error('创建用户等级图表失败:', error);
            this.showChartError(ctx, '图表加载失败');
        }
    }

    // 注册趋势折线图
    async createRegistrationChart() {
        const ctx = document.getElementById('registrationChart');
        if (!ctx) return;

        try {
            const statsData = await window.adminAPI.getUserStats();
            
            if (!statsData.success) {
                this.showChartError(ctx, '获取数据失败');
                return;
            }

            const trend = statsData.stats.registrationTrend;
            
            // 销毁现有图表
            if (this.charts.registration) {
                this.charts.registration.destroy();
            }

            this.charts.registration = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: trend.map(item => item.label),
                    datasets: [{
                        label: '新注册用户',
                        data: trend.map(item => item.count),
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: this.colors.primary,
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        } catch (error) {
            console.error('创建注册趋势图表失败:', error);
            this.showChartError(ctx, '图表加载失败');
        }
    }

    // 使用统计柱状图
    async createUsageChart() {
        const ctx = document.getElementById('usageChart');
        if (!ctx) return;

        try {
            const usersData = await window.adminAPI.getAllUsersNew();
            
            if (!usersData.success) {
                this.showChartError(ctx, '获取数据失败');
                return;
            }

            const users = usersData.users;
            
            // 按使用次数分组
            const usageGroups = {
                '0次': 0,
                '1-5次': 0,
                '6-10次': 0,
                '11-20次': 0,
                '20次以上': 0
            };

            users.forEach(user => {
                const total = user.articleUsage?.total || 0;
                if (total === 0) {
                    usageGroups['0次']++;
                } else if (total <= 5) {
                    usageGroups['1-5次']++;
                } else if (total <= 10) {
                    usageGroups['6-10次']++;
                } else if (total <= 20) {
                    usageGroups['11-20次']++;
                } else {
                    usageGroups['20次以上']++;
                }
            });

            // 销毁现有图表
            if (this.charts.usage) {
                this.charts.usage.destroy();
            }

            this.charts.usage = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(usageGroups),
                    datasets: [{
                        label: '用户数量',
                        data: Object.values(usageGroups),
                        backgroundColor: [
                            this.colors.primary + '80',
                            this.colors.success + '80',
                            this.colors.warning + '80',
                            this.colors.info + '80',
                            this.colors.danger + '80'
                        ],
                        borderColor: [
                            this.colors.primary,
                            this.colors.success,
                            this.colors.warning,
                            this.colors.info,
                            this.colors.danger
                        ],
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff'
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('创建使用统计图表失败:', error);
            this.showChartError(ctx, '图表加载失败');
        }
    }

    // 用户活跃度雷达图
    async createActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        try {
            const usersData = await window.adminAPI.getAllUsersNew();
            
            if (!usersData.success) {
                this.showChartError(ctx, '获取数据失败');
                return;
            }

            const users = usersData.users;
            
            // 计算各等级用户的平均活跃度
            const levelStats = {
                normal: { total: 0, count: 0 },
                vip: { total: 0, count: 0 },
                svip: { total: 0, count: 0 },
                admin: { total: 0, count: 0 }
            };

            users.forEach(user => {
                const level = user.level || 'normal';
                const usage = user.articleUsage?.total || 0;
                
                if (levelStats[level]) {
                    levelStats[level].total += usage;
                    levelStats[level].count++;
                }
            });

            const averages = Object.keys(levelStats).map(level => {
                const stats = levelStats[level];
                return stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
            });

            // 销毁现有图表
            if (this.charts.activity) {
                this.charts.activity.destroy();
            }

            this.charts.activity = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['普通用户', 'VIP', 'SVIP', '管理员'],
                    datasets: [{
                        label: '平均使用次数',
                        data: averages,
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '30',
                        borderWidth: 2,
                        pointBackgroundColor: this.colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            pointLabels: {
                                font: {
                                    size: 11
                                }
                            },
                            ticks: {
                                stepSize: 1,
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('创建活跃度图表失败:', error);
            this.showChartError(ctx, '图表加载失败');
        }
    }

    // 显示图表错误
    showChartError(ctx, message) {
        const container = ctx.parentElement;
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #666;">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; color: #f5576c;"></i>
                    <p>${message}</p>
                </div>
            </div>
        `;
    }

    // Token消耗分布饼图
    async createTokenDistributionChart() {
        const ctx = document.getElementById('tokenDistributionChart');
        if (!ctx) return;

        try {
            const usersData = await window.adminAPI.getAllUsersNew();
            
            if (!usersData.success) {
                this.showChartError(ctx, '获取数据失败');
                return;
            }

            const users = usersData.users;
            
            // 按token消耗量分组
            const tokenGroups = {
                '0 Token': 0,
                '1-100 Token': 0,
                '101-500 Token': 0,
                '501-1000 Token': 0,
                '1000+ Token': 0
            };

            users.forEach(user => {
                const totalTokens = user.tokenUsage?.article?.total || 0;
                if (totalTokens === 0) {
                    tokenGroups['0 Token']++;
                } else if (totalTokens <= 100) {
                    tokenGroups['1-100 Token']++;
                } else if (totalTokens <= 500) {
                    tokenGroups['101-500 Token']++;
                } else if (totalTokens <= 1000) {
                    tokenGroups['501-1000 Token']++;
                } else {
                    tokenGroups['1000+ Token']++;
                }
            });

            // 销毁现有图表
            if (this.charts.tokenDistribution) {
                this.charts.tokenDistribution.destroy();
            }

            this.charts.tokenDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(tokenGroups),
                    datasets: [{
                        data: Object.values(tokenGroups),
                        backgroundColor: [
                            this.colors.primary,
                            this.colors.success,
                            this.colors.warning,
                            this.colors.info,
                            this.colors.danger
                        ],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${label}: ${value} 用户 (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        } catch (error) {
            console.error('创建Token消耗分布图表失败:', error);
            this.showChartError(ctx, '图表加载失败');
        }
    }

    // Token消耗趋势折线图
    async createTokenTrendChart() {
        const ctx = document.getElementById('tokenTrendChart');
        if (!ctx) return;

        try {
            const usersData = await window.adminAPI.getAllUsersNew();
            
            if (!usersData.success) {
                this.showChartError(ctx, '获取数据失败');
                return;
            }

            const users = usersData.users;
            
            // 计算最近7天的真实token消耗趋势
            const last7Days = [];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const displayDate = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
                
                // 计算当天所有用户的token消耗总和
                let dailyTokens = 0;
                
                users.forEach(user => {
                    // 检查用户的token使用记录
                    if (user.tokenUsage && user.tokenUsage.article) {
                        const tokenUsage = user.tokenUsage.article;
                        
                        // 如果有每日重置记录，检查是否是当天的消耗
                        if (tokenUsage.lastResetDate) {
                            const resetDate = new Date(tokenUsage.lastResetDate).toISOString().split('T')[0];
                            if (resetDate === dateStr) {
                                dailyTokens += tokenUsage.daily || 0;
                            }
                        }
                        
                        // 如果是今天，直接使用daily数据
                        if (dateStr === today.toISOString().split('T')[0]) {
                            dailyTokens += tokenUsage.daily || 0;
                        }
                    }
                });
                
                last7Days.push({
                    date: displayDate,
                    tokens: dailyTokens
                });
            }

            // 销毁现有图表
            if (this.charts.tokenTrend) {
                this.charts.tokenTrend.destroy();
            }

            this.charts.tokenTrend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last7Days.map(item => item.date),
                    datasets: [{
                        label: 'Token消耗量',
                        data: last7Days.map(item => item.tokens),
                        borderColor: this.colors.info,
                        backgroundColor: this.colors.info + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.colors.info,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            callbacks: {
                                label: function(context) {
                                    return `Token消耗: ${context.parsed.y.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                },
                                font: {
                                    size: 11
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('创建Token消耗趋势图表失败:', error);
            this.showChartError(ctx, '图表加载失败');
        }
    }

    // 显示所有图表错误
    showAllChartsError(message) {
        const chartIds = ['userLevelChart', 'registrationChart', 'usageChart', 'activityChart', 'tokenDistributionChart', 'tokenTrendChart'];
        chartIds.forEach(id => {
            const ctx = document.getElementById(id);
            if (ctx) {
                this.showChartError(ctx, message);
            }
        });
    }

    // 刷新所有图表
    async refreshCharts() {
        // 清除API缓存以获取最新数据
        window.adminAPI.clearAllCache();
        
        // 重新初始化图表
        await this.initCharts();
    }

    // 销毁所有图表
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // 获取图表实例
    getChart(name) {
        return this.charts[name];
    }

    // 更新图表数据
    updateChart(name, newData) {
        const chart = this.charts[name];
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }
}

// 创建全局图表管理器实例
window.chartManager = new ChartManager();

// 导出图表管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
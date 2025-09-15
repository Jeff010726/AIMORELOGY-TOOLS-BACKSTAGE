// 用户管理类
class UserManager {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        this.currentUser = null;
        
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('user-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterUsers(e.target.value, document.getElementById('level-filter').value);
            });
        }

        // 等级筛选
        const levelFilter = document.getElementById('level-filter');
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.filterUsers(document.getElementById('user-search').value, e.target.value);
            });
        }

        // 分页按钮
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    // 加载用户数据
    async loadUsers() {
        try {
            this.showLoading(true);
            
            // 使用原来的API接口
            const response = await window.adminAPI.getAllUsers();
            
            if (response.success) {
                this.users = response.users;
                this.filteredUsers = [...this.users];
                this.updatePagination();
                this.renderUsers();
            } else {
                this.showError('加载用户数据失败: ' + (response.error || '未知错误'));
            }
        } catch (error) {
            console.error('加载用户失败:', error);
            this.showError('加载用户数据失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 筛选用户
    filterUsers(searchTerm = '', levelFilter = '') {
        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm || 
                user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.openid?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesLevel = !levelFilter || user.level === levelFilter;
            
            return matchesSearch && matchesLevel;
        });
        
        this.currentPage = 1;
        this.updatePagination();
        this.renderUsers();
    }

    // 更新分页信息
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
        
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (pageInfo) {
            pageInfo.textContent = `第 ${this.currentPage} 页，共 ${this.totalPages} 页`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }
    }

    // 上一页
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
            this.renderUsers();
        }
    }

    // 下一页
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
            this.renderUsers();
        }
    }

    // 渲染用户列表
    renderUsers() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageUsers = this.filteredUsers.slice(startIndex, endIndex);

        if (pageUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        暂无用户数据
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageUsers.map(user => this.renderUserRow(user)).join('');
    }

    // 渲染单个用户行
    renderUserRow(user) {
        const avatar = user.avatar || this.generateAvatar(user.nickname || user.openid);
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-';
        const lastLoginAt = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('zh-CN') : '-';
        const totalUsage = user.usage?.total || 0;
        
        return `
            <tr>
                <td>
                    <div class="user-avatar">${avatar}</div>
                </td>
                <td>
                    <strong>${this.escapeHtml(user.nickname || '未设置')}</strong>
                </td>
                <td>
                    <code style="font-size: 12px; background: #f5f7fa; padding: 2px 6px; border-radius: 4px;">
                        ${this.truncateOpenId(user.openid)}
                    </code>
                </td>
                <td>
                    <span class="user-level level-${user.level || 'normal'}">
                        ${this.getLevelText(user.level)}
                    </span>
                </td>
                <td>${createdAt}</td>
                <td>${lastLoginAt}</td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <div>
                            <span style="font-weight: 600; color: #43e97b;">${user.articleUsage?.daily || 0}</span>
                            <small style="color: #666;">/${user.limits?.daily || 10}</small>
                            <small style="color: #888; font-size: 10px;">文章</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">文章:</span>
                            <span style="font-weight: 600; color: #43e97b;">
                                暂无数据
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #666;">总计:</span>
                            <span style="font-weight: 600; color: #2c3e50;">
                                暂无数据
                            </span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 2px; font-size: 11px;">
                        <div style="color: #666;">
                            Token功能开发中...
                        </div>
                    </div>
                </td>
                <td>
                    <button class="action-btn btn-view" onclick="userManager.viewUser('${user.openid}')">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="action-btn btn-edit" onclick="userManager.editUser('${user.openid}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn btn-delete" onclick="userManager.deleteUser('${user.openid}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </td>
            </tr>
        `;
    }

    // 生成头像
    generateAvatar(name) {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    }

    // 截断OpenID显示
    truncateOpenId(openid) {
        if (!openid) return '';
        return openid.length > 20 ? openid.substring(0, 20) + '...' : openid;
    }

    // 获取等级文本
    getLevelText(level) {
        const levelMap = {
            'normal': '普通用户',
            'vip': 'VIP',
            'svip': 'SVIP',
            'admin': '管理员'
        };
        return levelMap[level] || '普通用户';
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 查看用户详情
    async viewUser(openid) {
        const user = this.users.find(u => u.openid === openid);
        if (!user) return;

        this.currentUser = user;
        this.showUserModal(user, 'view');
    }

    // 编辑用户
    async editUser(openid) {
        const user = this.users.find(u => u.openid === openid);
        if (!user) return;

        this.currentUser = user;
        this.showUserModal(user, 'edit');
    }

    // 删除用户
    async deleteUser(openid) {
        const user = this.users.find(u => u.openid === openid);
        if (!user) return;

        const confirmed = confirm(`确定要删除用户 "${user.nickname || user.openid}" 吗？此操作不可恢复。`);
        if (!confirmed) return;

        try {
            this.showLoading(true);
            
            const response = await window.adminAPI.deleteUser(openid);
            
            if (response.success) {
                alert('用户删除成功');
                await this.loadUsers(); // 重新加载用户列表
            } else {
                alert('删除失败: ' + (response.error || '未知错误'));
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            alert('删除失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // 显示用户模态框
    showUserModal(user, mode = 'view') {
        const modal = document.getElementById('user-modal');
        const modalBody = document.getElementById('user-modal-body');
        
        if (!modal || !modalBody) return;

        const isEditable = mode === 'edit';
        
        modalBody.innerHTML = `
            <div class="user-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="user-info-section">
                    <h4 style="margin-bottom: 15px; color: #2c3e50;">基本信息</h4>
                    
                    <div class="detail-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">昵称:</label>
                        ${isEditable ? 
                            `<input type="text" id="edit-nickname" value="${this.escapeHtml(user.nickname || '')}" style="width: 100%; padding: 8px 12px; border: 2px solid #e1e8ed; border-radius: 6px;">` :
                            `<span>${this.escapeHtml(user.nickname || '未设置')}</span>`
                        }
                    </div>
                    
                    <div class="detail-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">OpenID:</label>
                        <code style="font-size: 12px; background: #f5f7fa; padding: 8px 12px; border-radius: 6px; display: block; word-break: break-all;">
                            ${user.openid}
                        </code>
                    </div>
                    
                    <div class="detail-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">用户等级:</label>
                        ${isEditable ? 
                            `<select id="edit-level" style="width: 100%; padding: 8px 12px; border: 2px solid #e1e8ed; border-radius: 6px;">
                                <option value="normal" ${user.level === 'normal' ? 'selected' : ''}>普通用户</option>
                                <option value="vip" ${user.level === 'vip' ? 'selected' : ''}>VIP</option>
                                <option value="svip" ${user.level === 'svip' ? 'selected' : ''}>SVIP</option>
                                <option value="admin" ${user.level === 'admin' ? 'selected' : ''}>管理员</option>
                            </select>` :
                            `<span class="user-level level-${user.level || 'normal'}">${this.getLevelText(user.level)}</span>`
                        }
                    </div>
                </div>
                
                <div class="usage-info-section">
                    <h4 style="margin-bottom: 15px; color: #2c3e50;">使用统计</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #43e97b;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">文章生成使用</div>
                            <div style="font-size: 1.4rem; font-weight: 600; color: #43e97b;">
                                ${user.articleUsage?.daily || 0}
                                <small style="font-size: 0.8rem; color: #666;"> / ${user.limits?.daily || 10}</small>
                            </div>
                            <div style="font-size: 11px; color: #888;">总计: ${user.articleUsage?.total || 0} 次</div>
                        </div>
                    </div>
                    
                    <div class="detail-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">注册时间:</label>
                        <span>${user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '未知'}</span>
                    </div>
                    
                    <div class="detail-item" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #555;">最后登录:</label>
                        <span>${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <h4 style="margin-bottom: 15px; color: #2c3e50;">Token消耗统计</h4>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; color: #666;">
                    <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #17a2b8;"></i>
                    <div style="font-size: 14px;">Token消耗统计功能开发中...</div>
                    <div style="font-size: 12px; margin-top: 5px; color: #888;">
                        后端数据结构需要更新以支持token统计
                    </div>
                </div>
            </div>
            
            ${user.limits?.features ? `
                <div style="margin-top: 20px;">
                    <h4 style="margin-bottom: 15px; color: #2c3e50;">可用功能</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${user.limits.features.map(feature => 
                            `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${feature}</span>`
                        ).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // 显示/隐藏保存按钮
        const saveBtn = modal.querySelector('.btn-primary');
        if (saveBtn) {
            saveBtn.style.display = isEditable ? 'inline-block' : 'none';
        }

        modal.style.display = 'block';
    }

    // 保存用户更改
    async saveUserChanges() {
        if (!this.currentUser) return;

        const nicknameInput = document.getElementById('edit-nickname');
        const levelSelect = document.getElementById('edit-level');

        if (!nicknameInput || !levelSelect) return;

        const newLevel = levelSelect.value;
        const oldLevel = this.currentUser.level;

        // 如果等级发生变化，使用等级更新API
        if (newLevel !== oldLevel) {
            try {
                this.showLoading(true);
                
                const response = await fetch('https://wechat-login-worker.internal-articleno.workers.dev/admin/update_user_level', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        openid: this.currentUser.openid,
                        newLevel: newLevel,
                        adminToken: 'admin_secret_token'
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    alert(`用户等级更新成功！
等级变更: ${oldLevel} → ${newLevel}
新的使用限制已自动调整`);
                    this.closeUserModal();
                    await this.loadUsers(); // 重新加载用户列表
                } else {
                    alert('等级更新失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('更新用户等级失败:', error);
                alert('更新失败: ' + error.message);
            } finally {
                this.showLoading(false);
            }
        } else {
            // 如果只是昵称变化，可以添加其他更新逻辑
            alert('暂时只支持等级更新功能');
        }
    }

    // 关闭用户模态框
    closeUserModal() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentUser = null;
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
        const tbody = document.getElementById('users-table-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #f5576c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        ${message}
                    </td>
                </tr>
            `;
        }
    }

    // 刷新用户数据
    async refreshUsers() {
        // 清除API缓存
        window.adminAPI.clearUserCaches();
        
        // 重新加载用户
        await this.loadUsers();
    }

    // 导出用户数据
    exportUsers() {
        if (this.users.length === 0) {
            alert('没有用户数据可导出');
            return;
        }

        const csvContent = this.convertToCSV(this.users);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 转换为CSV格式
    convertToCSV(users) {
        const headers = ['昵称', 'OpenID', '等级', '注册时间', '最后登录', '总使用次数', '今日使用', '每日限额'];
        const rows = users.map(user => [
            user.nickname || '',
            user.openid || '',
            this.getLevelText(user.level),
            user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '',
            user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '',
            user.usage?.total || 0,
            user.usage?.daily || 0,
            user.limits?.daily || 10
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }
}

// 创建全局用户管理器实例
window.userManager = new UserManager();

// 全局函数供HTML调用
window.closeUserModal = () => window.userManager.closeUserModal();
window.saveUserChanges = () => window.userManager.saveUserChanges();

// 导出用户管理器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
}
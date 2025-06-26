class RecordsPage {
    constructor() {
        this.storage = new Storage();
        this.currentFilter = 'all';
        this.currentMonthFilter = 'all';
        this.initializeEventListeners();
        this.initializeMonthFilter();
        this.render();
    }

    initializeEventListeners() {
        // フィルターボタン
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.handleFilterChange(filter);
            });
        });

        // 月別フィルター
        document.getElementById('monthFilter').addEventListener('change', (e) => {
            this.currentMonthFilter = e.target.value;
            this.renderLogs();
        });

        // ホームに戻るボタン
        document.getElementById('goToHome').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    initializeMonthFilter() {
        const logs = this.storage.getLogs();
        const months = new Set();
        
        logs.forEach(log => {
            const date = new Date(log.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = `${date.getFullYear()}年${date.getMonth() + 1}月`;
            months.add(JSON.stringify({ key: monthKey, label: monthLabel }));
        });

        const monthSelect = document.getElementById('monthFilter');
        const monthArray = Array.from(months)
            .map(item => JSON.parse(item))
            .sort((a, b) => b.key.localeCompare(a.key)); // 新しい月順

        monthArray.forEach(month => {
            const option = document.createElement('option');
            option.value = month.key;
            option.textContent = month.label;
            monthSelect.appendChild(option);
        });
    }

    handleFilterChange(filter) {
        // 現在のフィルターを更新
        this.currentFilter = filter;
        
        // フィルターボタンのアクティブ状態を更新
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // ログ一覧を更新
        this.renderLogs();
    }

    handleEdit(logId) {
        // 編集機能はホームページで行うため、ホームページに遷移
        window.location.href = `index.html?edit=${logId}`;
    }

    handleDelete(logId) {
        if (confirm('このログを削除してもよろしいですか？')) {
            this.storage.deleteLog(logId);
            this.initializeMonthFilter(); // 月別フィルターを再初期化
            this.render();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatAmount(amount) {
        return Number(amount).toLocaleString('ja-JP') + '円';
    }

    renderLogs() {
        const logList = document.getElementById('logList');
        let logs = this.storage.getLogs()
            .filter(log => this.currentFilter === 'all' || log.type === this.currentFilter);

        // 月別フィルターを適用
        if (this.currentMonthFilter !== 'all') {
            logs = logs.filter(log => {
                const date = new Date(log.date);
                const logMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return logMonthKey === this.currentMonthFilter;
            });
        }

        // 日付順でソート（新しい順）
        logs.sort((a, b) => new Date(b.date) - new Date(a));

        // 月別グループ化
        const groupedLogs = this.groupLogsByMonth(logs);

        logList.innerHTML = Object.entries(groupedLogs).map(([monthKey, monthLogs]) => {
            const monthLabel = this.getMonthLabel(monthKey);
            const monthStats = this.calculateMonthStats(monthLogs);
            
            return `
                <div class="month-group">
                    <div class="month-header">
                        <h3>${monthLabel}</h3>
                        <div class="month-stats">
                            <span class="month-saving">節約: ${this.formatAmount(monthStats.saving)}</span>
                            <span class="month-waste">浪費: ${this.formatAmount(monthStats.waste)}</span>
                            <span class="month-difference">差額: ${this.formatAmount(monthStats.difference)}</span>
                        </div>
                    </div>
                    <div class="month-logs">
                        ${monthLogs.map(log => `
                            <div class="log-item ${log.type}">
                                <div class="log-content">
                                    <div class="log-header">
                                        <span class="log-date">${this.formatDate(log.date)}</span>
                                        <span class="log-amount">金額: ${this.formatAmount(log.amount)}</span>
                                    </div>
                                    <div class="log-meta">
                                        <span class="log-type">${log.type === 'saving' ? '節約' : '浪費'}</span>
                                        <span class="log-emotions">
                                            <span>選択前: ${this.getEmotionEmoji(log.beforeEmotion, 'before')}</span>
                                            <span>→ 選択後: ${this.getEmotionEmoji(log.afterEmotion, 'after')}</span>
                                        </span>
                                    </div>
                                    ${log.situations && log.situations.length > 0 ? `
                                        <div class="log-situations">
                                            シチュエーション: ${log.situations.map(situation => `
                                                <span class="situation-badge">${this.getSituationLabel(situation)}</span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                    <div class="log-note">メモ: ${log.note}</div>
                                    ${log.message ? `<div class="log-future-message">未来の自分へのメッセージ: ${log.message}</div>` : ''}
                                    ${(log.reflection || log.suggestion || log.encouragement) ? `
                                        <div class="log-ai-analysis">
                                            ${log.reflection ? `<div class="ai-reflection">振り返り: ${log.reflection}</div>` : ''}
                                            ${log.suggestion ? `<div class="ai-suggestion">改善提案: ${log.suggestion}</div>` : ''}
                                            ${log.encouragement ? `<div class="ai-encouragement">励まし: ${log.encouragement}</div>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="log-actions">
                                    <button class="edit-btn" onclick="recordsPage.handleEdit('${log.id}')">編集</button>
                                    <button class="delete-btn" onclick="recordsPage.handleDelete('${log.id}')">削除</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    groupLogsByMonth(logs) {
        const grouped = {};
        logs.forEach(log => {
            const date = new Date(log.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(log);
        });
        return grouped;
    }

    getMonthLabel(monthKey) {
        const [year, month] = monthKey.split('-');
        return `${year}年${parseInt(month)}月`;
    }

    calculateMonthStats(logs) {
        const stats = {
            saving: 0,
            waste: 0,
            difference: 0
        };

        logs.forEach(log => {
            if (log.type === 'saving') {
                stats.saving += log.amount;
            } else {
                stats.waste += log.amount;
            }
        });

        stats.difference = stats.saving - stats.waste;
        return stats;
    }

    getEmotionEmoji(emotion, type = 'before') {
        // type: 'before' or 'after'
        if (type === 'before') {
            const emojis = {
                happy: { emoji: '😊', text: '確信' },
                stressed: { emoji: '😤', text: 'ストレス' },
                tired: { emoji: '😫', text: '疲労' },
                excited: { emoji: '🤩', text: '興奮' },
                normal: { emoji: '😐', text: '何となく' }
            };
            const emotionData = emojis[emotion] || { emoji: '😐', text: '何となく' };
            return `${emotionData.text}${emotionData.emoji}`;
        } else {
            const emojis = {
                happy: { emoji: '😊', text: '満足' },
                regret: { emoji: '😔', text: '後悔' },
                relief: { emoji: '😌', text: '安心' },
                guilty: { emoji: '😣', text: '罪悪感' },
                normal: { emoji: '😐', text: '普通' }
            };
            const emotionData = emojis[emotion] || { emoji: '😐', text: '普通' };
            return `${emotionData.text}${emotionData.emoji}`;
        }
    }

    getSituationLabel(situation) {
        const labels = {
            commute: '通勤中',
            night: '深夜',
            tired: '疲労時',
            ad: '広告を見た',
            schedule: '予定がズレた',
            hungry: '空腹時',
            study: '学習時',
            other: 'その他'
        };
        return labels[situation] || situation;
    }

    render() {
        this.renderLogs();
    }
}

// 記録一覧ページの初期化
const recordsPage = new RecordsPage(); 
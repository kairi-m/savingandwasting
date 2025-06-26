class App {
    constructor() {
        this.storage = new Storage();
        this.chartManager = new ChartManager(this.storage);
        this.aiService = new AIService();
        this.currentFilter = 'all';
        this.editingLogId = null;
        this.selectedBeforeEmotion = null;
        this.selectedAfterEmotion = null;

        this.initializeEventListeners();
        this.initializeAI();
        this.render();
    }

    initializeEventListeners() {
        // フォーム送信
        document.getElementById('logForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // フィルターボタン
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.handleFilterChange(filter);
            });
        });

        // 感情ボタン
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emotion = e.target.dataset.emotion;
                const isBefore = e.target.closest('.emotion-group').querySelector('label').textContent === '選択前';
                
                if (isBefore) {
                    this.handleEmotionSelect('before', emotion, e.target);
                } else {
                    this.handleEmotionSelect('after', emotion, e.target);
                }
            });
        });

        // 閉じるボタンのイベントリスナー
        document.getElementById('closeLogSection').addEventListener('click', () => {
            const logList = document.getElementById('logList');
            logList.style.display = 'none';
        });
    }

    handleEmotionSelect(type, emotion, button) {
        const container = button.closest('.emotion-buttons');
        container.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');

        if (type === 'before') {
            this.selectedBeforeEmotion = emotion;
            document.getElementById('beforeEmotion').value = emotion;
        } else {
            this.selectedAfterEmotion = emotion;
            document.getElementById('afterEmotion').value = emotion;
        }
    }

    async handleFormSubmit() {
        const form = document.getElementById('logForm');
        const formData = new FormData(form);
        
        const amount = Number(formData.get('amount'));
        if (amount <= 0) {
            alert('金額は0より大きい値を入力してください。');
            return;
        }

        if (!this.selectedBeforeEmotion || !this.selectedAfterEmotion) {
            alert('選択前と選択後の感情を選択してください。');
            return;
        }

        const situations = Array.from(formData.getAll('situations'));

        const logData = {
            type: formData.get('type'),
            amount: amount,
            note: formData.get('note'),
            message: formData.get('message'),
            beforeEmotion: this.selectedBeforeEmotion,
            afterEmotion: this.selectedAfterEmotion,
            situations: situations
        };

        // AI分析の実行
        try {
            const analysis = await this.aiService.analyzeLog(logData);
            logData.reflection = analysis.reflection;
            logData.suggestion = analysis.suggestion;
            logData.encouragement = analysis.encouragement;
        } catch (error) {
            console.error('AI分析エラー:', error);
        }

        if (this.editingLogId) {
            this.storage.updateLog(this.editingLogId, logData);
            this.editingLogId = null;
        } else {
            this.storage.addLog(logData);
        }

        form.reset();
        this.selectedBeforeEmotion = null;
        this.selectedAfterEmotion = null;
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.render();
    }

    handleFilterChange(filter) {
        // 現在のフィルターを更新
        this.currentFilter = filter;
        
        // フィルターボタンのアクティブ状態を更新
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // 記録一覧を表示
        const logList = document.getElementById('logList');
        logList.style.display = 'flex';

        // ログ一覧を更新
        this.renderLogs();
    }

    handleEdit(logId) {
        const logs = this.storage.getLogs();
        const log = logs.find(l => l.id === logId);
        if (log) {
            const form = document.getElementById('logForm');
            form.type.value = log.type;
            form.amount.value = log.amount;
            form.note.value = log.note;
            form.message.value = log.message || '';

            // 感情の選択をリセット
            document.querySelectorAll('.emotion-btn').forEach(btn => {
                btn.classList.remove('selected');
            });

            // 感情の選択を復元
            if (log.beforeEmotion) {
                const beforeBtn = document.querySelector(`.emotion-btn[data-emotion="${log.beforeEmotion}"]`);
                if (beforeBtn) {
                    beforeBtn.classList.add('selected');
                    this.selectedBeforeEmotion = log.beforeEmotion;
                    document.getElementById('beforeEmotion').value = log.beforeEmotion;
                }
            }

            if (log.afterEmotion) {
                const afterBtn = document.querySelector(`.emotion-btn[data-emotion="${log.afterEmotion}"]`);
                if (afterBtn) {
                    afterBtn.classList.add('selected');
                    this.selectedAfterEmotion = log.afterEmotion;
                    document.getElementById('afterEmotion').value = log.afterEmotion;
                }
            }

            // シチュエーションの選択をリセット
            document.querySelectorAll('input[name="situations"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            // シチュエーションの選択を復元
            if (log.situations) {
                log.situations.forEach(situation => {
                    const checkbox = document.querySelector(`input[name="situations"][value="${situation}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }

            this.editingLogId = logId;
        }
    }

    handleDelete(logId) {
        if (confirm('このログを削除してもよろしいですか？')) {
            this.storage.deleteLog(logId);
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

    updateStats() {
        const stats = this.storage.getStats();
        document.getElementById('totalSaving').textContent = this.formatAmount(stats.totalSaving);
        document.getElementById('totalWaste').textContent = this.formatAmount(stats.totalWaste);
        document.getElementById('difference').textContent = this.formatAmount(stats.difference);
    }

    renderLogs() {
        const logList = document.getElementById('logList');
        const logs = this.storage.getLogs()
            .filter(log => this.currentFilter === 'all' || log.type === this.currentFilter)
            .sort((a, b) => new Date(b.date) - new Date(a));

        logList.innerHTML = logs.map(log => `
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
                    <button class="edit-btn" onclick="app.handleEdit('${log.id}')">編集</button>
                    <button class="delete-btn" onclick="app.handleDelete('${log.id}')">削除</button>
                </div>
            </div>
        `).join('');
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

    initializeAI() {
        const aiSection = document.createElement('div');
        aiSection.id = 'aiAnalysis';
        aiSection.className = 'ai-analysis-section';
        document.querySelector('.container').appendChild(aiSection);
    }

    async updateAIAnalysis() {
        const logs = this.storage.getLogs();
        const aiSection = document.getElementById('aiAnalysis');
        
        try {
            const analysis = await this.aiService.analyzeTrends(logs);
            
            aiSection.innerHTML = `
                <h2>AI分析</h2>
                <div class="ai-analysis-content">
                    <div class="analysis-section">
                        <h3>金銭感覚</h3>
                        <p>${analysis.trendAnalysis}</p>
                    </div>
                    <div class="analysis-section">
                        <h3>感情パターン</h3>
                        <p>${analysis.emotionPatterns}</p>
                    </div>
                    <div class="analysis-section">
                        <h3>シチュエーション分析</h3>
                        <p>${analysis.situationAnalysis}</p>
                    </div>
                    <div class="analysis-section">
                        <h3>改善提案</h3>
                        <p>${analysis.recommendations}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('AI分析更新エラー:', error);
            aiSection.innerHTML = '<p class="error">AI分析の更新に失敗しました</p>';
        }
    }

    render() {
        this.updateStats();
        this.renderLogs();
        this.chartManager.updateCharts();
        this.updateAIAnalysis();
    }
}

// アプリケーションの初期化
const app = new App(); 
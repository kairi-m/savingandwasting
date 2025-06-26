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

        // 記録一覧へボタン
        document.getElementById('goToRecords').addEventListener('click', () => {
            window.location.href = 'records.html';
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

        // URLパラメータから編集モードをチェック
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            this.handleEdit(editId);
        }
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
        this.chartManager.updateCharts();
        this.updateAIAnalysis();
    }
}

// アプリケーションの初期化
const app = new App(); 
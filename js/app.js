class App {
    constructor() {
        this.storage = new Storage();
        this.chartManager = new ChartManager(this.storage);
        this.currentFilter = 'all';
        this.editingLogId = null;

        this.initializeEventListeners();
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
                this.handleFilterChange(e.target.dataset.filter);
            });
        });
    }

    handleFormSubmit() {
        const form = document.getElementById('logForm');
        const formData = new FormData(form);
        
        const amount = Number(formData.get('amount'));
        if (amount <= 0) {
            alert('金額は0より大きい値を入力してください。');
            return;
        }

        const logData = {
            type: formData.get('type'),
            amount: amount,
            note: formData.get('note')
        };

        if (this.editingLogId) {
            this.storage.updateLog(this.editingLogId, logData);
            this.editingLogId = null;
        } else {
            this.storage.addLog(logData);
        }

        form.reset();
        this.render();
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
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
                    <div class="log-date">${this.formatDate(log.date)}</div>
                    <div class="log-amount">${this.formatAmount(log.amount)}</div>
                    <div class="log-note">${log.note}</div>
                </div>
                <div class="log-actions">
                    <button class="edit-btn" onclick="app.handleEdit('${log.id}')">編集</button>
                    <button class="delete-btn" onclick="app.handleDelete('${log.id}')">削除</button>
                </div>
            </div>
        `).join('');
    }

    render() {
        this.updateStats();
        this.renderLogs();
        this.chartManager.updateCharts();
    }
}

// アプリケーションの初期化
const app = new App(); 
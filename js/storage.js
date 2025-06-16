class Storage {
    constructor() {
        this.STORAGE_KEY = 'money_logs';
    }

    // ログの取得
    getLogs() {
        const logs = localStorage.getItem(this.STORAGE_KEY);
        return logs ? JSON.parse(logs) : [];
    }

    // ログの保存
    saveLogs(logs) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    }

    // 新規ログの追加
    addLog(log) {
        const logs = this.getLogs();
        logs.push({
            ...log,
            id: crypto.randomUUID(),
            date: new Date().toISOString()
        });
        this.saveLogs(logs);
    }

    // ログの更新
    updateLog(id, updatedLog) {
        const logs = this.getLogs();
        const index = logs.findIndex(log => log.id === id);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updatedLog };
            this.saveLogs(logs);
        }
    }

    // ログの削除
    deleteLog(id) {
        const logs = this.getLogs();
        const filteredLogs = logs.filter(log => log.id !== id);
        this.saveLogs(filteredLogs);
    }

    // 統計情報の取得
    getStats() {
        const logs = this.getLogs();
        const stats = {
            totalSaving: 0,
            totalWaste: 0,
            difference: 0
        };

        logs.forEach(log => {
            if (log.type === 'saving') {
                stats.totalSaving += Number(log.amount) || 0;
            } else {
                stats.totalWaste += Number(log.amount) || 0;
            }
        });

        stats.difference = stats.totalSaving - stats.totalWaste;
        return stats;
    }

    // 週ごとの集計データ取得
    getWeeklyStats() {
        const logs = this.getLogs();
        const weeklyData = {
            saving: {},
            waste: {}
        };

        logs.forEach(log => {
            const date = new Date(log.date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (log.type === 'saving') {
                weeklyData.saving[weekKey] = (weeklyData.saving[weekKey] || 0) + (Number(log.amount) || 0);
            } else {
                weeklyData.waste[weekKey] = (weeklyData.waste[weekKey] || 0) + (Number(log.amount) || 0);
            }
        });

        return weeklyData;
    }

    // 月ごとの集計データ取得
    getMonthlyStats() {
        const logs = this.getLogs();
        const monthlyData = {
            saving: {},
            waste: {}
        };

        logs.forEach(log => {
            const date = new Date(log.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            if (log.type === 'saving') {
                monthlyData.saving[monthKey] = (monthlyData.saving[monthKey] || 0) + (Number(log.amount) || 0);
            } else {
                monthlyData.waste[monthKey] = (monthlyData.waste[monthKey] || 0) + (Number(log.amount) || 0);
            }
        });

        return monthlyData;
    }
} 
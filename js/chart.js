class ChartManager {
    constructor(storage) {
        this.storage = storage;
        this.barChart = null;
        this.pieChart = null;
        this.initCharts();
    }

    initCharts() {
        // 棒グラフの初期化
        const barCtx = document.getElementById('moneyChart').getContext('2d');
        this.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '節約',
                        backgroundColor: '#2ecc71',
                        data: []
                    },
                    {
                        label: '浪費',
                        backgroundColor: '#e74c3c',
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '金額（円）'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '週間の節約・浪費推移'
                    }
                }
            }
        });

        // 円グラフの初期化
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        this.pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['節約', '浪費'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#2ecc71', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '節約と浪費の割合'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateCharts() {
        // 週間データの更新
        const weeklyData = this.storage.getWeeklyStats();
        const weeks = [...new Set([
            ...Object.keys(weeklyData.saving),
            ...Object.keys(weeklyData.waste)
        ])].sort();

        const savingData = weeks.map(week => weeklyData.saving[week] || 0);
        const wasteData = weeks.map(week => weeklyData.waste[week] || 0);

        // 日付のフォーマット
        const formattedWeeks = weeks.map(week => {
            const date = new Date(week);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        // 棒グラフの更新
        this.barChart.data.labels = formattedWeeks;
        this.barChart.data.datasets[0].data = savingData;
        this.barChart.data.datasets[1].data = wasteData;
        this.barChart.update();

        // 円グラフの更新
        const stats = this.storage.getStats();
        this.pieChart.data.datasets[0].data = [
            stats.totalSaving,
            stats.totalWaste
        ];
        this.pieChart.update();
    }
} 
class ChartManager {
    constructor(storage) {
        this.storage = storage;
        this.barChart = null;
        this.pieChart = null;
        this.initCharts();
    }

    initCharts() {
        // 折れ線グラフの初期化
        const barCtx = document.getElementById('moneyChart').getContext('2d');
        this.barChart = new Chart(barCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '節約',
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: '#2ecc71',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        data: []
                    },
                    {
                        label: '浪費',
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        borderColor: '#e74c3c',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
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
                        text: '直近5か月の節約・浪費推移'
                    },
                    legend: {
                        position: 'top'
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${percentage}% (${value.toLocaleString()}円)`;
                            }
                        }
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold',
                            size: 14
                        },
                        formatter: function(value, context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${percentage}%`;
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    updateCharts() {
        // 月間データの更新
        const monthlyData = this.storage.getMonthlyStats();
        const months = [...new Set([
            ...Object.keys(monthlyData.saving),
            ...Object.keys(monthlyData.waste)
        ])].sort();

        // 直近5か月分のみを取得
        const recentMonths = months.slice(-5);

        const savingData = recentMonths.map(month => monthlyData.saving[month] || 0);
        const wasteData = recentMonths.map(month => monthlyData.waste[month] || 0);

        // 月のフォーマット（YYYY年MM月）
        const formattedMonths = recentMonths.map(month => {
            const [year, m] = month.split('-');
            return `${year}年${m}月`;
        });

        // 折れ線グラフの更新
        this.barChart.data.labels = formattedMonths;
        this.barChart.data.datasets[0].data = savingData;
        this.barChart.data.datasets[1].data = wasteData;
        this.barChart.options.plugins.title.text = '直近5か月の節約・浪費推移';
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
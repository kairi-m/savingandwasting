class AIService {
  constructor() {
    this.API_BASE_URL = 'https://openai-proxy-server-w980.onrender.com';
  }

  async analyzeLog(log) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/analyze-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ log }),
      });
      
      if (!response.ok) {
        throw new Error('ログの分析に失敗しました');
      }
      
      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('AI分析エラー:', error);
      throw error;
    }
  }

  async analyzeTrends(logs) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/analyze-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs }),
      });
      
      if (!response.ok) {
        throw new Error('傾向分析に失敗しました');
      }
      
      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('AI分析エラー:', error);
      throw error;
    }
  }
} 
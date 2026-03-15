const API = {
    BASE_URL: 'https://auto-video-bot-9oti.onrender.com',

    async request(endpoint, method, data) {
        const url = this.BASE_URL + '/api' + endpoint;

        const options = {
            method: method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors'
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('API Error:', endpoint, error);
            throw error;
        }
    },

    async ping() { return this.request('/ping'); },
    async saveSettings(s) { return this.request('/settings', 'POST', s); },
    async getSettings() { return this.request('/settings'); },
    async generateVideo(o) { return this.request('/generate', 'POST', o); },
    async getGenerationStatus(id) { return this.request('/generate/status/' + id); },
    async getVideos() { return this.request('/videos'); },
    async deleteVideo(id) { return this.request('/videos/' + id, 'DELETE'); },
    async getSchedule() { return this.request('/schedule'); },
    async startBot(c) { return this.request('/bot/start', 'POST', c); },
    async stopBot() { return this.request('/bot/stop', 'POST'); },
    async getBotStatus() { return this.request('/bot/status'); },
    async startAutoMode(c) { return this.request('/auto/start', 'POST', c); },
    async stopAutoMode() { return this.request('/auto/stop', 'POST'); },
    async getAnalytics() { return this.request('/analytics'); },
    async getYouTubeAuthUrl() { return this.request('/auth/youtube/url'); },
    async analyzeChannel(n) { return this.request('/analyze/channel', 'POST', {channel_name: n}); },
    async testConnections() { return this.request('/test/connections'); }
};

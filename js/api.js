const API = {
    BASE_URL: 'https://auto-video-bot-9oti.onrender.com',

    async request(endpoint, method, data) {
        var url = this.BASE_URL + '/api' + endpoint;
        var options = {
            method: method || 'GET',
            headers: {'Content-Type': 'application/json'},
            mode: 'cors'
        };
        if (data) options.body = JSON.stringify(data);

        var response = await fetch(url, options);
        return await response.json();
    },

    ping() { return this.request('/ping'); },
    saveSettings(s) { return this.request('/settings', 'POST', s); },
    getSettings() { return this.request('/settings'); },
    generateVideo(o) { return this.request('/generate', 'POST', o); },
    getGenerationStatus(id) { return this.request('/generate/status/' + id); },
    getVideos() { return this.request('/videos'); },
    startBot(c) { return this.request('/bot/start', 'POST', c); },
    stopBot() { return this.request('/bot/stop', 'POST'); },
    getBotStatus() { return this.request('/bot/status'); },
    startAutoMode(c) { return this.request('/auto/start', 'POST', c); },
    stopAutoMode() { return this.request('/auto/stop', 'POST'); },
    getAnalytics() { return this.request('/analytics'); },
    getYouTubeAuthUrl() { return this.request('/auth/youtube/url'); },
    testConnections() { return this.request('/test/connections'); },
    getSchedule() { return this.request('/schedule'); },
    analyzeChannel(n) { return this.request('/analyze/channel', 'POST', {channel_name:n}); }
};

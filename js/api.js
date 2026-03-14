/**
 * API Communication Layer
 * Handles all communication with the backend server
 */

const API = {
    // Change this to your Render.com URL after deployment
    BASE_URL: localStorage.getItem('backendUrl') || 'https://auto-video-bot-9oti.onrender.com',
    
    setBaseUrl(url) {
        this.BASE_URL = url.replace(/\/$/, '');
        localStorage.setItem('backendUrl', this.BASE_URL);
    },
    
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.BASE_URL}/api${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    },
    
    // Health check
    async ping() {
        return this.request('/ping');
    },
    
    // Settings
    async saveSettings(settings) {
        return this.request('/settings', 'POST', settings);
    },
    
    async getSettings() {
        return this.request('/settings');
    },
    
    // Video Generation
    async generateVideo(options) {
        return this.request('/generate', 'POST', options);
    },
    
    async getGenerationStatus(taskId) {
        return this.request(`/generate/status/${taskId}`);
    },
    
    // Videos
    async getVideos() {
        return this.request('/videos');
    },
    
    async deleteVideo(videoId) {
        return this.request(`/videos/${videoId}`, 'DELETE');
    },
    
    // Upload
    async uploadToYoutube(videoId) {
        return this.request(`/upload/youtube/${videoId}`, 'POST');
    },
    
    async uploadToFacebook(videoId) {
        return this.request(`/upload/facebook/${videoId}`, 'POST');
    },
    
    // Schedule
    async getSchedule() {
        return this.request('/schedule');
    },
    
    // Bot Control
    async startBot(config) {
        return this.request('/bot/start', 'POST', config);
    },
    
    async stopBot() {
        return this.request('/bot/stop', 'POST');
    },
    
    async getBotStatus() {
        return this.request('/bot/status');
    },
    
    // Auto Mode
    async startAutoMode(config) {
        return this.request('/auto/start', 'POST', config);
    },
    
    async stopAutoMode() {
        return this.request('/auto/stop', 'POST');
    },
    
    // Analytics
    async getAnalytics() {
        return this.request('/analytics');
    },
    
    // YouTube OAuth
    async getYouTubeAuthUrl() {
        return this.request('/auth/youtube/url');
    },
    
    // Channel Analysis
    async analyzeChannel(channelName) {
        return this.request('/analyze/channel', 'POST', { channel_name: channelName });
    },
    
    // Test connections
    async testConnections() {
        return this.request('/test/connections');
    }
};
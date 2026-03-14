/**
 * Main Application Logic
 * Auto Video Bot Dashboard
 */

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    checkBackendConnection();
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(checkBackendConnection, 30000);
});

function setupEventListeners() {
    // Niche change
    document.getElementById('channelNiche').addEventListener('change', function() {
        document.getElementById('customNicheGroup').style.display = 
            this.value === 'custom' ? 'block' : 'none';
    });
    
    // Video type checkboxes
    document.getElementById('videoShort').addEventListener('change', function() {
        document.getElementById('shortDurationGroup').style.display = 
            this.checked ? 'block' : 'none';
    });
    
    document.getElementById('videoLong').addEventListener('change', function() {
        document.getElementById('longDurationGroup').style.display = 
            this.checked ? 'block' : 'none';
    });
}

// ==================== NAVIGATION ====================
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    // Show selected section
    const section = document.getElementById(`section-${sectionName}`);
    if (section) section.classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    event.currentTarget?.classList.add('active');
    
    // Load section data
    switch(sectionName) {
        case 'dashboard': refreshDashboard(); break;
        case 'videos': loadVideos(); break;
        case 'schedule': loadSchedule(); break;
        case 'analytics': loadAnalytics(); break;
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ==================== BACKEND CONNECTION ====================
async function checkBackendConnection() {
    const badge = document.querySelector('#backendConnection .status-badge');
    
    try {
        const result = await API.ping();
        badge.textContent = 'Connected';
        badge.className = 'status-badge connected';
        updateBotStatus(true);
        return true;
    } catch (e) {
        badge.textContent = 'Not Connected';
        badge.className = 'status-badge disconnected';
        updateBotStatus(false);
        return false;
    }
}

function updateBotStatus(online) {
    const statusDot = document.querySelector('#botStatus .status-dot');
    const statusText = document.querySelector('#botStatus span');
    const largeDot = document.querySelector('#botStatusLarge .pulse-dot');
    const largeText = document.querySelector('#botStatusLarge span');
    
    if (online) {
        statusDot?.classList.replace('offline', 'online');
        if (statusText) statusText.textContent = 'Bot Online';
        largeDot?.classList.replace('offline', 'online');
        if (largeText) largeText.textContent = 'Bot is Online';
    } else {
        statusDot?.classList.replace('online', 'offline');
        if (statusText) statusText.textContent = 'Bot Offline';
        largeDot?.classList.replace('online', 'offline');
        if (largeText) largeText.textContent = 'Bot is Offline';
    }
}

// ==================== SETTINGS ====================
async function saveSettings(event) {
    event.preventDefault();
    
    const settings = {
        channel_name: document.getElementById('channelName').value,
        channel_niche: document.getElementById('channelNiche').value === 'custom' 
            ? document.getElementById('customNiche').value 
            : document.getElementById('channelNiche').value,
        youtube_channel_id: document.getElementById('youtubeChannelId').value,
        youtube_api_key: document.getElementById('youtubeApiKey').value,
        facebook_page_id: document.getElementById('facebookPageId').value,
        facebook_token: document.getElementById('facebookToken').value,
        video_short: document.getElementById('videoShort').checked,
        video_long: document.getElementById('videoLong').checked,
        short_duration: parseInt(document.getElementById('shortDuration').value),
        long_duration: parseInt(document.getElementById('longDuration').value),
        voice: document.getElementById('voiceSelect').value,
        voice_speed: document.getElementById('voiceSpeed').value + '%',
        videos_per_day: parseInt(document.getElementById('videosPerDay').value),
        upload_youtube: document.getElementById('uploadYoutube').checked,
        upload_facebook: document.getElementById('uploadFacebook').checked,
        post_strategy: document.getElementById('postStrategy').value,
    };
    
    // Save locally
    localStorage.setItem('videobot_settings', JSON.stringify(settings));
    
    // Save to backend
    try {
        await API.saveSettings(settings);
        showToast('Settings saved successfully!', 'success');
    } catch (e) {
        // Still saved locally
        showToast('Settings saved locally. Backend not connected.', 'info');
    }
}

function loadSavedSettings() {
    const saved = localStorage.getItem('videobot_settings');
    if (!saved) return;
    
    try {
        const settings = JSON.parse(saved);
        
        if (settings.channel_name) document.getElementById('channelName').value = settings.channel_name;
        if (settings.channel_niche) document.getElementById('channelNiche').value = settings.channel_niche;
        if (settings.youtube_channel_id) document.getElementById('youtubeChannelId').value = settings.youtube_channel_id;
        if (settings.youtube_api_key) document.getElementById('youtubeApiKey').value = settings.youtube_api_key;
        if (settings.facebook_page_id) document.getElementById('facebookPageId').value = settings.facebook_page_id;
        if (settings.facebook_token) document.getElementById('facebookToken').value = settings.facebook_token;
        if (settings.video_short !== undefined) document.getElementById('videoShort').checked = settings.video_short;
        if (settings.video_long !== undefined) document.getElementById('videoLong').checked = settings.video_long;
        if (settings.short_duration) document.getElementById('shortDuration').value = settings.short_duration;
        if (settings.long_duration) document.getElementById('longDuration').value = settings.long_duration;
        if (settings.voice) document.getElementById('voiceSelect').value = settings.voice;
        if (settings.videos_per_day) document.getElementById('videosPerDay').value = settings.videos_per_day;
        if (settings.upload_youtube !== undefined) document.getElementById('uploadYoutube').checked = settings.upload_youtube;
        if (settings.upload_facebook !== undefined) document.getElementById('uploadFacebook').checked = settings.upload_facebook;
        if (settings.post_strategy) document.getElementById('postStrategy').value = settings.post_strategy;
        
        // Update display values
        document.getElementById('shortDurVal').textContent = (settings.short_duration || 60) + 's';
        document.getElementById('longDurVal').textContent = (settings.long_duration || 5) + ' min';
        
    } catch (e) {
        console.error('Error loading settings:', e);
    }
}

async function testConnection() {
    showToast('Testing connections...', 'info');
    
    try {
        const result = await API.testConnections();
        
        // Update YouTube status
        const ytBadge = document.querySelector('#ytConnection .status-badge');
        if (result.youtube) {
            ytBadge.textContent = 'Connected';
            ytBadge.className = 'status-badge connected';
        }
        
        // Update Facebook status
        const fbBadge = document.querySelector('#fbConnection .status-badge');
        if (result.facebook) {
            fbBadge.textContent = 'Connected';
            fbBadge.className = 'status-badge connected';
        }
        
        showToast('Connection test complete!', 'success');
    } catch (e) {
        showToast('Backend not connected. Deploy backend first.', 'error');
    }
}

async function connectYouTube() {
    try {
        const result = await API.getYouTubeAuthUrl();
        if (result.auth_url) {
            window.open(result.auth_url, '_blank');
            showToast('Complete YouTube authorization in the new window', 'info');
        }
    } catch (e) {
        showToast('Backend not connected. Deploy backend first.', 'error');
    }
}

// ==================== VIDEO GENERATION ====================
let currentGenType = 'short';
let pollInterval = null;

function setGenType(type, btn) {
    currentGenType = type;
    document.querySelectorAll('.btn-group .btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function toggleTopicInput() {
    const mode = document.querySelector('input[name="topicMode"]:checked').value;
    document.getElementById('customTopicGroup').style.display = 
        mode === 'custom' ? 'block' : 'none';
}

async function generateVideo() {
    const generateBtn = document.getElementById('generateBtn');
    const progressContainer = document.getElementById('progressContainer');
    const resultContainer = document.getElementById('resultContainer');
    
    // Get settings
    const settings = JSON.parse(localStorage.getItem('videobot_settings') || '{}');
    
    // Get topic
    const topicMode = document.querySelector('input[name="topicMode"]:checked').value;
    const customTopic = document.getElementById('customTopic').value;
    
    const options = {
        topic: topicMode === 'custom' ? customTopic : null,
        video_type: currentGenType,
        auto_upload: document.getElementById('genAutoUpload').checked,
        add_subtitles: document.getElementById('genAddSubtitles').checked,
        ...settings
    };
    
    // Validate
    if (topicMode === 'custom' && !customTopic) {
        showToast('Please enter a topic!', 'error');
        return;
    }
    
    // Show progress
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    progressContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    
    // Reset steps
    resetProgressSteps();
    
    try {
        // Start generation
        updateStep(1, 'active');
        const result = await API.generateVideo(options);
        
        if (result.task_id) {
            // Poll for status
            pollInterval = setInterval(() => pollGenerationStatus(result.task_id), 3000);
        } else if (result.success) {
            // Direct result
            showGenerationComplete(result);
        }
    } catch (e) {
        showToast(`Error: ${e.message}`, 'error');
        
        // Demo mode if backend not connected
        if (e.message.includes('fetch') || e.message.includes('NetworkError')) {
            showToast('Running in demo mode (backend not connected)', 'info');
            runDemoGeneration();
        } else {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Video Now';
        }
    }
}

async function pollGenerationStatus(taskId) {
    try {
        const status = await API.getGenerationStatus(taskId);
        
        // Update progress
        if (status.step) {
            for (let i = 1; i <= 5; i++) {
                if (i < status.step) updateStep(i, 'done');
                else if (i === status.step) updateStep(i, 'active');
            }
            
            const progress = (status.step / 5) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = status.message || 'Processing...';
        }
        
        // Check if complete
        if (status.status === 'completed') {
            clearInterval(pollInterval);
            showGenerationComplete(status);
        } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            showToast('Generation failed: ' + status.error, 'error');
            resetGenerateButton();
        }
    } catch (e) {
        console.error('Poll error:', e);
    }
}

function showGenerationComplete(result) {
    // Mark all steps done
    for (let i = 1; i <= 5; i++) updateStep(i, 'done');
    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('progressText').textContent = 'Complete!';
    
    // Show result
    const resultContainer = document.getElementById('resultContainer');
    const resultDetails = document.getElementById('resultDetails');
    
    resultDetails.innerHTML = `
        <p>📹 <strong>Title:</strong> ${result.title || 'N/A'}</p>
        <p>📱 <strong>Type:</strong> ${result.video_type || 'short'}</p>
        <p>🏷️ <strong>Tags:</strong> ${(result.tags || []).join(', ')}</p>
        <p>#️⃣ <strong>Hashtags:</strong> ${(result.hashtags || []).join(' ')}</p>
        ${result.youtube_url ? `<p>🎬 <strong>YouTube:</strong> <a href="${result.youtube_url}" target="_blank">${result.youtube_url}</a></p>` : ''}
        ${result.scheduled ? `<p>📅 <strong>Scheduled:</strong> ${result.scheduled}</p>` : ''}
    `;
    
    resultContainer.style.display = 'block';
    showToast('Video generated successfully! 🎉', 'success');
    resetGenerateButton();
}

function resetGenerateButton() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-magic"></i> Generate Video Now';
}

function updateStep(stepNum, status) {
    const step = document.getElementById(`step${stepNum}`);
    if (!step) return;
    
    step.className = `progress-step ${status}`;
    const statusEl = step.querySelector('.step-status');
    
    if (status === 'active') {
        statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    } else if (status === 'done') {
        statusEl.innerHTML = '<i class="fas fa-check"></i>';
    } else {
        statusEl.innerHTML = '';
    }
}

function resetProgressSteps() {
    for (let i = 1; i <= 5; i++) updateStep(i, '');
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = 'Starting...';
}

// Demo mode (when backend not connected)
function runDemoGeneration() {
    const steps = [
        { step: 1, delay: 2000, msg: '🤖 AI Script generate થઈ રહી છે...' },
        { step: 2, delay: 4000, msg: '🔊 Voice Over create થઈ રહું છે...' },
        { step: 3, delay: 7000, msg: '🎬 Video render થઈ રહી છે...' },
        { step: 4, delay: 9000, msg: '📋 Metadata generate થઈ રહું છે...' },
        { step: 5, delay: 11000, msg: '📅 Upload schedule થઈ રહું છે...' },
    ];
    
    steps.forEach(({ step, delay, msg }) => {
        setTimeout(() => {
            for (let i = 1; i < step; i++) updateStep(i, 'done');
            updateStep(step, 'active');
            document.getElementById('progressFill').style.width = (step / 5 * 100) + '%';
            document.getElementById('progressText').textContent = msg;
        }, delay);
    });
    
    setTimeout(() => {
        showGenerationComplete({
            title: 'सफलता के 5 नियम | 5 Rules of Success',
            video_type: currentGenType,
            tags: ['motivation', 'success', 'hindi', 'viral'],
            hashtags: ['#motivation', '#hindi', '#success', '#viral', '#trending'],
            scheduled: 'Today at 8:00 PM (YouTube), 7:00 PM (Facebook)',
        });
    }, 13000);
}

// ==================== VIDEOS ====================
async function loadVideos() {
    try {
        const result = await API.getVideos();
        renderVideoGrid(result.videos || []);
    } catch (e) {
        console.log('Could not load videos');
    }
}

function renderVideoGrid(videos) {
    const grid = document.getElementById('videoGrid');
    
    if (!videos.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-film"></i>
                <h3>No videos yet</h3>
                <p>Generate your first video!</p>
                <button class="btn btn-primary" onclick="showSection('generate')">
                    <i class="fas fa-magic"></i> Generate
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = videos.map(v => `
        <div class="video-card">
            <div class="video-card-thumbnail">
                <i class="fas fa-play-circle"></i>
            </div>
            <div class="video-card-body">
                <div class="video-card-title">${v.title || 'Untitled'}</div>
                <div class="video-card-meta">
                    <span><i class="fas fa-clock"></i> ${v.duration || 'N/A'}</span>
                    <span><i class="fas fa-calendar"></i> ${v.created || 'N/A'}</span>
                </div>
            </div>
            <div class="video-card-actions">
                <button class="btn btn-primary btn-sm" onclick="uploadToYoutube('${v.id}')">
                    <i class="fab fa-youtube"></i> YT
                </button>
                <button class="btn btn-info btn-sm" onclick="uploadToFacebook('${v.id}')">
                    <i class="fab fa-facebook"></i> FB
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== DASHBOARD ====================
async function refreshDashboard() {
    try {
        const analytics = await API.getAnalytics();
        document.getElementById('totalVideos').textContent = analytics.total_videos || 0;
        document.getElementById('ytUploads').textContent = analytics.youtube_uploads || 0;
        document.getElementById('fbUploads').textContent = analytics.facebook_uploads || 0;
        document.getElementById('scheduledCount').textContent = analytics.scheduled || 0;
    } catch (e) {
        // Keep default values
    }
}

// ==================== BOT CONTROL ====================
async function startBot() {
    const settings = JSON.parse(localStorage.getItem('videobot_settings') || '{}');
    
    try {
        await API.startBot(settings);
        showToast('Bot started! 🤖', 'success');
        updateBotStatus(true);
    } catch (e) {
        showToast('Could not start bot. Check backend connection.', 'error');
    }
}

async function stopBot() {
    try {
        await API.stopBot();
        showToast('Bot stopped.', 'info');
    } catch (e) {
        showToast('Could not stop bot.', 'error');
    }
}

// ==================== AUTO MODE ====================
async function startAutoMode() {
    const config = {
        videos_per_day: parseInt(document.getElementById('autoVideosPerDay').value),
        make_shorts: document.getElementById('autoShort').checked,
        make_long: document.getElementById('autoLong').checked,
        ...JSON.parse(localStorage.getItem('videobot_settings') || '{}')
    };
    
    try {
        await API.startAutoMode(config);
        
        document.getElementById('autoStartBtn').style.display = 'none';
        document.getElementById('autoStopBtn').style.display = 'inline-flex';
        document.getElementById('autoLog').style.display = 'block';
        
        addLogEntry('🤖 Auto mode started!');
        addLogEntry(`📹 Will create ${config.videos_per_day} video(s) per day`);
        addLogEntry('⏰ Posting at peak hours automatically');
        
        showToast('Auto Mode started! Bot will run 24/7 🚀', 'success');
        
        // Start polling for logs
        setInterval(pollAutoLog, 10000);
        
    } catch (e) {
        showToast('Start failed. Deploy backend to Render.com first.', 'error');
        
        // Demo
        document.getElementById('autoStartBtn').style.display = 'none';
        document.getElementById('autoStopBtn').style.display = 'inline-flex';
        document.getElementById('autoLog').style.display = 'block';
        addLogEntry('⚠️ Demo mode - Connect backend for real operation');
        addLogEntry('📌 Deploy backend to Render.com (free)');
    }
}

async function stopAutoMode() {
    try {
        await API.stopAutoMode();
    } catch (e) {}
    
    document.getElementById('autoStartBtn').style.display = 'inline-flex';
    document.getElementById('autoStopBtn').style.display = 'none';
    
    addLogEntry('⏹️ Auto mode stopped');
    showToast('Auto Mode stopped', 'info');
}

function addLogEntry(message) {
    const log = document.getElementById('logContent');
    const time = new Date().toLocaleTimeString();
    log.innerHTML += `<div class="log-entry">[${time}] ${message}</div>`;
    log.scrollTop = log.scrollHeight;
}

async function pollAutoLog() {
    try {
        const status = await API.getBotStatus();
        if (status.latest_log) {
            addLogEntry(status.latest_log);
        }
    } catch (e) {}
}

// ==================== SCHEDULE ====================
async function loadSchedule() {
    try {
        const result = await API.getSchedule();
        // Render schedule
    } catch (e) {}
}

// ==================== ANALYTICS ====================
async function loadAnalytics() {
    try {
        const result = await API.getAnalytics();
        document.getElementById('analyticsGenerated').textContent = result.total_videos || 0;
        document.getElementById('analyticsUploaded').textContent = result.uploaded || 0;
        document.getElementById('analyticsFailed').textContent = result.failed || 0;
        
        const total = (result.uploaded || 0) + (result.failed || 0);
        const rate = total > 0 ? Math.round((result.uploaded / total) * 100) : 0;
        document.getElementById('analyticsRate').textContent = rate + '%';
    } catch (e) {}
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
document.addEventListener('DOMContentLoaded', function() {
    startConnection();
    setupEvents();
});

function startConnection() {
    updateStatus('connecting');
    tryConnect(1);
}

function tryConnect(attempt) {
    if (attempt > 6) {
        updateStatus('offline');
        showToast('Server sleeping. Wait 1 min & refresh.', 'error');
        return;
    }

    showToast('Connecting... attempt ' + attempt + '/6', 'info');

    API.ping()
        .then(function(result) {
            if (result && result.status === 'ok') {
                updateStatus('online');
                showToast('Connected! ✅', 'success');
                loadConnections();
                setInterval(autoCheck, 30000);
            } else {
                setTimeout(function() { tryConnect(attempt + 1); }, 8000);
            }
        })
        .catch(function() {
            setTimeout(function() { tryConnect(attempt + 1); }, 8000);
        });
}

function autoCheck() {
    API.ping()
        .then(function(r) { updateStatus(r && r.status === 'ok' ? 'online' : 'offline'); })
        .catch(function() { updateStatus('offline'); });
}

function loadConnections() {
    API.testConnections()
        .then(function(conn) {
            setBadge('ytConnection', conn.youtube);
            setBadge('fbConnection', conn.facebook);
        })
        .catch(function() {});
}

function setBadge(id, connected) {
    var badge = document.querySelector('#' + id + ' .status-badge');
    if (badge) {
        badge.textContent = connected ? 'Connected' : 'Not Connected';
        badge.className = 'status-badge ' + (connected ? 'connected' : 'disconnected');
    }
}

function updateStatus(status) {
    var dot = document.querySelector('#botStatus .status-dot');
    var text = document.querySelector('#botStatus span');
    var ldot = document.querySelector('#botStatusLarge .pulse-dot');
    var ltext = document.querySelector('#botStatusLarge span');
    var bb = document.querySelector('#backendConnection .status-badge');

    var isOnline = status === 'online';
    var isConnecting = status === 'connecting';

    if (dot) dot.className = 'status-dot ' + (isOnline ? 'online' : 'offline');
    if (text) text.textContent = isOnline ? 'Bot Online' : (isConnecting ? 'Connecting...' : 'Bot Offline');
    if (ldot) ldot.className = 'pulse-dot ' + (isOnline ? 'online' : 'offline');
    if (ltext) ltext.textContent = isOnline ? 'Bot is Online' : (isConnecting ? 'Connecting...' : 'Bot is Offline');
    if (bb) {
        bb.textContent = isOnline ? 'Connected' : (isConnecting ? 'Connecting...' : 'Not Connected');
        bb.className = 'status-badge ' + (isOnline ? 'connected' : 'disconnected');
    }
}

function setupEvents() {
    var niche = document.getElementById('channelNiche');
    if (niche) niche.onchange = function() {
        var cg = document.getElementById('customNicheGroup');
        if (cg) cg.style.display = this.value === 'custom' ? 'block' : 'none';
    };

    var vs = document.getElementById('videoShort');
    if (vs) vs.onchange = function() {
        var g = document.getElementById('shortDurationGroup');
        if (g) g.style.display = this.checked ? 'block' : 'none';
    };

    var vl = document.getElementById('videoLong');
    if (vl) vl.onchange = function() {
        var g = document.getElementById('longDurationGroup');
        if (g) g.style.display = this.checked ? 'block' : 'none';
    };
}

function showSection(name) {
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    var sec = document.getElementById('section-' + name);
    if (sec) sec.classList.add('active');

    document.querySelectorAll('.nav-links li').forEach(function(li) { li.classList.remove('active'); });
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    if (name === 'dashboard') refreshDashboard();
    if (name === 'videos') loadVideos();
    if (name === 'analytics') loadAnalytics();
    if (name === 'setup') loadConnections();
}

function toggleSidebar() {
    var sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('open');
}

function gv(id) { var e = document.getElementById(id); return e ? e.value : ''; }
function gc(id) { var e = document.getElementById(id); return e ? e.checked : false; }
function st(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

function saveSettings(e) {
    if (e) e.preventDefault();
    var s = {
        channel_name: gv('channelName'),
        channel_niche: gv('channelNiche') === 'custom' ? gv('customNiche') : gv('channelNiche'),
        youtube_channel_id: gv('youtubeChannelId'),
        facebook_page_id: gv('facebookPageId'),
        facebook_token: gv('facebookToken'),
        video_short: gc('videoShort'),
        video_long: gc('videoLong'),
        voice: gv('voiceSelect'),
        videos_per_day: parseInt(gv('videosPerDay') || '1'),
        upload_youtube: gc('uploadYoutube'),
        upload_facebook: gc('uploadFacebook')
    };
    API.saveSettings(s)
        .then(function() { showToast('Settings saved! ✅', 'success'); })
        .catch(function() { showToast('Save failed', 'error'); });
}

function testConnection() {
    showToast('Testing...', 'info');
    loadConnections();
}

function connectYouTube() {
    API.getYouTubeAuthUrl()
        .then(function(r) {
            if (r.auth_url) {
                window.open(r.auth_url, '_blank');
                showToast('Complete login in new window', 'info');
            } else {
                showToast(r.error || 'Setup credentials first', 'error');
            }
        })
        .catch(function() { showToast('Backend not connected', 'error'); });
}

var currentGenType = 'short';
function setGenType(type, btn) {
    currentGenType = type;
    document.querySelectorAll('.btn-group .btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
}

function toggleTopicInput() {
    var mode = document.querySelector('input[name="topicMode"]:checked');
    var group = document.getElementById('customTopicGroup');
    if (group && mode) group.style.display = mode.value === 'custom' ? 'block' : 'none';
}

function generateVideo() {
    var btn = document.getElementById('generateBtn');
    var progress = document.getElementById('progressContainer');
    var result = document.getElementById('resultContainer');

    var mode = document.querySelector('input[name="topicMode"]:checked');
    var topic = mode && mode.value === 'custom' ? gv('customTopic') : null;

    if (mode && mode.value === 'custom' && !topic) {
        showToast('Enter a topic!', 'error');
        return;
    }

    var opts = {
        topic: topic, video_type: currentGenType,
        auto_upload: gc('genAutoUpload'),
        channel_niche: gv('channelNiche'), voice: gv('voiceSelect'),
        upload_youtube: gc('uploadYoutube'), upload_facebook: gc('uploadFacebook'),
        facebook_page_id: gv('facebookPageId'), facebook_token: gv('facebookToken')
    };

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }
    if (progress) progress.style.display = 'block';
    if (result) result.style.display = 'none';
    resetSteps();

    API.generateVideo(opts)
        .then(function(r) { if (r.task_id) pollStatus(r.task_id); })
        .catch(function(e) { showToast('Error: ' + e.message, 'error'); resetBtn(); });
}

var pollTimer = null;
function pollStatus(tid) {
    pollTimer = setInterval(function() {
        API.getGenerationStatus(tid)
            .then(function(s) {
                if (s.step) {
                    for (var i = 1; i <= 5; i++) {
                        if (i < s.step) setStep(i, 'done');
                        else if (i === s.step) setStep(i, 'active');
                    }
                    var f = document.getElementById('progressFill');
                    var t = document.getElementById('progressText');
                    if (f) f.style.width = (s.step / 5 * 100) + '%';
                    if (t) t.textContent = s.message || 'Processing...';
                }
                if (s.status === 'completed') { clearInterval(pollTimer); showComplete(s); }
                if (s.status === 'failed') { clearInterval(pollTimer); showToast('Failed: ' + s.message, 'error'); resetBtn(); }
            })
            .catch(function() {});
    }, 3000);
}

function showComplete(r) {
    for (var i = 1; i <= 5; i++) setStep(i, 'done');
    var f = document.getElementById('progressFill');
    var t = document.getElementById('progressText');
    if (f) f.style.width = '100%';
    if (t) t.textContent = 'Complete! ✅';

    var rd = document.getElementById('resultDetails');
    if (rd) {
        rd.innerHTML = '<p>📹 <b>Title:</b> ' + (r.title || '') + '</p>' +
            '<p>📱 <b>Type:</b> ' + (r.video_type || 'short') + '</p>' +
            '<p>🏷 <b>Tags:</b> ' + (r.tags || []).join(', ') + '</p>' +
            '<p>#️⃣ <b>Hashtags:</b> ' + (r.hashtags || []).join(' ') + '</p>' +
            (r.youtube_url ? '<p>🎬 <a href="' + r.youtube_url + '" target="_blank">YouTube Link</a></p>' : '');
    }
    var rc = document.getElementById('resultContainer');
    if (rc) rc.style.display = 'block';
    showToast('Video generated! 🎉', 'success');
    resetBtn();
}

function resetBtn() {
    var b = document.getElementById('generateBtn');
    if (b) { b.disabled = false; b.innerHTML = '<i class="fas fa-magic"></i> Generate Video Now'; }
}

function setStep(n, s) {
    var step = document.getElementById('step' + n);
    if (!step) return;
    step.className = 'progress-step ' + s;
    var st = step.querySelector('.step-status');
    if (!st) return;
    st.innerHTML = s === 'active' ? '<i class="fas fa-spinner fa-spin"></i>' : (s === 'done' ? '<i class="fas fa-check"></i>' : '');
}

function resetSteps() {
    for (var i = 1; i <= 5; i++) setStep(i, '');
    var f = document.getElementById('progressFill');
    var t = document.getElementById('progressText');
    if (f) f.style.width = '0%';
    if (t) t.textContent = 'Starting...';
}

function loadVideos() {
    API.getVideos()
        .then(function(r) {
            var g = document.getElementById('videoGrid');
            if (!g) return;
            var v = r.videos || [];
            if (!v.length) { g.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><h3>No videos yet</h3></div>'; return; }
            g.innerHTML = v.map(function(x) {
                return '<div class="video-card"><div class="video-card-thumbnail"><i class="fas fa-play-circle"></i></div><div class="video-card-body"><div class="video-card-title">' + (x.title || 'Untitled') + '</div><div class="video-card-meta"><span>' + (x.created || '') + '</span></div></div></div>';
            }).join('');
        })
        .catch(function() {});
}

function refreshDashboard() {
    API.getAnalytics()
        .then(function(r) {
            st('totalVideos', r.total_videos || 0);
            st('ytUploads', r.youtube_uploads || 0);
            st('fbUploads', r.facebook_uploads || 0);
            st('scheduledCount', r.scheduled || 0);
        })
        .catch(function() {});
}

function startBot() {
    API.startBot({}).then(function() { showToast('Bot started! 🤖', 'success'); }).catch(function() {});
}
function stopBot() {
    API.stopBot().then(function() { showToast('Bot stopped', 'info'); }).catch(function() {});
}

function startAutoMode() {
    var c = {
        videos_per_day: parseInt(gv('autoVideosPerDay') || '1'),
        make_shorts: gc('autoShort'), make_long: gc('autoLong'),
        channel_niche: gv('channelNiche'), voice: gv('voiceSelect'),
        upload_youtube: gc('uploadYoutube'), upload_facebook: gc('uploadFacebook')
    };
    API.startAutoMode(c)
        .then(function() {
            var sb = document.getElementById('autoStartBtn');
            var eb = document.getElementById('autoStopBtn');
            var log = document.getElementById('autoLog');
            if (sb) sb.style.display = 'none';
            if (eb) eb.style.display = 'inline-flex';
            if (log) log.style.display = 'block';
            addLog('🤖 Auto mode started!');
            showToast('Auto Mode started! 🚀', 'success');
        })
        .catch(function() { showToast('Failed', 'error'); });
}

function stopAutoMode() {
    API.stopAutoMode().catch(function() {});
    var sb = document.getElementById('autoStartBtn');
    var eb = document.getElementById('autoStopBtn');
    if (sb) sb.style.display = 'inline-flex';
    if (eb) eb.style.display = 'none';
    addLog('⏹ Stopped');
}

function addLog(msg) {
    var log = document.getElementById('logContent');
    if (!log) return;
    log.innerHTML += '<div>[' + new Date().toLocaleTimeString() + '] ' + msg + '</div>';
    log.scrollTop = log.scrollHeight;
}

function loadAnalytics() {
    API.getAnalytics()
        .then(function(r) {
            st('analyticsGenerated', r.total_videos || 0);
            st('analyticsUploaded', r.uploaded || 0);
            st('analyticsFailed', r.failed || 0);
        })
        .catch(function() {});
}

function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    var icons = {success:'check-circle', error:'exclamation-circle', info:'info-circle'};
    t.innerHTML = '<i class="fas fa-' + (icons[type] || 'info-circle') + '"></i> ' + msg;
    c.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.remove(); }, 5000);
}

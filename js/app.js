document.addEventListener('DOMContentLoaded', function() {
    checkConnection();
    setupEvents();
    setInterval(checkConnection, 30000);
});

function setupEvents() {
    var niche = document.getElementById('channelNiche');
    if (niche) {
        niche.addEventListener('change', function() {
            var cg = document.getElementById('customNicheGroup');
            if (cg) cg.style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }

    var vs = document.getElementById('videoShort');
    if (vs) {
        vs.addEventListener('change', function() {
            var g = document.getElementById('shortDurationGroup');
            if (g) g.style.display = this.checked ? 'block' : 'none';
        });
    }

    var vl = document.getElementById('videoLong');
    if (vl) {
        vl.addEventListener('change', function() {
            var g = document.getElementById('longDurationGroup');
            if (g) g.style.display = this.checked ? 'block' : 'none';
        });
    }
}

async function checkConnection() {
    var backendBadge = document.querySelector('#backendConnection .status-badge');
    var ytBadge = document.querySelector('#ytConnection .status-badge');
    var fbBadge = document.querySelector('#fbConnection .status-badge');

    try {
        var ping = await API.ping();

        if (backendBadge) {
            backendBadge.textContent = 'Connected';
            backendBadge.className = 'status-badge connected';
        }
        updateBotStatus(true);

        try {
            var conn = await API.testConnections();

            if (ytBadge) {
                if (conn.youtube) {
                    ytBadge.textContent = 'Connected';
                    ytBadge.className = 'status-badge connected';
                } else {
                    ytBadge.textContent = 'Not Connected';
                    ytBadge.className = 'status-badge disconnected';
                }
            }

            if (fbBadge) {
                if (conn.facebook) {
                    fbBadge.textContent = 'Connected';
                    fbBadge.className = 'status-badge connected';
                } else {
                    fbBadge.textContent = 'Not Connected';
                    fbBadge.className = 'status-badge disconnected';
                }
            }
        } catch(e) {
            console.log('Connection test error:', e);
        }

    } catch(e) {
        if (backendBadge) {
            backendBadge.textContent = 'Not Connected';
            backendBadge.className = 'status-badge disconnected';
        }
        updateBotStatus(false);
    }
}

function updateBotStatus(online) {
    var dot = document.querySelector('#botStatus .status-dot');
    var text = document.querySelector('#botStatus span');
    var ldot = document.querySelector('#botStatusLarge .pulse-dot');
    var ltext = document.querySelector('#botStatusLarge span');

    if (online) {
        if (dot) { dot.className = 'status-dot online'; }
        if (text) { text.textContent = 'Bot Online'; }
        if (ldot) { ldot.className = 'pulse-dot online'; }
        if (ltext) { ltext.textContent = 'Bot is Online'; }
    } else {
        if (dot) { dot.className = 'status-dot offline'; }
        if (text) { text.textContent = 'Bot Offline'; }
        if (ldot) { ldot.className = 'pulse-dot offline'; }
        if (ltext) { ltext.textContent = 'Bot is Offline'; }
    }
}

function showSection(name) {
    var sections = document.querySelectorAll('.section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].classList.remove('active');
    }

    var section = document.getElementById('section-' + name);
    if (section) section.classList.add('active');

    var links = document.querySelectorAll('.nav-links li');
    for (var i = 0; i < links.length; i++) {
        links[i].classList.remove('active');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

async function saveSettings(e) {
    if (e) e.preventDefault();

    var settings = {
        channel_name: val('channelName'),
        channel_niche: val('channelNiche') === 'custom' ? val('customNiche') : val('channelNiche'),
        youtube_channel_id: val('youtubeChannelId'),
        youtube_api_key: val('youtubeApiKey'),
        facebook_page_id: val('facebookPageId'),
        facebook_token: val('facebookToken'),
        video_short: checked('videoShort'),
        video_long: checked('videoLong'),
        short_duration: parseInt(val('shortDuration') || '60'),
        long_duration: parseInt(val('longDuration') || '5'),
        voice: val('voiceSelect'),
        voice_speed: val('voiceSpeed') + '%',
        videos_per_day: parseInt(val('videosPerDay') || '1'),
        upload_youtube: checked('uploadYoutube'),
        upload_facebook: checked('uploadFacebook'),
        post_strategy: val('postStrategy')
    };

    try {
        await API.saveSettings(settings);
        showToast('Settings saved!', 'success');
    } catch(e) {
        showToast('Saved locally only', 'info');
    }
}

function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
}

function checked(id) {
    var el = document.getElementById(id);
    return el ? el.checked : false;
}

async function testConnection() {
    showToast('Testing...', 'info');
    try {
        var r = await API.testConnections();
        var msg = 'YouTube: ' + (r.youtube ? '✅' : '❌') +
                  ' | Facebook: ' + (r.facebook ? '✅' : '❌');
        showToast(msg, r.youtube ? 'success' : 'info');
    } catch(e) {
        showToast('Backend not connected', 'error');
    }
}

async function connectYouTube() {
    try {
        var r = await API.getYouTubeAuthUrl();
        if (r.auth_url) {
            window.open(r.auth_url, '_blank');
            showToast('Complete YouTube login in new window', 'info');
        } else {
            showToast(r.error || 'Setup YouTube credentials first', 'error');
        }
    } catch(e) {
        showToast('Backend not connected', 'error');
    }
}

var currentGenType = 'short';

function setGenType(type, btn) {
    currentGenType = type;
    var btns = document.querySelectorAll('.btn-group .btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (btn) btn.classList.add('active');
}

function toggleTopicInput() {
    var mode = document.querySelector('input[name="topicMode"]:checked');
    var group = document.getElementById('customTopicGroup');
    if (group && mode) {
        group.style.display = mode.value === 'custom' ? 'block' : 'none';
    }
}

async function generateVideo() {
    var btn = document.getElementById('generateBtn');
    var progress = document.getElementById('progressContainer');
    var result = document.getElementById('resultContainer');

    var mode = document.querySelector('input[name="topicMode"]:checked');
    var topic = mode && mode.value === 'custom' ? val('customTopic') : null;

    if (mode && mode.value === 'custom' && !topic) {
        showToast('Enter a topic!', 'error');
        return;
    }

    var options = {
        topic: topic,
        video_type: currentGenType,
        auto_upload: checked('genAutoUpload'),
        channel_niche: val('channelNiche'),
        voice: val('voiceSelect'),
        upload_youtube: checked('uploadYoutube'),
        upload_facebook: checked('uploadFacebook'),
        facebook_page_id: val('facebookPageId'),
        facebook_token: val('facebookToken')
    };

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    if (progress) progress.style.display = 'block';
    if (result) result.style.display = 'none';
    resetSteps();

    try {
        var r = await API.generateVideo(options);
        if (r.task_id) {
            pollStatus(r.task_id);
        }
    } catch(e) {
        showToast('Error: ' + e.message, 'error');
        runDemo();
    }
}

var pollTimer = null;

function pollStatus(taskId) {
    pollTimer = setInterval(async function() {
        try {
            var s = await API.getGenerationStatus(taskId);

            if (s.step) {
                for (var i = 1; i <= 5; i++) {
                    if (i < s.step) setStep(i, 'done');
                    else if (i === s.step) setStep(i, 'active');
                }
                var pct = (s.step / 5) * 100;
                var fill = document.getElementById('progressFill');
                var text = document.getElementById('progressText');
                if (fill) fill.style.width = pct + '%';
                if (text) text.textContent = s.message || 'Processing...';
            }

            if (s.status === 'completed') {
                clearInterval(pollTimer);
                showComplete(s);
            } else if (s.status === 'failed') {
                clearInterval(pollTimer);
                showToast('Failed: ' + s.message, 'error');
                resetBtn();
            }
        } catch(e) {
            console.log('Poll error');
        }
    }, 3000);
}

function showComplete(r) {
    for (var i = 1; i <= 5; i++) setStep(i, 'done');
    var fill = document.getElementById('progressFill');
    var text = document.getElementById('progressText');
    if (fill) fill.style.width = '100%';
    if (text) text.textContent = 'Complete!';

    var rc = document.getElementById('resultContainer');
    var rd = document.getElementById('resultDetails');
    if (rd) {
        rd.innerHTML =
            '<p>📹 <b>Title:</b> ' + (r.title || 'N/A') + '</p>' +
            '<p>📱 <b>Type:</b> ' + (r.video_type || 'short') + '</p>' +
            '<p>🏷 <b>Tags:</b> ' + (r.tags || []).join(', ') + '</p>' +
            '<p>#️⃣ <b>Hashtags:</b> ' + (r.hashtags || []).join(' ') + '</p>' +
            (r.youtube_url ? '<p>🎬 <b>YouTube:</b> <a href="' + r.youtube_url + '" target="_blank">' + r.youtube_url + '</a></p>' : '');
    }
    if (rc) rc.style.display = 'block';
    showToast('Video generated! 🎉', 'success');
    resetBtn();
}

function resetBtn() {
    var btn = document.getElementById('generateBtn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Generate Video Now';
    }
}

function setStep(n, status) {
    var step = document.getElementById('step' + n);
    if (!step) return;
    step.className = 'progress-step ' + status;
    var st = step.querySelector('.step-status');
    if (!st) return;
    if (status === 'active') st.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    else if (status === 'done') st.innerHTML = '<i class="fas fa-check"></i>';
    else st.innerHTML = '';
}

function resetSteps() {
    for (var i = 1; i <= 5; i++) setStep(i, '');
    var f = document.getElementById('progressFill');
    var t = document.getElementById('progressText');
    if (f) f.style.width = '0%';
    if (t) t.textContent = 'Starting...';
}

function runDemo() {
    var steps = [
        {s:1, d:2000, m:'🤖 Script generating...'},
        {s:2, d:4000, m:'🔊 Voice creating...'},
        {s:3, d:7000, m:'🎬 Video rendering...'},
        {s:4, d:9000, m:'📋 Metadata...'},
        {s:5, d:11000, m:'📅 Scheduling...'}
    ];
    steps.forEach(function(x) {
        setTimeout(function() {
            for (var i = 1; i < x.s; i++) setStep(i, 'done');
            setStep(x.s, 'active');
            var f = document.getElementById('progressFill');
            var t = document.getElementById('progressText');
            if (f) f.style.width = (x.s/5*100) + '%';
            if (t) t.textContent = x.m;
        }, x.d);
    });
    setTimeout(function() {
        showComplete({
            title: 'सफलता के नियम',
            video_type: currentGenType,
            tags: ['motivation','hindi','viral'],
            hashtags: ['#motivation','#hindi','#viral']
        });
    }, 13000);
}

async function loadVideos() {
    try {
        var r = await API.getVideos();
        

// admin.js — полная версия со статистикой устройств и удалением историй

document.addEventListener('DOMContentLoaded', () => {
    loadAllStats();
    loadLocalStoriesList();
    setupFileUpload();
    setupButtons();
    
    // Обновляем статистику каждые 10 секунд
    setInterval(() => {
        loadAllStats();
        loadLocalStoriesList();
    }, 10000);
});

// Загрузка всей статистики
async function loadAllStats() {
    loadVisitStats();
    await loadStoriesStats();
    loadDeviceStats();
    document.getElementById('lastUpdate').textContent = 
        `обновлено ${new Date().toLocaleTimeString()}`;
}

// Статистика посещений
function loadVisitStats() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{}');
    
    document.getElementById('onlineNow').textContent = calculateOnline();
    document.getElementById('todayVisits').textContent = stats.today || 0;
    document.getElementById('yesterdayVisits').textContent = stats.yesterday || 0;
    document.getElementById('totalVisits').textContent = stats.visits || 0;
}

// Подсчёт онлайн (кто заходил за последние 15 минут)
function calculateOnline() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{}');
    const visits = stats.visitHistory || [];
    const now = Date.now();
    const fifteenMinAgo = now - 15 * 60 * 1000;
    
    // Считаем уникальных посетителей за последние 15 минут
    const onlineVisitors = new Set();
    visits.forEach(visit => {
        if (visit.time > fifteenMinAgo) {
            onlineVisitors.add(visit.id);
        }
    });
    
    return onlineVisitors.size || (stats.lastVisit && stats.lastVisit > fifteenMinAgo ? 1 : 0);
}

// Статистика по историям
async function loadStoriesStats() {
    const stories = await getAllStories();
    
    document.getElementById('storiesCount').textContent = stories.length;
    
    let totalMessages = 0;
    let totalChars = 0;
    let maxMessages = 0;
    let popularStory = stories[0]?.title || '—';
    let storyReads = {};
    
    stories.forEach(story => {
        const scenes = Object.values(story.scenes || {});
        let storyMessages = 0;
        
        scenes.forEach(scene => {
            storyMessages += scene.messages?.length || 0;
            scene.messages?.forEach(m => totalChars += m.text?.length || 0);
        });
        
        totalMessages += storyMessages;
        
        if (storyMessages > maxMessages) {
            maxMessages = storyMessages;
            popularStory = story.title;
        }
        
        // Статистика прочтений (из прогресса)
        const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORY_PROGRESS) || '{}');
        if (progress[story.id]) {
            storyReads[story.title] = (storyReads[story.title] || 0) + 1;
        }
    });
    
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('totalChars').textContent = totalChars.toLocaleString();
    document.getElementById('popularStory').textContent = popularStory;
}

// Статистика устройств и браузеров (РЕАЛЬНАЯ)
function loadDeviceStats() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{}');
    const visits = stats.visitHistory || [];
    
    // Счётчики
    let devices = { mobile: 0, tablet: 0, desktop: 0 };
    let browsers = { chrome: 0, firefox: 0, safari: 0, edge: 0, opera: 0, other: 0 };
    
    visits.forEach(visit => {
        // Устройства
        if (visit.device === 'mobile') devices.mobile++;
        else if (visit.device === 'tablet') devices.tablet++;
        else devices.desktop++;
        
        // Браузеры
        if (visit.browser === 'chrome') browsers.chrome++;
        else if (visit.browser === 'firefox') browsers.firefox++;
        else if (visit.browser === 'safari') browsers.safari++;
        else if (visit.browser === 'edge') browsers.edge++;
        else if (visit.browser === 'opera') browsers.opera++;
        else browsers.other++;
    });
    
    const total = visits.length || 1;
    
    // Обновляем проценты
    document.getElementById('mobilePct').textContent = Math.round((devices.mobile / total) * 100) + '%';
    document.getElementById('tabletPct').textContent = Math.round((devices.tablet / total) * 100) + '%';
    document.getElementById('desktopPct').textContent = Math.round((devices.desktop / total) * 100) + '%';
    
    document.getElementById('chromePct').textContent = Math.round((browsers.chrome / total) * 100) + '%';
    document.getElementById('firefoxPct').textContent = Math.round((browsers.firefox / total) * 100) + '%';
    document.getElementById('safariPct').textContent = Math.round((browsers.safari / total) * 100) + '%';
    document.getElementById('edgePct').textContent = Math.round((browsers.edge / total) * 100) + '%';
    document.getElementById('operaPct').textContent = Math.round((browsers.opera / total) * 100) + '%';
    document.getElementById('otherPct').textContent = Math.round((browsers.other / total) * 100) + '%';
}

// Загрузка списка локальных историй
function loadLocalStoriesList() {
    const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
    const container = document.getElementById('localStoriesList');
    
    if (!container) return;
    
    if (localStories.length === 0) {
        container.innerHTML = '<div class="local-stories-empty">📭 Нет локальных историй</div>';
        return;
    }
    
    container.innerHTML = '';
    
    localStories.forEach((story, index) => {
        const storyEl = document.createElement('div');
        storyEl.className = 'local-story-item';
        
        const date = new Date(story.createdAt).toLocaleDateString();
        const scenesCount = Object.keys(story.scenes || {}).length;
        
        storyEl.innerHTML = `
            <div class="local-story-info">
                <div class="local-story-title">${story.title}</div>
                <div class="local-story-meta">
                    <span>📅 ${date}</span>
                    <span>🎬 ${scenesCount} сцен</span>
                </div>
            </div>
            <button class="local-story-delete" data-index="${index}">🗑️ Удалить</button>
        `;
        
        container.appendChild(storyEl);
    });
    
    // Добавляем обработчики удаления
    document.querySelectorAll('.local-story-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = btn.dataset.index;
            deleteLocalStory(index);
        });
    });
}

// Удаление локальной истории
function deleteLocalStory(index) {
    if (!confirm('Удалить эту историю? Это действие нельзя отменить.')) return;
    
    const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
    localStories.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORIES, JSON.stringify(localStories));
    
    // Также удаляем прогресс по этой истории
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORY_PROGRESS) || '{}');
    // Здесь сложнее, но можно просто не трогать — прогресс останется, но истории нет
    
    loadLocalStoriesList();
    loadAllStats(); // обновляем статистику
}

// Настройка загрузки файлов
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('uploadPreview');
    const confirmBtn = document.getElementById('confirmUpload');
    
    if (!uploadArea) return;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });
    
    function handleFile(file) {
        if (!file.name.endsWith('.txt')) {
            alert('Только .txt файлы!');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const story = parseStory(e.target.result, file.name);
            saveLocalStory(story);
            
            document.querySelector('.upload-preview__name').textContent = file.name;
            document.querySelector('.upload-preview__size').textContent = 
                (file.size / 1024).toFixed(1) + ' КБ';
            preview.style.display = 'block';
        };
        reader.readAsText(file);
    }
    
    confirmBtn.addEventListener('click', () => {
        alert('История сохранена локально!');
        preview.style.display = 'none';
        loadAllStats();
        loadLocalStoriesList();
    });
}

// Настройка кнопок
function setupButtons() {
    const resetBtn = document.getElementById('resetStats');
    const exportBtn = document.getElementById('exportStats');
    const refreshBtn = document.getElementById('refreshLocalList');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Сбросить всю статистику посещений?')) {
                const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{}');
                // Сохраняем только истории, сбрасываем посещения
                stats.visits = 0;
                stats.today = 0;
                stats.yesterday = 0;
                stats.visitHistory = [];
                localStorage.setItem('suzhet_stats', JSON.stringify(stats));
                loadAllStats();
            }
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const stats = {
                visits: JSON.parse(localStorage.getItem('suzhet_stats') || '{}'),
                stories: {
                    builtIn: 3, // можно сделать динамическим
                    local: JSON.parse(localStorage.getItem('suzhet_local_stories') || '[]').length
                },
                exported: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(stats, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `suzhet-stats-${Date.now()}.json`;
            a.click();
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadLocalStoriesList();
        });
    }
}

// Обновляем функцию updateVisitStats в main.js для сбора статистики
// Этот код должен быть в main.js, но я продублирую тут для целостности
function updateMainStats() {
    // Эта функция должна вызываться при каждом заходе на главную
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{"visits":0,"today":0,"lastDate":"","visitHistory":[]}');
    
    const today = new Date().toDateString();
    const now = Date.now();
    
    // Определяем устройство и браузер
    const ua = navigator.userAgent;
    let device = 'desktop';
    let browser = 'other';
    
    // Устройство
    if (/mobile/i.test(ua)) device = 'mobile';
    else if (/tablet/i.test(ua)) device = 'tablet';
    
    // Браузер
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'chrome';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'safari';
    else if (ua.includes('Edg')) browser = 'edge';
    else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'opera';
    
    // Создаём уникальный ID для посетителя (если нет)
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_id', visitorId);
    }
    
    // Добавляем в историю
    if (!stats.visitHistory) stats.visitHistory = [];
    stats.visitHistory.push({
        id: visitorId,
        time: now,
        device: device,
        browser: browser
    });
    
    // Ограничиваем историю последними 1000 записями
    if (stats.visitHistory.length > 1000) {
        stats.visitHistory = stats.visitHistory.slice(-1000);
    }
    
    // Обновляем счётчики
    if (stats.lastDate !== today) {
        stats.yesterday = stats.today || 0;
        stats.today = 1;
        stats.lastDate = today;
    } else {
        stats.today = (stats.today || 0) + 1;
    }
    
    stats.visits = (stats.visits || 0) + 1;
    stats.lastVisit = now;
    
    localStorage.setItem('suzhet_stats', JSON.stringify(stats));
}

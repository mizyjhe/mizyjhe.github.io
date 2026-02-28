const SECRET_CODE = ['сюжет', 'admin', 'супер'];
let keyBuffer = '';

// В начало функции DOMContentLoaded добавь:
document.addEventListener('DOMContentLoaded', async () => {
    // Собираем статистику о посещении
    collectVisitStats(); // ← добавить эту строку
    
    const stories = await getAllStories();
    renderStories(stories);

    
    let logoClickCount = 0;
    document.getElementById('secretLogo').addEventListener('click', () => {
        logoClickCount++;
        if (logoClickCount >= 5) {
            promptSecret();
            logoClickCount = 0;
        }
        setTimeout(() => logoClickCount = 0, 3000);
    });
    
    document.addEventListener('keydown', (e) => {
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);
        if (keyBuffer.includes('сюжет') || keyBuffer.includes('suzhet')) {
            promptSecret();
            keyBuffer = '';
        }
    });
    
    document.getElementById('statsLink').addEventListener('click', (e) => {
        e.preventDefault();
        promptSecret();
    });
});

function renderStories(stories) {
    const grid = document.getElementById('storiesGrid');
    grid.innerHTML = '';
    
    stories.forEach(story => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.innerHTML = `
            <h3 class="story-card__title">${story.title}</h3>
            <p class="story-card__description">${story.builtIn ? '📖 Встроенная' : '📱 Локальная'}</p>
            <div class="story-card__meta">
                <span>⭐ ${Object.keys(story.scenes || {}).length} сцен</span>
                <span>📅 ${new Date(story.createdAt).toLocaleDateString()}</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            sessionStorage.setItem('currentStory', JSON.stringify(story));
            window.location.href = 'story.html';
        });
        
        grid.appendChild(card);
    });
}

function promptSecret() {
    const code = prompt('🔐 Введите код доступа:');
    if (SECRET_CODE.includes(code?.toLowerCase())) {
        const dest = confirm('Перейти в админку? (ОК - админка, Отмена - редактор)');
        window.location.href = dest ? 'admin.html' : 'editor.html';
    } else if (code) {
        alert('Неверный код');
    }
}

function updateVisitStats() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{"visits":0,"today":0,"lastDate":""}');
    const today = new Date().toDateString();
    
    if (stats.lastDate !== today) {
        stats.yesterday = stats.today || 0;
        stats.today = 1;
        stats.lastDate = today;
    } else {
        stats.today = (stats.today || 0) + 1;
    }
    
    stats.visits = (stats.visits || 0) + 1;
    stats.lastVisit = Date.now();
    localStorage.setItem('suzhet_stats', JSON.stringify(stats));
}

function collectVisitStats() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{"visits":0,"today":0,"lastDate":"","visitHistory":[]}');
    
    const today = new Date().toDateString();
    const now = Date.now();
    
    // Определяем устройство и браузер
    const ua = navigator.userAgent;
    let device = 'desktop';
    let browser = 'other';
    
    if (/mobile/i.test(ua)) device = 'mobile';
    else if (/tablet/i.test(ua)) device = 'tablet';
    
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'chrome';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'safari';
    else if (ua.includes('Edg')) browser = 'edge';
    else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'opera';
    
    // Создаём уникальный ID для посетителя
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
    
    // Ограничиваем историю
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

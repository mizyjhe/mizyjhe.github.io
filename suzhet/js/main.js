const SECRET_CODE = ['сюжет', 'admin', 'супер'];
let keyBuffer = '';

document.addEventListener('DOMContentLoaded', async () => {
    const stories = await getAllStories();
    renderStories(stories);
    updateVisitStats();
    
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
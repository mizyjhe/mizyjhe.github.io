/**
 * Сюжет — Страница книг (показывает только встроенные)
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const stories = await loadBuiltInStories();
        renderBooks(stories);
    } catch (e) {
        console.error('[Книги] Ошибка загрузки:', e);
        renderBooksError('Не удалось загрузить книги');
    }
});

function renderBooks(stories) {
    const grid = document.getElementById('storiesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    if (stories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state__icon">📚</div>
                <div class="empty-state__title">Книги скоро появятся</div>
                <div class="empty-state__text">Загляни позже или загрузи свою историю</div>
            </div>
        `;
        return;
    }

    stories.forEach(story => {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        const scenesCount = Object.keys(story.scenes || {}).length;
        const genre = story.genre || 'Драма';

        card.innerHTML = `
            <span class="story-card__genre">${escapeHtml(genre)}</span>
            <h3 class="story-card__title">${escapeHtml(story.title)}</h3>
            <p class="story-card__description">📖 Встроенная история</p>
            <div class="story-card__meta">
                <span>🎬 ${scenesCount} ${pluralize(scenesCount, 'сцена', 'сцены', 'сцен')}</span>
            </div>
        `;

        const openStory = () => {
            sessionStorage.setItem('currentStory', JSON.stringify(story));
            window.location.href = 'story.html';
        };

        card.addEventListener('click', openStory);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openStory();
            }
        });

        grid.appendChild(card);
    });
}

function renderBooksError(message) {
    const grid = document.getElementById('storiesGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state__icon">⚠️</div>
            <div class="empty-state__title">${escapeHtml(message)}</div>
        </div>
    `;
}

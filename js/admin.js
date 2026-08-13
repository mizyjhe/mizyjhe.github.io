/**
 * Сюжет — Админ-панель
 */

document.addEventListener('DOMContentLoaded', () => {
    loadAllStats();
    loadLocalStoriesList();
    setupFileUpload();
    setupButtons();

    // Автообновление каждые 30 секунд
    setInterval(() => {
        loadAllStats();
        loadLocalStoriesList();
    }, 30000);
});

/** Загружает всю статистику */
async function loadAllStats() {
    try {
        loadVisitStats();
        await loadStoriesStats();
        loadDeviceStats();
        document.getElementById('lastUpdate').textContent =
            `обновлено ${new Date().toLocaleTimeString('ru-RU')}`;
    } catch (e) {
        console.error('[Админ] Ошибка загрузки статистики:', e);
    }
}

/** Статистика посещений */
function loadVisitStats() {
    try {
        const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}');

        document.getElementById('onlineNow').textContent = calculateOnline();
        document.getElementById('todayVisits').textContent = stats.today || 0;
        document.getElementById('yesterdayVisits').textContent = stats.yesterday || 0;
        document.getElementById('totalVisits').textContent = stats.visits || 0;
    } catch (e) {
        console.warn('[Админ] Ошибка статистики посещений:', e);
    }
}

/** Подсчёт онлайн (кто заходил за последние 15 минут) */
function calculateOnline() {
    try {
        const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}');
        const visits = stats.visitHistory || [];
        const now = Date.now();
        const fifteenMinAgo = now - 15 * 60 * 1000;

        const onlineVisitors = new Set();
        visits.forEach(visit => {
            if (visit.time > fifteenMinAgo) {
                onlineVisitors.add(visit.id);
            }
        });

        return onlineVisitors.size || 0;
    } catch (e) {
        return 0;
    }
}

/** Статистика по историям */
async function loadStoriesStats() {
    try {
        const stories = await getAllStories();

        document.getElementById('storiesCount').textContent = stories.length;

        let totalMessages = 0;
        let totalChars = 0;
        let maxMessages = 0;
        let popularStory = '—';

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
        });

        document.getElementById('totalMessages').textContent = totalMessages;
        document.getElementById('totalChars').textContent = totalChars.toLocaleString('ru-RU');
        document.getElementById('popularStory').textContent = popularStory;
    } catch (e) {
        console.error('[Админ] Ошибка статистики историй:', e);
    }
}

/** Статистика устройств и браузеров */
function loadDeviceStats() {
    try {
        const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}');
        const visits = stats.visitHistory || [];

        const devices = { mobile: 0, tablet: 0, desktop: 0 };
        const browsers = { chrome: 0, firefox: 0, safari: 0, edge: 0, opera: 0, other: 0 };

        visits.forEach(visit => {
            devices[visit.device === 'mobile' ? 'mobile' : visit.device === 'tablet' ? 'tablet' : 'desktop']++;
            browsers[visit.browser && browsers.hasOwnProperty(visit.browser) ? visit.browser : 'other']++;
        });

        const total = visits.length || 1;

        document.getElementById('mobilePct').textContent = Math.round((devices.mobile / total) * 100) + '%';
        document.getElementById('tabletPct').textContent = Math.round((devices.tablet / total) * 100) + '%';
        document.getElementById('desktopPct').textContent = Math.round((devices.desktop / total) * 100) + '%';

        document.getElementById('chromePct').textContent = Math.round((browsers.chrome / total) * 100) + '%';
        document.getElementById('firefoxPct').textContent = Math.round((browsers.firefox / total) * 100) + '%';
        document.getElementById('safariPct').textContent = Math.round((browsers.safari / total) * 100) + '%';
        document.getElementById('edgePct').textContent = Math.round((browsers.edge / total) * 100) + '%';
        document.getElementById('operaPct').textContent = Math.round((browsers.opera / total) * 100) + '%';
        document.getElementById('otherPct').textContent = Math.round((browsers.other / total) * 100) + '%';
    } catch (e) {
        console.warn('[Админ] Ошибка статистики устройств:', e);
    }
}

/** Загрузка списка локальных историй */
function loadLocalStoriesList() {
    const container = document.getElementById('localStoriesList');
    if (!container) return;

    try {
        const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');

        if (localStories.length === 0) {
            container.innerHTML = '<div class="local-stories-empty">📭 Нет локальных историй</div>';
            return;
        }

        container.innerHTML = '';

        localStories.forEach((story, index) => {
            const storyEl = document.createElement('div');
            storyEl.className = 'local-story-item';

            const date = new Date(story.createdAt).toLocaleDateString('ru-RU');
            const scenesCount = Object.keys(story.scenes || {}).length;

            storyEl.innerHTML = `
                <div class="local-story-info">
                    <div class="local-story-title">${escapeHtml(story.title)}</div>
                    <div class="local-story-meta">
                        <span>📅 ${date}</span>
                        <span>🎬 ${scenesCount} ${pluralize(scenesCount, 'сцена', 'сцены', 'сцен')}</span>
                    </div>
                </div>
                <button class="local-story-delete" data-index="${index}" aria-label="Удалить историю">🗑️ Удалить</button>
            `;

            container.appendChild(storyEl);
        });

        // Обработчики удаления
        container.querySelectorAll('.local-story-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteLocalStory(parseInt(btn.dataset.index));
            });
        });
    } catch (e) {
        container.innerHTML = '<div class="local-stories-empty">⚠️ Ошибка загрузки списка</div>';
    }
}

/** Удаление локальной истории */
function deleteLocalStory(index) {
    try {
        const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
        if (index < 0 || index >= localStories.length) return;

        const storyTitle = localStories[index]?.title || 'История';

        if (!confirm(`Удалить «${storyTitle}»? Это действие нельзя отменить.`)) return;

        localStories.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.LOCAL_STORIES, JSON.stringify(localStories));

        showNotification(`🗑️ «${storyTitle}» удалена`);
        loadLocalStoriesList();
        loadAllStats();
    } catch (e) {
        showNotification('❌ Ошибка при удалении', 'error');
    }
}

/** Настройка загрузки файлов */
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('uploadPreview');
    const confirmBtn = document.getElementById('confirmUpload');
    const cancelBtn = document.getElementById('cancelUpload');

    if (!uploadArea || !fileInput) return;

    let pendingStory = null;

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
            showNotification('❌ Только .txt файлы!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                pendingStory = parseStory(e.target.result, file.name);

                const nameEl = document.getElementById('previewName');
                const sizeEl = document.getElementById('previewSize');
                if (nameEl) nameEl.textContent = file.name;
                if (sizeEl) sizeEl.textContent = (file.size / 1024).toFixed(1) + ' КБ';

                preview.style.display = 'block';
            } catch (err) {
                showNotification('❌ Ошибка при разборе файла', 'error');
                console.error(err);
            }
        };
        reader.onerror = () => showNotification('❌ Ошибка чтения файла', 'error');
        reader.readAsText(file);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (pendingStory) {
                try {
                    saveLocalStory(pendingStory);
                    showNotification(`✅ «${pendingStory.title}» сохранена!`);
                    preview.style.display = 'none';
                    pendingStory = null;
                    fileInput.value = '';
                    loadAllStats();
                    loadLocalStoriesList();
                } catch (e) {
                    showNotification('❌ ' + e.message, 'error');
                }
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            pendingStory = null;
            preview.style.display = 'none';
            fileInput.value = '';
        });
    }
}

/** Настройка кнопок */
function setupButtons() {
    const resetBtn = document.getElementById('resetStats');
    const exportBtn = document.getElementById('exportStats');
    const refreshBtn = document.getElementById('refreshLocalList');

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Сбросить всю статистику посещений?')) {
                try {
                    const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}');
                    stats.visits = 0;
                    stats.today = 0;
                    stats.yesterday = 0;
                    stats.visitHistory = [];
                    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
                    loadAllStats();
                    showNotification('📊 Статистика сброшена');
                } catch (e) {
                    showNotification('❌ Ошибка сброса', 'error');
                }
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                const stats = {
                    visits: JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{}'),
                    stories: {
                        local: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]').length
                    },
                    exported: new Date().toISOString()
                };

                const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `suzhet-stats-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showNotification('📥 Экспорт завершён');
            } catch (e) {
                showNotification('❌ Ошибка экспорта', 'error');
            }
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadLocalStoriesList();
            loadAllStats();
            showNotification('🔄 Список обновлён');
        });
    }
}

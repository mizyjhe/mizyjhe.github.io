/**
 * Сюжет — Мои истории
 */

const EDITOR_CODES = ['сюжет', 'admin', 'супер', 'ред'];

document.addEventListener('DOMContentLoaded', () => {
    loadUserStories();
    setupFileUpload();
    setupInstructionToggle();
    setupEventListeners();
    setupTemplateDownload();
});

/** Загрузка и отображение локальных историй */
function loadUserStories() {
    const container = document.getElementById('storiesList');
    const countElement = document.getElementById('storiesCount');

    if (!container || !countElement) return;

    try {
        const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
        countElement.textContent = `📊 Всего: ${localStories.length}`;

        if (localStories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📭</div>
                    <div class="empty-state__title">У тебя пока нет локальных историй</div>
                    <div class="empty-state__text">Загрузи .txt файл или создай историю в редакторе</div>
                    <button class="empty-state__button" id="focusUploadBtn">📂 Загрузить историю</button>
                </div>
            `;

            document.getElementById('focusUploadBtn')?.addEventListener('click', () => {
                document.getElementById('uploadArea')?.scrollIntoView({ behavior: 'smooth' });
            });

            return;
        }

        container.innerHTML = '';
        localStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        localStories.forEach((story, index) => {
            container.appendChild(createStoryElement(story, index));
        });
    } catch (e) {
        container.innerHTML = '<div class="empty-state">⚠️ Ошибка загрузки историй</div>';
        console.error(e);
    }
}

/** Создание элемента истории */
function createStoryElement(story, index) {
    const div = document.createElement('div');
    div.className = 'story-item';
    div.dataset.index = index;

    const date = new Date(story.createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const scenesCount = Object.keys(story.scenes || {}).length;
    const messagesCount = countMessages(story);

    div.innerHTML = `
        <div class="story-info">
            <div class="story-title">${escapeHtml(story.title)}</div>
            <div class="story-meta">
                <span>📅 ${date}</span>
                <span>🎬 ${scenesCount} ${pluralize(scenesCount, 'сцена', 'сцены', 'сцен')}</span>
                <span>💬 ${messagesCount} ${pluralize(messagesCount, 'сообщение', 'сообщения', 'сообщений')}</span>
            </div>
        </div>
        <div class="story-actions">
            <button class="story-button story-button--read" onclick="readStory(${index})">📖 Читать</button>
            <button class="story-button story-button--delete" onclick="deleteUserStory(${index})">🗑️ Удалить</button>
        </div>
    `;

    return div;
}

/** Подсчёт сообщений */
function countMessages(story) {
    let total = 0;
    Object.values(story.scenes || {}).forEach(scene => {
        total += scene.messages?.length || 0;
    });
    return total;
}

/** Чтение истории */
window.readStory = (index) => {
    try {
        const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
        const story = localStories[index];

        if (story) {
            sessionStorage.setItem('currentStory', JSON.stringify(story));
            window.location.href = 'story.html';
        }
    } catch (e) {
        showNotification('❌ Ошибка открытия истории', 'error');
    }
};

/** Удаление истории */
window.deleteUserStory = (index) => {
    const storyElement = document.querySelector(`.story-item[data-index="${index}"]`);

    if (!confirm('🗑️ Точно удалить эту историю? Это действие нельзя отменить.')) return;

    try {
        const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
        const storyTitle = localStories[index]?.title || 'История';

        if (storyElement) storyElement.classList.add('deleting');

        setTimeout(() => {
            localStories.splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.LOCAL_STORIES, JSON.stringify(localStories));
            showNotification(`🗑️ «${storyTitle}» удалена`);
            loadUserStories();
        }, 300);
    } catch (e) {
        showNotification('❌ Ошибка удаления', 'error');
    }
};

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
            showNotification('❌ Пожалуйста, загрузите файл в формате .txt', 'error');
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
            } catch (error) {
                showNotification('❌ Ошибка при разборе файла. Проверьте формат.', 'error');
                console.error(error);
            }
        };
        reader.onerror = () => showNotification('❌ Ошибка чтения файла', 'error');
        reader.readAsText(file);
    }

    confirmBtn?.addEventListener('click', () => {
        if (pendingStory) {
            try {
                saveLocalStory(pendingStory);
                showNotification(`✅ «${pendingStory.title}» загружена!`);
                preview.style.display = 'none';
                pendingStory = null;
                fileInput.value = '';
                loadUserStories();
            } catch (e) {
                showNotification('❌ ' + e.message, 'error');
            }
        }
    });

    cancelBtn?.addEventListener('click', () => {
        pendingStory = null;
        preview.style.display = 'none';
        fileInput.value = '';
    });
}

/** Настройка сворачивания инструкции */
function setupInstructionToggle() {
    const toggle = document.getElementById('toggleInstruction');
    const content = document.getElementById('instructionContent');

    if (!toggle || !content) return;

    let isOpen = true;

    toggle.addEventListener('click', () => {
        if (isOpen) {
            content.style.display = 'none';
            toggle.textContent = '▶';
            toggle.setAttribute('aria-label', 'Развернуть');
        } else {
            content.style.display = 'block';
            toggle.textContent = '▼';
            toggle.setAttribute('aria-label', 'Свернуть');
        }
        isOpen = !isOpen;
    });
}

/** Скачивание шаблона */
function setupTemplateDownload() {
    const downloadLink = document.getElementById('downloadTemplate');

    downloadLink?.addEventListener('click', (e) => {
        e.preventDefault();

        const template = `НАЗВАНИЕ: Моя история
ЖАНР: Драма
ПЕРСОНАЖ: Герой
ПЕРСОНАЖ: Собеседник

==
1
СИСТЕМА: Начало истории...
ГЕРОЙ: Привет!
[2] Ответить
[3] Промолчать

==
2
СОБЕСЕДНИК: Рад тебя видеть!
[4] Пойти гулять
[5] Пойти домой

==
3
СИСТЕМА: Ты молчишь. Неловко...
КОНЕЦ

==
4
СИСТЕМА: Вы идёте гулять
КОНЕЦ

==
5
СИСТЕМА: Ты идёшь домой
КОНЕЦ`;

        const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shablon-istorii.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        showNotification('📥 Шаблон скачан');
    });
}

/** Обновление списка и редактор */
function setupEventListeners() {
    const editorBtn = document.getElementById('goToEditorBtn');
    const refreshBtn = document.getElementById('refreshList');

    editorBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const code = prompt('🔐 Введите код доступа к редактору:');
        if (EDITOR_CODES.includes(code?.toLowerCase()?.trim())) {
            window.location.href = 'editor.html';
        } else if (code) {
            showNotification('❌ Неверный код', 'error');
        }
    });

    refreshBtn?.addEventListener('click', () => {
        loadUserStories();
        showNotification('🔄 Список обновлён');
    });

    // Секретный вход через логотип
    const logo = document.getElementById('secretLogo');
    if (logo) {
        let clickCount = 0;
        let timer = null;
        logo.addEventListener('click', () => {
            clickCount++;
            if (timer) clearTimeout(timer);
            if (clickCount >= 5) {
                const code = prompt('🔐 Код доступа:');
                if (code?.toLowerCase()?.trim() === 'сюжет' || code?.toLowerCase()?.trim() === 'admin') {
                    window.location.href = 'admin.html';
                } else if (code) {
                    showNotification('❌ Неверный код', 'error');
                }
                clickCount = 0;
            }
            timer = setTimeout(() => clickCount = 0, 3000);
        });
    }
}        else if (currentScene && line.includes(':')) {
            const colonIndex = line.indexOf(':');
            const character = line.substring(0, colonIndex).trim();
            const message = line.substring(colonIndex + 1).trim();
            if (character && message) {
                currentScene.messages.push({ character, text: message });
            }
        }
        else if (currentScene && line.match(/^\[\d+\]/)) {
            const match = line.match(/^\[(\d+)\]\s*(.+)/);
            if (match) {
                currentScene.options.push({
                    text: match[2].trim(),
                    nextScene: match[1]
                });
            }
        }
        else if (line === 'КОНЕЦ' && currentScene) {
            currentScene.isEnd = true;
        }
    }
    return story;
}

// Загрузка встроенных историй из папки /stories (динамически)
// Загрузка встроенных историй из папки /stories (динамически)
async function loadBuiltInStories() {
    const stories = [];
    
    // ===== ВАЖНО: Добавляй сюда новые файлы =====
    const storyFiles = [
        '1.txt',
        '2.txt', 
        '3.txt',
        'Тень над Титаном.txt'  // ← твой новый файл
    ];
    // ============================================
    
    for (const file of storyFiles) {
        try {
            const response = await fetch(`stories/${file}`);
            if (response.ok) {
                const text = await response.text();
                const story = parseStory(text, file);
                story.builtIn = true;
                stories.push(story);
            }
        } catch (e) {
            console.log(`Не удалось загрузить ${file}`);
        }
    }
    
    return stories;
}

function saveLocalStory(story) {
    const stories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
    stories.push(story);
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORIES, JSON.stringify(stories));
    return story;
}

async function getAllStories() {
    const builtIn = await loadBuiltInStories();
    const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
    return [...builtIn, ...local];
}

function saveProgress(storyId, sceneId) {
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORY_PROGRESS) || '{}');
    progress[storyId] = sceneId;
    localStorage.setItem(STORAGE_KEYS.STORY_PROGRESS, JSON.stringify(progress));
}

function getProgress(storyId) {
    const progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORY_PROGRESS) || '{}');
    return progress[storyId] || '1';
}



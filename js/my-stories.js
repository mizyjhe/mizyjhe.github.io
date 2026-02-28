// my-stories.js — полная версия с загрузкой файлов

document.addEventListener('DOMContentLoaded', () => {
    loadUserStories();
    setupFileUpload();
    setupInstructionToggle();
    setupEventListeners();
    setupTemplateDownload();
});

// Загрузка и отображение локальных историй
function loadUserStories() {
    const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
    const container = document.getElementById('storiesList');
    const countElement = document.getElementById('storiesCount');
    
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
            document.getElementById('uploadArea').scrollIntoView({ behavior: 'smooth' });
        });
        
        return;
    }
    
    container.innerHTML = '';
    
    localStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    localStories.forEach((story, index) => {
        const storyEl = createStoryElement(story, index);
        container.appendChild(storyEl);
    });
}

// Создание элемента истории
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

// Подсчёт сообщений
function countMessages(story) {
    let total = 0;
    Object.values(story.scenes || {}).forEach(scene => {
        total += scene.messages?.length || 0;
    });
    return total;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Плюрализация
function pluralize(count, one, few, many) {
    if (count % 10 === 1 && count % 100 !== 11) return one;
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return few;
    return many;
}

// Чтение истории
window.readStory = (index) => {
    const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
    const story = localStories[index];
    
    if (story) {
        sessionStorage.setItem('currentStory', JSON.stringify(story));
        window.location.href = 'story.html';
    }
};

// Удаление истории
window.deleteUserStory = (index) => {
    const storyElement = document.querySelector(`.story-item[data-index="${index}"]`);
    
    if (storyElement) {
        storyElement.classList.add('deleting');
    }
    
    setTimeout(() => {
        if (confirm('🗑️ Точно удалить эту историю? Это действие нельзя отменить.')) {
            const localStories = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_STORIES) || '[]');
            const storyTitle = localStories[index]?.title || 'История';
            
            localStories.splice(index, 1);
            localStorage.setItem(STORAGE_KEYS.LOCAL_STORIES, JSON.stringify(localStories));
            
            showNotification(`"${storyTitle}" удалена`);
            loadUserStories();
        } else {
            if (storyElement) {
                storyElement.classList.remove('deleting');
            }
        }
    }, 150);
};

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
            alert('❌ Пожалуйста, загрузите файл в формате .txt');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const story = parseStory(e.target.result, file.name);
                
                // Показываем превью
                document.querySelector('.upload-preview__name').textContent = file.name;
                document.querySelector('.upload-preview__size').textContent = 
                    (file.size / 1024).toFixed(1) + ' КБ';
                preview.style.display = 'block';
                
                // Сохраняем для подтверждения
                window.pendingStory = story;
                
            } catch (error) {
                alert('❌ Ошибка при разборе файла. Проверьте формат.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    
    confirmBtn.addEventListener('click', () => {
        if (window.pendingStory) {
            saveLocalStory(window.pendingStory);
            showNotification(`✅ "${window.pendingStory.title}" загружена!`);
            preview.style.display = 'none';
            window.pendingStory = null;
            fileInput.value = ''; // Сброс
            loadUserStories();
        }
    });
}

// Настройка сворачивания инструкции
function setupInstructionToggle() {
    const toggle = document.getElementById('toggleInstruction');
    const content = document.getElementById('instructionContent');
    
    if (!toggle || !content) return;
    
    let isOpen = true;
    
    toggle.addEventListener('click', () => {
        if (isOpen) {
            content.style.display = 'none';
            toggle.textContent = '▶';
        } else {
            content.style.display = 'block';
            toggle.textContent = '▼';
        }
        isOpen = !isOpen;
    });
}

// Скачивание шаблона
function setupTemplateDownload() {
    const downloadLink = document.getElementById('downloadTemplate');
    
    if (downloadLink) {
        downloadLink.addEventListener('click', (e) => {
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

            const blob = new Blob([template], {type: 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'shablon-istorii.txt';
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('📥 Шаблон скачан');
        });
    }
}

// Уведомление
function showNotification(message) {
    // Просто alert пока что, можно потом заменить на красивый попап
    alert(message);
}

// Обновление списка
function setupEventListeners() {
    const editorBtn = document.getElementById('goToEditorBtn');
    if (editorBtn) {
        editorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Секретный код (как в админку)
            const code = prompt('🔐 Введите код доступа к редактору:');
            if (code === 'сюжет' || code === 'admin' || code === 'ред') {
                window.location.href = 'editor.html';
            } else if (code) {
                alert('❌ Неверный код');
            }
        });
    }
    
    // Секретный вход
    const logo = document.getElementById('secretLogo');
    if (logo) {
        let clickCount = 0;
        logo.addEventListener('click', () => {
            clickCount++;
            if (clickCount >= 5) {
                const code = prompt('🔐 Код доступа:');
                if (code === 'сюжет' || code === 'admin') {
                    window.location.href = 'admin.html';
                }
                clickCount = 0;
            }
            setTimeout(() => clickCount = 0, 3000);
        });
    }
}

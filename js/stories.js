const STORAGE_KEYS = {
    LOCAL_STORIES: 'suzhet_local_stories',
    STORY_PROGRESS: 'suzhet_progress',
    STATS: 'suzhet_stats'
};

function parseStory(text, filename) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    let story = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        title: 'Без названия',
        author: 'local',
        filename: filename,
        scenes: {},
        currentScene: '1',
        createdAt: new Date().toISOString()
    };
    
    let currentScene = null;
    let sceneId = '1';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('НАЗВАНИЕ:')) {
            story.title = line.replace('НАЗВАНИЕ:', '').trim();
        }
        else if (line === '==') {
            if (i + 1 < lines.length) {
                sceneId = lines[i + 1].trim();
                currentScene = { id: sceneId, messages: [], options: [] };
                story.scenes[sceneId] = currentScene;
                i++;
            }
        }
        else if (currentScene && line.includes(':')) {
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
    
    try {
        // Пытаемся получить список файлов через GitHub API (если сайт на GitHub Pages)
        // Или через простой запрос к папке (но это не всегда работает)
        
        // Способ 1: Пробуем получить через fetch список файлов (если есть index.json)
        try {
            const response = await fetch('stories/index.json');
            if (response.ok) {
                const fileList = await response.json();
                for (const file of fileList) {
                    if (file.endsWith('.txt')) {
                        const storyResponse = await fetch(`stories/${file}`);
                        const text = await storyResponse.text();
                        const story = parseStory(text, file);
                        story.builtIn = true;
                        stories.push(story);
                    }
                }
                return stories;
            }
        } catch (e) {
            console.log('Нет index.json, пробуем стандартные имена');
        }
        
        // Способ 2: Пробуем стандартные имена (1.txt, 2.txt, 3.txt)
        const defaultFiles = ['1.txt', '2.txt', '3.txt', '4.txt', '5.txt'];
        for (const file of defaultFiles) {
            try {
                const response = await fetch(`stories/${file}`);
                if (response.ok) {
                    const text = await response.text();
                    const story = parseStory(text, file);
                    story.builtIn = true;
                    stories.push(story);
                }
            } catch (e) {
                // Файла нет - пропускаем
            }
        }
        
        // Способ 3: Пробуем получить список файлов через .htaccess или директорию (не всегда работает)
        // Этот способ может не работать на GitHub Pages
        try {
            const response = await fetch('stories/');
            // Это редко работает, но пробуем
        } catch (e) {}
        
    } catch (error) {
        console.error('Ошибка загрузки встроенных историй:', error);
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


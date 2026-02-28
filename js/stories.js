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

async function loadBuiltInStories() {
    const stories = [];
    const storyFiles = ['1.txt', '2.txt', '3.txt'];
    
    for (const file of storyFiles) {
        try {
            const response = await fetch(`stories/${file}`);
            const text = await response.text();
            const story = parseStory(text, file);
            story.builtIn = true;
            stories.push(story);
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

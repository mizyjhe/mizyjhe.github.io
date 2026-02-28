let currentStory = null;
let currentSceneId = '1';

document.addEventListener('DOMContentLoaded', () => {
    const storyJson = sessionStorage.getItem('currentStory');
    if (!storyJson) {
        window.location.href = 'index.html';
        return;
    }
    
    currentStory = JSON.parse(storyJson);
    document.getElementById('storyTitle').textContent = currentStory.title;
    currentSceneId = getProgress(currentStory.id) || '1';
    showScene(currentSceneId);
});

function showScene(sceneId) {
    const scene = currentStory.scenes[sceneId];
    if (!scene) return;
    
    currentSceneId = sceneId;
    saveProgress(currentStory.id, sceneId);
    
    const container = document.getElementById('chatContainer');
    container.innerHTML = '';
    
    scene.messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.innerHTML = `
            <div class="message__sender">${msg.character}</div>
            <div class="message__bubble">${msg.text}</div>
        `;
        container.appendChild(messageEl);
    });
    
    if (scene.options && scene.options.length > 0) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
        
        scene.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-button';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => showScene(opt.nextScene));
            optionsDiv.appendChild(btn);
        });
        
        container.appendChild(optionsDiv);
    } else if (scene.isEnd) {
        const endDiv = document.createElement('div');
        endDiv.className = 'options';
        endDiv.innerHTML = `
            <button class="option-button" onclick="window.location.href='index.html'">🔙 На главную</button>
            <button class="option-button" onclick="showScene('1')">🔄 Начать заново</button>
        `;
        container.appendChild(endDiv);
    }
    
    updateProgress();
    container.scrollTop = container.scrollHeight;
}

function updateProgress() {
    const scenes = Object.keys(currentStory.scenes || {});
    const currentIndex = scenes.indexOf(currentSceneId);
    const progress = ((currentIndex + 1) / scenes.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}
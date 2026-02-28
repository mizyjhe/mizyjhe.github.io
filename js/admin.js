let editorState = {
    id: 'editor_' + Date.now(),
    title: '',
    genre: 'Мистика',
    characters: [
        { id: 'char1', name: 'Система', avatar: '🤖' },
        { id: 'char2', name: 'Игрок', avatar: '👤' }
    ],
    scenes: {
        '1': {
            id: '1',
            messages: [{ character: 'Система', text: 'Ты начинаешь историю...' }],
            options: [{ text: 'Начать', nextScene: '2' }]
        }
    },
    nextSceneId: 2
};

document.addEventListener('DOMContentLoaded', () => {
    renderCharacters();
    renderScenes();
    setupEventListeners();
});

function renderCharacters() {
    const container = document.getElementById('charactersList');
    container.innerHTML = '';
    
    editorState.characters.forEach((char, index) => {
        const charEl = document.createElement('div');
        charEl.className = 'character-item';
        charEl.innerHTML = `
            <div class="character-avatar">${char.avatar}</div>
            <div class="character-info">
                <div class="character-name">${char.name}</div>
                <div class="character-avatar-url">${char.avatar}</div>
            </div>
            ${index > 1 ? '<span class="character-remove" data-id="' + char.id + '">✕</span>' : ''}
        `;
        
        if (index > 1) {
            charEl.querySelector('.character-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeCharacter(char.id);
            });
        }
        
        container.appendChild(charEl);
    });
}

function renderScenes() {
    const container = document.getElementById('scenesContainer');
    container.innerHTML = '';
    
    Object.values(editorState.scenes)
        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
        .forEach(scene => container.appendChild(createSceneElement(scene)));
}

function createSceneElement(scene) {
    const div = document.createElement('div');
    div.className = 'scene-card';
    div.dataset.sceneId = scene.id;
    
    let html = `
        <div class="scene-header">
            <span class="scene-id">Сцена ${scene.id}</span>
            <div class="scene-actions">
                <span class="scene-action" onclick="duplicateScene('${scene.id}')">📋</span>
                ${Object.keys(editorState.scenes).length > 1 ? 
                    `<span class="scene-action" onclick="deleteScene('${scene.id}')">🗑️</span>` : ''}
            </div>
        </div>
        <div class="scene-messages">
    `;
    
    scene.messages.forEach((msg, idx) => {
        html += `
            <div class="scene-message">
                <select class="message-character" data-scene="${scene.id}" data-msg="${idx}">
                    ${editorState.characters.map(c => 
                        `<option value="${c.name}" ${c.name === msg.character ? 'selected' : ''}>${c.name}</option>`
                    ).join('')}
                </select>
                <input type="text" class="message-text" value="${msg.text}" 
                       data-scene="${scene.id}" data-msg="${idx}" placeholder="Текст сообщения">
            </div>
        `;
    });
    
    html += '</div>';
    html += `<button class="scene-add-message" onclick="addMessage('${scene.id}')">+ Добавить сообщение</button>`;
    
    html += '<div class="scene-options">';
    scene.options.forEach((opt, idx) => {
        html += `
            <div class="scene-option">
                <input type="text" class="option-text" value="${opt.text}" 
                       data-scene="${scene.id}" data-opt="${idx}" placeholder="Текст варианта">
                <input type="text" class="option-next" value="${opt.nextScene}" 
                       data-scene="${scene.id}" data-opt-next="${idx}" placeholder="Сцена">
                <span class="scene-action" onclick="removeOption('${scene.id}', ${idx})">✕</span>
            </div>
        `;
    });
    html += '</div>';
    
    html += `<button class="scene-add-option" onclick="addOption('${scene.id}')">+ Добавить вариант</button>`;
    
    div.innerHTML = html;
    
    setTimeout(() => {
        div.querySelectorAll('.message-character').forEach(select => {
            select.addEventListener('change', (e) => {
                const sceneId = e.target.dataset.scene;
                const msgIdx = e.target.dataset.msg;
                editorState.scenes[sceneId].messages[msgIdx].character = e.target.value;
            });
        });
        
        div.querySelectorAll('.message-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const sceneId = e.target.dataset.scene;
                const msgIdx = e.target.dataset.msg;
                editorState.scenes[sceneId].messages[msgIdx].text = e.target.value;
            });
        });
        
        div.querySelectorAll('.option-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const sceneId = e.target.dataset.scene;
                const optIdx = e.target.dataset.opt;
                editorState.scenes[sceneId].options[optIdx].text = e.target.value;
            });
        });
        
        div.querySelectorAll('.option-next').forEach(input => {
            input.addEventListener('input', (e) => {
                const sceneId = e.target.dataset.scene;
                const optIdx = e.target.dataset.optNext;
                editorState.scenes[sceneId].options[optIdx].nextScene = e.target.value;
            });
        });
    }, 0);
    
    return div;
}

document.getElementById('addCharacterBtn').addEventListener('click', () => {
    const name = prompt('Имя персонажа:');
    if (!name) return;
    const avatar = prompt('Эмодзи или ссылка на аватар:', '👤');
    
    editorState.characters.push({
        id: 'char_' + Date.now(),
        name: name,
        avatar: avatar || '👤'
    });
    
    renderCharacters();
    renderScenes();
});

function removeCharacter(charId) {
    editorState.characters = editorState.characters.filter(c => c.id !== charId);
    renderCharacters();
    renderScenes();
}

document.getElementById('addSceneBtn').addEventListener('click', () => {
    const newId = String(editorState.nextSceneId++);
    editorState.scenes[newId] = {
        id: newId,
        messages: [{ character: editorState.characters[0].name, text: 'Новая сцена...' }],
        options: [{ text: 'Далее', nextScene: '1' }]
    };
    renderScenes();
});

window.duplicateScene = (sceneId) => {
    const original = editorState.scenes[sceneId];
    const newId = String(editorState.nextSceneId++);
    
    editorState.scenes[newId] = {
        ...original,
        id: newId,
        messages: original.messages.map(m => ({...m})),
        options: original.options.map(o => ({...o}))
    };
    
    renderScenes();
};

window.deleteScene = (sceneId) => {
    if (Object.keys(editorState.scenes).length <= 1) {
        alert('Должна остаться хотя бы одна сцена');
        return;
    }
    delete editorState.scenes[sceneId];
    renderScenes();
};

window.addMessage = (sceneId) => {
    editorState.scenes[sceneId].messages.push({
        character: editorState.characters[0].name,
        text: '...'
    });
    renderScenes();
};

window.addOption = (sceneId) => {
    editorState.scenes[sceneId].options.push({
        text: 'Новый вариант',
        nextScene: '1'
    });
    renderScenes();
};

window.removeOption = (sceneId, optIdx) => {
    editorState.scenes[sceneId].options.splice(optIdx, 1);
    renderScenes();
};

document.getElementById('exportStoryBtn').addEventListener('click', () => {
    const title = document.getElementById('storyTitle').value || 'Без названия';
    const genre = document.getElementById('storyGenre').value;
    
    let txt = `НАЗВАНИЕ: ${title}\nЖАНР: ${genre}\n`;
    editorState.characters.forEach(char => txt += `ПЕРСОНАЖ: ${char.name}\n`);
    txt += '\n';
    
    Object.values(editorState.scenes)
        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
        .forEach(scene => {
            txt += '==\n' + scene.id + '\n';
            scene.messages.forEach(msg => txt += `${msg.character}: ${msg.text}\n`);
            scene.options.forEach(opt => txt += `[${opt.nextScene}] ${opt.text}\n`);
            txt += '\n';
        });
    
    txt += 'КОНЕЦ';
    
    const blob = new Blob([txt], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase()}.txt`;
    a.click();
});

document.getElementById('saveLocalBtn').addEventListener('click', () => {
    const title = document.getElementById('storyTitle').value || 'Без названия';
    const genre = document.getElementById('storyGenre').value;
    
    const story = {
        id: 'local_' + Date.now(),
        title: title,
        genre: genre,
        author: 'local_editor',
        filename: title + '.txt',
        scenes: editorState.scenes,
        characters: editorState.characters,
        createdAt: new Date().toISOString(),
        builtIn: false
    };
    
    saveLocalStory(story);
    alert('История сохранена локально! Она появится на главной после перезагрузки.');
});

function setupEventListeners() {
    document.getElementById('storyTitle').addEventListener('input', (e) => {
        editorState.title = e.target.value;
    });
    
    document.getElementById('storyGenre').addEventListener('change', (e) => {
        editorState.genre = e.target.value;
    });
}

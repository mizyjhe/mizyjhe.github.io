/**
 * Сюжет — Редактор историй
 */

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
            options: [{ text: 'Начать', nextScene: '2' }],
            isEnd: false
        }
    },
    nextSceneId: 2
};

// Загрузка сохранённого состояния
try {
    const saved = localStorage.getItem(STORAGE_KEYS.EDITOR_STATE);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.scenes) editorState = parsed;
    }
} catch (e) {
    console.warn('[Редактор] Не удалось загрузить состояние:', e);
}

document.addEventListener('DOMContentLoaded', () => {
    // Заполняем поля
    const titleInput = document.getElementById('storyTitle');
    const genreSelect = document.getElementById('storyGenre');

    if (titleInput) titleInput.value = editorState.title || '';
    if (genreSelect) genreSelect.value = editorState.genre || 'Мистика';

    renderCharacters();
    renderScenes();
    setupEventListeners();
});

function renderCharacters() {
    const container = document.getElementById('charactersList');
    if (!container) return;
    container.innerHTML = '';

    editorState.characters.forEach((char, index) => {
        const charEl = document.createElement('div');
        charEl.className = 'character-item';
        charEl.innerHTML = `
            <div class="character-avatar">${char.avatar || '👤'}</div>
            <div class="character-info">
                <div class="character-name">${escapeHtml(char.name)}</div>
                <div class="character-avatar-url">${escapeHtml(char.avatar || '👤')}</div>
            </div>
            ${index > 1 ? `<span class="character-remove" data-id="${char.id}" role="button" aria-label="Удалить персонажа">✕</span>` : ''}
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
    if (!container) return;
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
            <span class="scene-id">Сцена ${escapeHtml(scene.id)}</span>
            <div class="scene-actions">
                <span class="scene-action" onclick="duplicateScene('${scene.id}')" role="button" title="Дублировать">📋</span>
                ${Object.keys(editorState.scenes).length > 1 ?
                    `<span class="scene-action" onclick="deleteScene('${scene.id}')" role="button" title="Удалить">🗑️</span>` : ''}
            </div>
        </div>
        <div class="scene-messages">
    `;

    scene.messages.forEach((msg, idx) => {
        html += `
            <div class="scene-message">
                <select class="message-character" data-scene="${scene.id}" data-msg="${idx}">
                    ${editorState.characters.map(c =>
                        `<option value="${escapeHtml(c.name)}" ${c.name === msg.character ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
                    ).join('')}
                </select>
                <input type="text" class="message-text" value="${escapeHtml(msg.text)}"
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
                <input type="text" class="option-text" value="${escapeHtml(opt.text)}"
                       data-scene="${scene.id}" data-opt="${idx}" placeholder="Текст варианта">
                <input type="text" class="option-next" value="${escapeHtml(opt.nextScene)}"
                       data-scene="${scene.id}" data-opt-next="${idx}" placeholder="Сцена">
                <span class="scene-action" onclick="removeOption('${scene.id}', ${idx})" role="button" title="Удалить вариант">✕</span>
            </div>
        `;
    });
    html += '</div>';

    html += `<button class="scene-add-option" onclick="addOption('${scene.id}')">+ Добавить вариант</button>`;

    // Чекбокс "Конец истории"
    html += `
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="end-${scene.id}" ${scene.isEnd ? 'checked' : ''} 
                   onchange="toggleEnd('${scene.id}')" style="cursor: pointer;">
            <label for="end-${scene.id}" style="cursor: pointer; color: var(--text-secondary); font-size: 0.9rem;">
                Это конец истории (КОНЕЦ)
            </label>
        </div>
    `;

    div.innerHTML = html;

    // Привязка обработчиков
    requestAnimationFrame(() => {
        div.querySelectorAll('.message-character').forEach(select => {
            select.addEventListener('change', (e) => {
                const sceneId = e.target.dataset.scene;
                const msgIdx = parseInt(e.target.dataset.msg);
                editorState.scenes[sceneId].messages[msgIdx].character = e.target.value;
                saveEditorState();
            });
        });

        div.querySelectorAll('.message-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const sceneId = e.target.dataset.scene;
                const msgIdx = parseInt(e.target.dataset.msg);
                editorState.scenes[sceneId].messages[msgIdx].text = e.target.value;
                saveEditorState();
            });
        });

        div.querySelectorAll('.option-text').forEach(input => {
            input.addEventListener('input', (e) => {
                const sceneId = e.target.dataset.scene;
                const optIdx = parseInt(e.target.dataset.opt);
                editorState.scenes[sceneId].options[optIdx].text = e.target.value;
                saveEditorState();
            });
        });

        div.querySelectorAll('.option-next').forEach(input => {
            input.addEventListener('input', (e) => {
                const sceneId = e.target.dataset.scene;
                const optIdx = parseInt(e.target.dataset.optNext);
                editorState.scenes[sceneId].options[optIdx].nextScene = e.target.value;
                saveEditorState();
            });
        });
    });

    return div;
}

window.toggleEnd = (sceneId) => {
    editorState.scenes[sceneId].isEnd = !editorState.scenes[sceneId].isEnd;
    saveEditorState();
};

document.getElementById('addCharacterBtn')?.addEventListener('click', () => {
    const name = prompt('Имя персонажа:');
    if (!name || !name.trim()) return;
    const avatar = prompt('Эмодзи или ссылка на аватар:', '👤');

    editorState.characters.push({
        id: 'char_' + Date.now(),
        name: name.trim(),
        avatar: avatar?.trim() || '👤'
    });

    saveEditorState();
    renderCharacters();
    renderScenes();
});

function removeCharacter(charId) {
    if (editorState.characters.length <= 2) {
        showNotification('Нужно минимум 2 персонажа', 'error');
        return;
    }
    editorState.characters = editorState.characters.filter(c => c.id !== charId);
    saveEditorState();
    renderCharacters();
    renderScenes();
}

document.getElementById('addSceneBtn')?.addEventListener('click', () => {
    const newId = String(editorState.nextSceneId++);
    editorState.scenes[newId] = {
        id: newId,
        messages: [{ character: editorState.characters[0]?.name || 'Система', text: 'Новая сцена...' }],
        options: [],
        isEnd: false
    };
    saveEditorState();
    renderScenes();
});

window.duplicateScene = (sceneId) => {
    const original = editorState.scenes[sceneId];
    const newId = String(editorState.nextSceneId++);

    editorState.scenes[newId] = {
        id: newId,
        messages: original.messages.map(m => ({...m})),
        options: original.options.map(o => ({...o})),
        isEnd: original.isEnd
    };

    saveEditorState();
    renderScenes();
};

window.deleteScene = (sceneId) => {
    if (Object.keys(editorState.scenes).length <= 1) {
        showNotification('Должна остаться хотя бы одна сцена', 'error');
        return;
    }
    delete editorState.scenes[sceneId];
    saveEditorState();
    renderScenes();
};

window.addMessage = (sceneId) => {
    editorState.scenes[sceneId].messages.push({
        character: editorState.characters[0]?.name || 'Система',
        text: '...'
    });
    saveEditorState();
    renderScenes();
};

window.addOption = (sceneId) => {
    editorState.scenes[sceneId].options.push({
        text: 'Новый вариант',
        nextScene: '1'
    });
    saveEditorState();
    renderScenes();
};

window.removeOption = (sceneId, optIdx) => {
    editorState.scenes[sceneId].options.splice(optIdx, 1);
    saveEditorState();
    renderScenes();
};

document.getElementById('exportStoryBtn')?.addEventListener('click', () => {
    const title = document.getElementById('storyTitle')?.value?.trim() || 'Без названия';
    const genre = document.getElementById('storyGenre')?.value || 'Мистика';

    let txt = `НАЗВАНИЕ: ${title}\nЖАНР: ${genre}\n`;
    editorState.characters.forEach(char => {
        txt += `ПЕРСОНАЖ: ${char.name}\n`;
    });
    txt += '\n';

    Object.values(editorState.scenes)
        .sort((a, b) => parseInt(a.id) - parseInt(b.id))
        .forEach(scene => {
            txt += '==\n' + scene.id + '\n';
            scene.messages.forEach(msg => txt += `${msg.character}: ${msg.text}\n`);
            scene.options.forEach(opt => txt += `[${opt.nextScene}] ${opt.text}\n`);
            if (scene.isEnd) txt += 'КОНЕЦ\n';
            txt += '\n';
        });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zа-яё0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showNotification('💾 Файл скачан');
});

document.getElementById('saveLocalBtn')?.addEventListener('click', () => {
    const title = document.getElementById('storyTitle')?.value?.trim() || 'Без названия';
    const genre = document.getElementById('storyGenre')?.value || 'Мистика';

    if (!title || title.length < 2) {
        showNotification('❌ Введите название истории', 'error');
        return;
    }

    const story = {
        id: 'local_' + generateId(),
        title: title,
        genre: genre,
        author: 'local_editor',
        filename: title + '.txt',
        scenes: editorState.scenes,
        characters: editorState.characters,
        createdAt: new Date().toISOString(),
        builtIn: false
    };

    try {
        saveLocalStory(story);
        showNotification('✅ История сохранена локально!');
    } catch (e) {
        showNotification('❌ ' + e.message, 'error');
    }
});

function setupEventListeners() {
    document.getElementById('storyTitle')?.addEventListener('input', (e) => {
        editorState.title = e.target.value;
        saveEditorState();
    });

    document.getElementById('storyGenre')?.addEventListener('change', (e) => {
        editorState.genre = e.target.value;
        saveEditorState();
    });
}

function saveEditorState() {
    try {
        localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify(editorState));
    } catch (e) {
        console.warn('[Редактор] Не удалось сохранить состояние:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllStats();
    setupFileUpload();
    setupButtons();
    setInterval(loadAllStats, 10000);
});

async function loadAllStats() {
    loadVisitStats();
    await loadStoriesStats();
    document.getElementById('lastUpdate').textContent = `обновлено ${new Date().toLocaleTimeString()}`;
}

function loadVisitStats() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{}');
    document.getElementById('onlineNow').textContent = calculateOnline();
    document.getElementById('todayVisits').textContent = stats.today || 0;
    document.getElementById('yesterdayVisits').textContent = stats.yesterday || 0;
    document.getElementById('totalVisits').textContent = stats.visits || 0;
}

function calculateOnline() {
    const stats = JSON.parse(localStorage.getItem('suzhet_stats') || '{}');
    return (Date.now() - (stats.lastVisit || 0) < 15 * 60 * 1000) ? 1 : 0;
}

async function loadStoriesStats() {
    const stories = await getAllStories();
    document.getElementById('storiesCount').textContent = stories.length;
    
    let totalMessages = 0, totalChars = 0, maxMessages = 0;
    let popularStory = stories[0]?.title || '—';
    
    stories.forEach(story => {
        const scenes = Object.values(story.scenes || {});
        scenes.forEach(scene => {
            totalMessages += scene.messages?.length || 0;
            scene.messages?.forEach(m => totalChars += m.text?.length || 0);
        });
        if (scenes.length > maxMessages) {
            maxMessages = scenes.length;
            popularStory = story.title;
        }
    });
    
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('totalChars').textContent = totalChars.toLocaleString();
    document.getElementById('popularStory').textContent = popularStory;
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('uploadPreview');
    const confirmBtn = document.getElementById('confirmUpload');
    
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
            alert('Только .txt файлы!');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const story = parseStory(e.target.result, file.name);
            saveLocalStory(story);
            
            document.querySelector('.upload-preview__name').textContent = file.name;
            document.querySelector('.upload-preview__size').textContent = 
                (file.size / 1024).toFixed(1) + ' КБ';
            preview.style.display = 'block';
        };
        reader.readAsText(file);
    }
    
    confirmBtn.addEventListener('click', () => {
        alert('История сохранена локально!');
        preview.style.display = 'none';
        loadAllStats();
    });
}

function setupButtons() {
    document.getElementById('resetStats').addEventListener('click', () => {
        if (confirm('Сбросить всю статистику?')) {
            localStorage.removeItem('suzhet_stats');
            loadAllStats();
        }
    });
    
    document.getElementById('exportStats').addEventListener('click', () => {
        const stats = {
            visits: JSON.parse(localStorage.getItem('suzhet_stats') || '{}'),
            stories: JSON.parse(localStorage.getItem('suzhet_local_stories') || '[]').length,
            exported: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(stats, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `suzhet-stats-${Date.now()}.json`;
        a.click();
    });
}
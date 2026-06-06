console.log("Side panel script loaded.");

const listEl = document.getElementById('annotation-list');
const searchInput = document.getElementById('search');
const enableBtn = document.getElementById('enable-btn');
const enableStatus = document.getElementById('enable-status');
let allAnnotations = [];

function enableAnnotationsOnPage() {
    enableBtn.disabled = true;
    enableStatus.textContent = 'Enabling annotation mode…';

    chrome.runtime.sendMessage({ action: 'enableToolbarOnActiveTab' }, (response) => {
        enableBtn.disabled = false;
        if (response?.ok) {
            enableStatus.textContent = 'Annotation mode active. Close with × on the toolbar when done.';
        } else {
            enableStatus.textContent = response?.error || 'Could not enable. Try refreshing the page.';
        }
    });
}

enableBtn.addEventListener('click', enableAnnotationsOnPage);

const PREF_KEY = 'annotate_preferences';

const FONT_MAP = {
    serif: "'Times New Roman', Georgia, Garamond, serif",
    georgia: "Georgia, 'Times New Roman', serif",
    caveat: "'Caveat', cursive",
    dancing: "'Dancing Script', cursive",
    'great-vibes': "'Great Vibes', cursive",
    pacifico: "'Pacifico', cursive",
    satisfy: "'Satisfy', cursive",
    shadows: "'Shadows Into Light', cursive",
    indie: "'Indie Flower', cursive",
    sacramento: "'Sacramento', cursive",
    allura: "'Allura', cursive",
    homemade: "'Homemade Apple', cursive",
    parisienne: "'Parisienne', cursive",
    sans: 'Helvetica, Arial, sans-serif',
    mono: "'Courier New', Courier, monospace"
};

const FONT_LABELS = {
    serif: 'Times New Roman',
    georgia: 'Georgia',
    caveat: 'Caveat',
    dancing: 'Dancing Script',
    'great-vibes': 'Great Vibes',
    pacifico: 'Pacifico',
    satisfy: 'Satisfy',
    shadows: 'Shadows Into Light',
    indie: 'Indie Flower',
    sacramento: 'Sacramento',
    allura: 'Allura',
    homemade: 'Homemade Apple',
    parisienne: 'Parisienne',
    sans: 'Sans-serif',
    mono: 'Monospace'
};

const FONT_SIZE_MAP = {
    sm: '0.85rem',
    md: '1rem',
    lg: '1.15rem',
    xl: '1.35rem'
};

function applyStoredStyles(el, anno) {
    const data = anno.data || {};
    if (data.fontFamily && FONT_MAP[data.fontFamily]) {
        el.style.fontFamily = FONT_MAP[data.fontFamily];
    }
    if (data.fontSize && FONT_SIZE_MAP[data.fontSize]) {
        el.style.fontSize = FONT_SIZE_MAP[data.fontSize];
    }
    if (data.color && anno.type === 'margin') {
        el.style.color = data.color;
    }
    if (data.color && anno.type === 'sticky') {
        el.style.backgroundColor = data.color;
        el.style.padding = '6px 8px';
        el.style.borderRadius = '3px';
    }
    if (data.color && anno.type === 'highlight') {
        el.className = 'anno-text anno-highlight-preview';
        el.style.backgroundColor = data.color;
    }
}

function createMetaRow(anno) {
    const data = anno.data || {};
    const meta = document.createElement('div');
    meta.className = 'anno-meta';

    if (data.color) {
        const swatch = document.createElement('span');
        swatch.className = 'anno-color-swatch';
        swatch.style.backgroundColor = data.color;
        swatch.title = data.color;
        meta.appendChild(swatch);
    }
    if (data.fontFamily) {
        const fontLabel = document.createElement('span');
        fontLabel.className = 'anno-meta-label';
        fontLabel.textContent = FONT_LABELS[data.fontFamily] || data.fontFamily;
        meta.appendChild(fontLabel);
    }
    if (data.fontSize) {
        const sizeLabel = document.createElement('span');
        sizeLabel.className = 'anno-meta-label';
        sizeLabel.textContent = `Size ${data.fontSize.toUpperCase()}`;
        meta.appendChild(sizeLabel);
    }
    return meta.children.length ? meta : null;
}

function loadAnnotations() {
    chrome.storage.local.get(null, (items) => {
        allAnnotations = [];
        for (const [url, annotations] of Object.entries(items)) {
            if (url === PREF_KEY || !Array.isArray(annotations)) continue;
            annotations.forEach(anno => {
                if (!anno?.data?.id) return;
                allAnnotations.push({ ...anno, url });
            });
        }
        allAnnotations.sort((a, b) => b.timestamp - a.timestamp);
        renderAnnotations(allAnnotations);
    });
}

function renderAnnotations(annotations) {
    listEl.innerHTML = '';
    if (annotations.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No annotations found.</p>';
        return;
    }

    annotations.forEach(anno => {
        const item = document.createElement('div');
        item.className = 'annotation-item';

        const typeLabel = document.createElement('span');
        typeLabel.className = 'anno-type';
        typeLabel.textContent = anno.type;

        const content = document.createElement('div');
        content.className = (anno.type === 'margin' || anno.type === 'sticky') ? 'anno-content' : 'anno-text';
        content.textContent = anno.data.text || anno.data.content || 'Decorative element';
        applyStoredStyles(content, anno);

        const meta = createMetaRow(anno);

        const url = document.createElement('div');
        url.className = 'anno-url';
        url.textContent = anno.url;
        url.title = anno.url;

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Delete annotation';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            removeAnnotation(anno.url, anno.id);
        };
        item.appendChild(delBtn);

        item.appendChild(typeLabel);
        item.appendChild(content);
        if (meta) item.appendChild(meta);
        item.appendChild(url);

        // Add tagging UI
        const tagContainer = document.createElement('div');
        tagContainer.className = 'anno-tags';

        const tags = anno.tags || [];
        tags.forEach((tag, idx) => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'tag';
            tagSpan.textContent = tag;
            tagSpan.onclick = (e) => {
                e.stopPropagation();
                removeTag(anno, idx);
            };
            tagContainer.appendChild(tagSpan);
        });

        const addTagInput = document.createElement('input');
        addTagInput.className = 'add-tag-input';
        addTagInput.placeholder = '+ tag';
        addTagInput.onclick = (e) => e.stopPropagation();
        addTagInput.onkeydown = (e) => {
            if (e.key === 'Enter' && addTagInput.value.trim()) {
                addTag(anno, addTagInput.value.trim());
                addTagInput.value = '';
            }
        };
        tagContainer.appendChild(addTagInput);

        item.appendChild(tagContainer);

        item.onclick = () => {
            // Optional: open the tab or scroll to the annotation
            // For now, just log
            console.log("Clicked annotation:", anno);
        };

        listEl.appendChild(item);
    });
}

function addTag(anno, tag) {
    chrome.storage.local.get([anno.url], (result) => {
        let annotations = result[anno.url] || [];
        annotations = annotations.map(a => {
            if (a.id === anno.id || a.data?.id === anno.data?.id) {
                const tags = a.tags || [];
                if (!tags.includes(tag)) tags.push(tag);
                return { ...a, tags };
            }
            return a;
        });
        chrome.storage.local.set({ [anno.url]: annotations });
    });
}

function removeTag(anno, index) {
    chrome.storage.local.get([anno.url], (result) => {
        let annotations = result[anno.url] || [];
        annotations = annotations.map(a => {
            if (a.id === anno.id || a.data?.id === anno.data?.id) {
                const tags = a.tags || [];
                tags.splice(index, 1);
                return { ...a, tags };
            }
            return a;
        });
        chrome.storage.local.set({ [anno.url]: annotations });
    });
}

searchInput.oninput = () => {

    const query = searchInput.value.toLowerCase();
    const filtered = allAnnotations.filter(anno => {
        const text = (anno.data.text || anno.data.content || '').toLowerCase();
        const tags = (anno.tags || []).join(' ').toLowerCase();
        const url = anno.url.toLowerCase();
        return text.includes(query) || tags.includes(query) || url.includes(query);
    });
    renderAnnotations(filtered);
};
function removeAnnotation(url, id) {
    if (!confirm('Are you sure you want to delete this annotation?')) return;
    chrome.storage.local.get([url], (result) => {
        let annotations = result[url] || [];
        annotations = annotations.filter(a => a.id !== id && a.data?.id !== id);
        chrome.storage.local.set({ [url]: annotations });
    });
}

// Listen for storage changes to refresh the list
chrome.storage.onChanged.addListener(() => {
    loadAnnotations();
});

loadAnnotations();


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

function loadAnnotations() {
    chrome.storage.local.get(null, (items) => {
        allAnnotations = [];
        for (const [url, annotations] of Object.entries(items)) {
            if (Array.isArray(annotations)) {
                annotations.forEach(anno => {
                    allAnnotations.push({ ...anno, url });
                });
            }
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
        content.className = anno.type === 'margin' ? 'anno-content' : 'anno-text';
        content.textContent = anno.data.text || anno.data.content || 'Decorative element';

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
            if (a.id === anno.id) {
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
            if (a.id === anno.id) {
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
        annotations = annotations.filter(a => a.id !== id);
        chrome.storage.local.set({ [url]: annotations });
    });
}

// Listen for storage changes to refresh the list
chrome.storage.onChanged.addListener(() => {
    loadAnnotations();
});

loadAnnotations();

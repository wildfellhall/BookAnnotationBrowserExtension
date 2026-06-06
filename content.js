console.log("Annotate content script loaded.");

const DEFAULT_COLORS = [
    '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA',
    '#F4CFDF', '#DBCDF0', '#C6DEF1', '#C9E4DE', '#F2F5FF',
    '#F7D9C4', '#F2C6DE', '#CFBAF0', '#A3C4F3', '#90DBF4',
    '#8EECF5', '#98F5E1', '#B9FBC0', '#FBF8CC', '#FDE4CF',
    '#FF8FAB', '#FFB3C1', '#FFC8D2', '#FFE5EC'
];

const PREF_KEY = 'annotate_preferences';

class AnnotateApp {
    constructor() {
        this.tools = [
            { id: 'highlighter', icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z', color: '#C08B8B', label: 'Highlight' },
            { id: 'sticky', icon: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z', color: '#B5A08A', label: 'Sticky Note' },
            { id: 'margin', icon: 'M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h18v2H3v-2zm0 4h18v2H3v-2z', color: '#8B7355', label: 'Margin Note' },
            { id: 'tab', icon: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z', color: '#A0937D', label: 'Tab' },
            { id: 'flag', icon: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z', color: '#7B3F3F', label: 'Flag' },
            { id: 'underline', icon: 'M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z', color: '#D4A0A0', label: 'Underline' },
            { id: 'squiggle', icon: 'M23.5 12c-1.2 0-2.4-.6-3.3-1.5-.9-.9-2.1-1.5-3.3-1.5s-2.4.6-3.3 1.5c-.9.9-2.1 1.5-3.3 1.5s-2.4-.6-3.3-1.5C6.1 9.6 4.9 9 3.7 9c-1.2 0-2.4.6-3.2 1.5l-1 .1 1.5 1.5c.7-.7 1.8-1.1 2.7-1.1.9 0 2.1.6 3 1.5.9.9 2.1 1.5 3.3 1.5s2.4-.6 3.3-1.5c.9-.9 2.1-1.5 3.3-1.5s2.4.6 3.3 1.5c.9.9 2.1 1.5 3.3 1.5.9 0 2.1-.6 3-1.5l1.5-1.5-.9-.1c-.7.9-1.8 1.5-3 1.5z', color: '#C08B8B', label: 'Squiggle' },
            { id: 'sticker', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5l-1 1-4-4 1-1 3 3 7-7 1 1-8 8z', color: '#B5A08A', label: 'Sticker' }
        ];
        this.fontGroups = [
            {
                label: 'Serif',
                fonts: [
                    { id: 'serif', label: 'Times New Roman', value: "'Times New Roman', Georgia, Garamond, serif" },
                    { id: 'georgia', label: 'Georgia', value: "Georgia, 'Times New Roman', serif" }
                ]
            },
            {
                label: 'Cursive & Script',
                fonts: [
                    { id: 'caveat', label: 'Caveat', value: "'Caveat', cursive" },
                    { id: 'dancing', label: 'Dancing Script', value: "'Dancing Script', cursive" },
                    { id: 'great-vibes', label: 'Great Vibes', value: "'Great Vibes', cursive" },
                    { id: 'pacifico', label: 'Pacifico', value: "'Pacifico', cursive" },
                    { id: 'satisfy', label: 'Satisfy', value: "'Satisfy', cursive" },
                    { id: 'shadows', label: 'Shadows Into Light', value: "'Shadows Into Light', cursive" },
                    { id: 'indie', label: 'Indie Flower', value: "'Indie Flower', cursive" },
                    { id: 'sacramento', label: 'Sacramento', value: "'Sacramento', cursive" },
                    { id: 'allura', label: 'Allura', value: "'Allura', cursive" },
                    { id: 'homemade', label: 'Homemade Apple', value: "'Homemade Apple', cursive" },
                    { id: 'parisienne', label: 'Parisienne', value: "'Parisienne', cursive" }
                ]
            },
            {
                label: 'Sans & Mono',
                fonts: [
                    { id: 'sans', label: 'Sans-serif', value: "Helvetica, Arial, sans-serif" },
                    { id: 'mono', label: 'Monospace', value: "'Courier New', Courier, monospace" }
                ]
            }
        ];
        this.fonts = this.fontGroups.flatMap(g => g.fonts);
        this.fontSizes = [
            { id: 'sm', label: 'S', value: '0.85rem' },
            { id: 'md', label: 'M', value: '1rem' },
            { id: 'lg', label: 'L', value: '1.15rem' },
            { id: 'xl', label: 'XL', value: '1.35rem' }
        ];
        this.colors = [...DEFAULT_COLORS];
        this.customColors = [];
        this.currentColorIdx = 0;
        this.currentCustomColor = null;
        this.activeTool = null;
        this.selectedAnnotationId = null;
        this.toolbarExpanded = false;
        this.enabled = false;
        this.stickyFont = 'serif';
        this.marginFont = 'caveat';
        this.fontSize = 'md';
        this.toolbarEl = null;
        this.panelEl = null;
        this.toolbarWidth = null;
        this.toolbarHeight = null;
        this.toolbarTop = null;
        this.toolbarRight = null;
        this.storageHydrated = false;
        this.currentPageKey = null;
        this.init();
    }

    init() {
        chrome.storage.local.get([PREF_KEY], (result) => {
            this.applyPreferences(result[PREF_KEY] || {});
            this.createToolbar();
            this.setupListeners();
            this.setupStorageListener();
            this.loadAnnotations();
        });
    }

    populateFontSelect(select, selectedId) {
        select.innerHTML = '';
        this.fontGroups.forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group.label;
            group.fonts.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = f.label;
                if (f.id === selectedId) opt.selected = true;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        });
    }

    applyPreferences(prefs) {
        if (prefs.customColors?.length) {
            this.customColors = prefs.customColors;
            this.colors = [...DEFAULT_COLORS, ...this.customColors];
        }
        if (prefs.stickyFont) this.stickyFont = prefs.stickyFont;
        if (prefs.marginFont) this.marginFont = prefs.marginFont;
        if (prefs.fontSize) this.fontSize = prefs.fontSize;
        if (typeof prefs.currentColorIdx === 'number') this.currentColorIdx = prefs.currentColorIdx;
        if (prefs.currentCustomColor) this.currentCustomColor = prefs.currentCustomColor;
        if (prefs.toolbarWidth) this.toolbarWidth = prefs.toolbarWidth;
        if (prefs.toolbarHeight) this.toolbarHeight = prefs.toolbarHeight;
        if (typeof prefs.toolbarTop === 'number') this.toolbarTop = prefs.toolbarTop;
        if (typeof prefs.toolbarRight === 'number') this.toolbarRight = prefs.toolbarRight;
    }

    savePreferences() {
        chrome.storage.local.set({
            [PREF_KEY]: {
                customColors: this.customColors,
                stickyFont: this.stickyFont,
                marginFont: this.marginFont,
                fontSize: this.fontSize,
                currentColorIdx: this.currentColorIdx,
                currentCustomColor: this.currentCustomColor,
                toolbarWidth: this.toolbarWidth,
                toolbarHeight: this.toolbarHeight,
                toolbarTop: this.toolbarTop,
                toolbarRight: this.toolbarRight
            }
        });
    }

    saveToolbarLayout() {
        if (!this.panelEl || !this.toolbarEl) return;
        this.toolbarWidth = this.panelEl.offsetWidth;
        this.toolbarHeight = this.panelEl.offsetHeight;
        const rect = this.toolbarEl.getBoundingClientRect();
        this.toolbarTop = rect.top;
        this.toolbarRight = window.innerWidth - rect.right;
        this.savePreferences();
    }

    applyToolbarLayout() {
        if (!this.panelEl || !this.toolbarEl) return;
        if (this.toolbarWidth) this.panelEl.style.width = this.toolbarWidth + 'px';
        if (this.toolbarHeight) this.panelEl.style.height = this.toolbarHeight + 'px';
        if (this.toolbarTop != null) {
            this.toolbarEl.style.top = this.toolbarTop + 'px';
            this.toolbarEl.style.transform = 'none';
        }
        if (this.toolbarRight != null) {
            this.toolbarEl.style.right = this.toolbarRight + 'px';
        }
    }

    getCurrentColor() {
        return this.currentCustomColor || this.colors[this.currentColorIdx];
    }

    getFontValue(fontId) {
        return this.fonts.find(f => f.id === fontId)?.value || this.fonts[0].value;
    }

    getFontSizeValue(sizeId) {
        return this.fontSizes.find(s => s.id === sizeId)?.value || this.fontSizes[1].value;
    }

    applyNoteTypography(textarea, data, noteType) {
        const fontId = data.fontFamily || (noteType === 'sticky' ? this.stickyFont : this.marginFont);
        const sizeId = data.fontSize || this.fontSize;
        const fontFamily = this.getFontValue(fontId);
        const fontSize = this.getFontSizeValue(sizeId);
        textarea.dataset.annotateFont = fontId;
        textarea.dataset.annotateSize = sizeId;
        textarea.style.setProperty('font-family', fontFamily, 'important');
        textarea.style.setProperty('font-size', fontSize, 'important');
        return { fontFamily: fontId, fontSize: sizeId };
    }

    // ─── Toolbar ─────────────────────────────────────

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'annotate-toolbar';
        this.toolbarEl = toolbar;

        const fab = document.createElement('button');
        fab.className = 'annotate-toolbar-fab';
        fab.title = 'Open annotation tools';
        fab.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>';
        fab.onclick = (e) => { e.stopPropagation(); this.expandToolbar(); };
        fab.style.display = 'none';
        toolbar.appendChild(fab);

        const panel = document.createElement('div');
        panel.className = 'annotate-toolbar-panel';
        this.panelEl = panel;

        const header = document.createElement('div');
        header.className = 'annotate-toolbar-header';
        const label = document.createElement('div');
        label.className = 'annotate-toolbar-label';
        label.textContent = 'ANNOTATE';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'annotate-toolbar-close';
        closeBtn.title = 'Close toolbar';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = (e) => { e.stopPropagation(); this.disableToolbar(); };
        header.appendChild(label);
        header.appendChild(closeBtn);
        panel.appendChild(header);
        this.setupToolbarDrag(header, closeBtn);

        panel.appendChild(this.createColorSection());
        panel.appendChild(this.createFontSection());

        const toolsGrid = document.createElement('div');
        toolsGrid.className = 'annotate-toolbar-tools';
        this.tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = 'annotate-btn';
            btn.title = tool.label;
            btn.dataset.tool = tool.id;
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="${tool.icon}" fill="${tool.color}" /></svg>`;
            const tip = document.createElement('span');
            tip.className = 'btn-label';
            tip.textContent = tool.label;
            btn.appendChild(tip);
            btn.onclick = (e) => { e.stopPropagation(); this.selectTool(tool.id); };
            toolsGrid.appendChild(btn);
        });
        panel.appendChild(toolsGrid);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'annotate-toolbar-resize';
        resizeHandle.title = 'Drag to resize';
        panel.appendChild(resizeHandle);
        this.setupToolbarResize(resizeHandle);

        toolbar.appendChild(panel);
        document.body.appendChild(toolbar);
        this.applyToolbarLayout();
    }

    setupToolbarDrag(header, closeBtn) {
        header.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn || e.target.closest('.annotate-toolbar-close')) return;
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const rect = this.toolbarEl.getBoundingClientRect();
            const startTop = rect.top;
            const startRight = window.innerWidth - rect.right;

            const onMove = (ev) => {
                ev.preventDefault();
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                const newTop = Math.max(8, Math.min(window.innerHeight - 80, startTop + dy));
                const newRight = Math.max(8, Math.min(window.innerWidth - 80, startRight - dx));
                this.toolbarEl.style.top = newTop + 'px';
                this.toolbarEl.style.right = newRight + 'px';
                this.toolbarEl.style.transform = 'none';
                this.toolbarTop = newTop;
                this.toolbarRight = newRight;
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                this.saveToolbarLayout();
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    setupToolbarResize(handle) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = this.panelEl.offsetWidth;
            const startH = this.panelEl.offsetHeight;

            const onMove = (ev) => {
                ev.preventDefault();
                const newW = Math.max(140, Math.min(window.innerWidth - 32, startW + (ev.clientX - startX)));
                const newH = Math.max(180, Math.min(window.innerHeight - 32, startH + (ev.clientY - startY)));
                this.panelEl.style.width = newW + 'px';
                this.panelEl.style.height = newH + 'px';
                this.toolbarWidth = newW;
                this.toolbarHeight = newH;
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                this.saveToolbarLayout();
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    createColorSection() {
        const section = document.createElement('div');
        section.className = 'annotate-toolbar-section';

        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'annotate-section-label';
        sectionLabel.textContent = 'Colors';
        section.appendChild(sectionLabel);

        const colorPicker = document.createElement('div');
        colorPicker.className = 'annotate-color-picker';
        this.renderColorDots(colorPicker);
        section.appendChild(colorPicker);

        const customRow = document.createElement('div');
        customRow.className = 'annotate-custom-color';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'annotate-color-input';
        colorInput.value = this.getCurrentColor();
        colorInput.title = 'Pick a custom color';
        colorInput.oninput = (e) => {
            e.stopPropagation();
            this.setCustomColor(colorInput.value);
        };

        const addBtn = document.createElement('button');
        addBtn.className = 'annotate-color-add';
        addBtn.textContent = '+';
        addBtn.title = 'Save color to palette';
        addBtn.onclick = (e) => {
            e.stopPropagation();
            this.addCustomColorToPalette(colorInput.value);
        };

        const customLabel = document.createElement('span');
        customLabel.className = 'annotate-custom-color-label';
        customLabel.textContent = 'Custom';

        customRow.appendChild(colorInput);
        customRow.appendChild(customLabel);
        customRow.appendChild(addBtn);
        section.appendChild(customRow);

        this.colorPickerEl = colorPicker;
        return section;
    }

    renderColorDots(container) {
        container.innerHTML = '';
        this.colors.forEach((color, idx) => {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = color;
            const isActive = !this.currentCustomColor && idx === this.currentColorIdx;
            if (isActive) dot.classList.add('active');
            dot.onclick = (e) => {
                e.stopPropagation();
                this.selectPaletteColor(idx);
            };
            container.appendChild(dot);
        });
    }

    selectPaletteColor(idx) {
        this.currentColorIdx = idx;
        this.currentCustomColor = null;
        this.refreshColorUI();
        this.applyCurrentColor();
        this.savePreferences();
    }

    setCustomColor(color) {
        this.currentCustomColor = color;
        this.refreshColorUI();
        this.applyCurrentColor();
        this.savePreferences();
    }

    addCustomColorToPalette(color) {
        const normalized = color.toUpperCase();
        if (!this.colors.some(c => c.toUpperCase() === normalized)) {
            this.customColors.push(color);
            this.colors = [...DEFAULT_COLORS, ...this.customColors];
            this.renderColorDots(this.colorPickerEl);
        }
        this.currentColorIdx = this.colors.findIndex(c => c.toUpperCase() === normalized);
        this.currentCustomColor = null;
        this.refreshColorUI();
        this.applyCurrentColor();
        this.savePreferences();
    }

    refreshColorUI() {
        document.querySelectorAll('.color-dot').forEach((d, idx) => {
            d.classList.toggle('active', !this.currentCustomColor && idx === this.currentColorIdx);
        });
        const input = document.querySelector('.annotate-color-input');
        if (input) input.value = this.getCurrentColor();
    }

    applyCurrentColor() {
        const color = this.getCurrentColor();
        if (this.selectedAnnotationId) {
            this.updateSelectedColor(color);
        } else {
            const activeBtn = document.querySelector('.annotate-btn.active svg path');
            if (activeBtn) activeBtn.setAttribute('fill', color);
        }
    }

    createFontSection() {
        const section = document.createElement('div');
        section.className = 'annotate-toolbar-section';

        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'annotate-section-label';
        sectionLabel.textContent = 'Fonts';
        section.appendChild(sectionLabel);

        const stickyRow = document.createElement('div');
        stickyRow.className = 'annotate-font-row';
        stickyRow.innerHTML = '<span class="annotate-font-row-label">Sticky</span>';
        const stickySelect = document.createElement('select');
        stickySelect.className = 'annotate-font-select';
        this.populateFontSelect(stickySelect, this.stickyFont);
        stickySelect.onchange = () => {
            this.stickyFont = stickySelect.value;
            this.applyFontToSelected('sticky');
            this.savePreferences();
        };
        stickyRow.appendChild(stickySelect);
        section.appendChild(stickyRow);

        const marginRow = document.createElement('div');
        marginRow.className = 'annotate-font-row';
        marginRow.innerHTML = '<span class="annotate-font-row-label">Margin</span>';
        const marginSelect = document.createElement('select');
        marginSelect.className = 'annotate-font-select';
        this.populateFontSelect(marginSelect, this.marginFont);
        marginSelect.onchange = () => {
            this.marginFont = marginSelect.value;
            this.applyFontToSelected('margin');
            this.savePreferences();
        };
        marginRow.appendChild(marginSelect);
        section.appendChild(marginRow);

        const sizeRow = document.createElement('div');
        sizeRow.className = 'annotate-font-size-row';
        const sizeLabel = document.createElement('span');
        sizeLabel.className = 'annotate-font-row-label';
        sizeLabel.textContent = 'Size';
        sizeRow.appendChild(sizeLabel);

        const sizeGroup = document.createElement('div');
        sizeGroup.className = 'annotate-size-group';
        this.fontSizes.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'annotate-size-btn';
            btn.textContent = s.label;
            btn.dataset.size = s.id;
            if (s.id === this.fontSize) btn.classList.add('active');
            btn.onclick = (e) => {
                e.stopPropagation();
                this.fontSize = s.id;
                document.querySelectorAll('.annotate-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyFontToSelected('all');
                this.savePreferences();
            };
            sizeGroup.appendChild(btn);
        });
        sizeRow.appendChild(sizeGroup);
        section.appendChild(sizeRow);

        return section;
    }

    applyFontToSelected(type) {
        if (!this.selectedAnnotationId) return;
        const el = document.getElementById(this.selectedAnnotationId);
        if (!el) return;
        const textarea = el.querySelector('textarea');
        if (!textarea) return;

        const isSticky = el.classList.contains('annotate-sticky');
        const isMargin = el.classList.contains('annotate-margin');
        if (!isSticky && !isMargin) return;

        const noteType = isSticky ? 'sticky' : 'margin';
        const fontFamily = isSticky ? this.stickyFont : this.marginFont;

        // Only apply if this change is relevant to the selected note type
        const relevant = (isSticky && (type === 'sticky' || type === 'all'))
            || (isMargin && (type === 'margin' || type === 'all'));
        if (!relevant) return;

        // Apply typography to the live DOM element
        this.applyNoteTypography(textarea, { fontFamily, fontSize: this.fontSize }, noteType);

        // Build the complete update record so storage stays in sync with display
        const updates = { fontFamily, fontSize: this.fontSize };
        this.storeAnnotationMeta(el, updates);
        this.updateAnnotation(this.selectedAnnotationId, updates);
    }

    enableToolbar() {
        this.enabled = true;
        this.showToolbarUI();
    }

    disableToolbar() {
        this.saveToolbarLayout();
        this.enabled = false;
        this.collapseToolbar();
        this.deselectAnnotation();
        this.toolbarEl?.classList.remove('active');
    }

    showToolbarUI() {
        this.toolbarEl?.classList.add('active');
        this.expandToolbar();
    }

    expandToolbar() {
        this.toolbarExpanded = true;
        this.toolbarEl?.classList.add('expanded');
    }

    collapseToolbar() {
        this.toolbarExpanded = false;
        this.toolbarEl?.classList.remove('expanded');
        if (this.activeTool) this.selectTool(null);
    }

    selectTool(toolId) {
        this.activeTool = (this.activeTool === toolId) ? null : toolId;
        document.querySelectorAll('.annotate-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === this.activeTool);
            const tool = this.tools.find(t => t.id === btn.dataset.tool);
            btn.querySelector('path').setAttribute('fill', btn.classList.contains('active') ? this.getCurrentColor() : tool.color);
        });
    }

    // ─── Listeners ───────────────────────────────────

    setupListeners() {
        document.addEventListener('mouseup', () => {
            if (!this.enabled) return;
            if (this.activeTool === 'highlighter') this.handleHighlight();
            else if (this.activeTool === 'underline') this.handleUnderline();
            else if (this.activeTool === 'squiggle') this.handleSquiggle();
        });
        document.addEventListener('click', (e) => {
            const inToolbar = e.target.closest('.annotate-toolbar');
            const anno = e.target.closest('.annotate-sticky, .annotate-margin, .annotate-deco, .annotate-highlight, .annotate-squiggle, .annotate-underline');

            if (this.enabled) {
                if (['sticky', 'margin', 'tab', 'flag', 'sticker'].includes(this.activeTool)) {
                    this.handlePlacement(e);
                }
                if (anno) this.selectAnnotation(anno);
                else if (!inToolbar) this.deselectAnnotation();
            }
        });

        const reloadIfPageChanged = () => {
            const key = this.getPageKey();
            if (key === this.currentPageKey) return;
            this.clearDomAnnotations();
            this.currentPageKey = key;
            this.storageHydrated = false;
            chrome.storage.local.get([key], (result) => {
                this.reconcileAnnotations(result[key] || [], { allowRemoval: false });
            });
        };
        window.addEventListener('popstate', reloadIfPageChanged);
        window.addEventListener('hashchange', reloadIfPageChanged);

        chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
            if (msg.action === 'enableToolbar') {
                this.enableToolbar();
                sendResponse({ enabled: true });
            }
            if (msg.action === 'deleteAnnotation' && msg.id) {
                const el = document.getElementById(msg.id);
                if (el) el.remove();
                sendResponse({ removed: !!el });
            }
            return true;
        });
    }

    // ─── Selection ───────────────────────────────────

    selectAnnotation(el) {
        this.deselectAnnotation();
        el.classList.add('selected');
        this.selectedAnnotationId = el.id;
        this.syncToolbarFromElement(el);
    }

    syncToolbarFromElement(el) {
        const color = el.dataset.color
            || el.style.backgroundColor
            || el.querySelector('textarea')?.style.color
            || el.querySelector('path')?.getAttribute('fill');
        if (color) {
            const idx = this.colors.findIndex(c => c.toUpperCase() === color.toUpperCase());
            if (idx >= 0) {
                this.currentColorIdx = idx;
                this.currentCustomColor = null;
            } else {
                this.currentCustomColor = color;
            }
            this.refreshColorUI();
        }

        if (el.dataset.fontFamily) {
            if (el.classList.contains('annotate-sticky')) this.stickyFont = el.dataset.fontFamily;
            if (el.classList.contains('annotate-margin')) this.marginFont = el.dataset.fontFamily;
            document.querySelectorAll('.annotate-font-select').forEach((select, i) => {
                select.value = i === 0 ? this.stickyFont : this.marginFont;
            });
        }
        if (el.dataset.fontSize) {
            this.fontSize = el.dataset.fontSize;
            document.querySelectorAll('.annotate-size-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.size === this.fontSize);
            });
        }
    }

    deselectAnnotation() {
        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
        this.selectedAnnotationId = null;
    }

    updateSelectedColor(color) {
        const el = document.getElementById(this.selectedAnnotationId);
        if (!el) return;
        if (el.classList.contains('annotate-sticky')) el.style.backgroundColor = color;
        if (el.classList.contains('annotate-deco')) el.querySelector('path').setAttribute('fill', color);
        if (el.classList.contains('annotate-margin')) el.querySelector('textarea')?.style.setProperty('color', color, 'important');
        if (el.classList.contains('annotate-highlight')) el.style.backgroundColor = color;
        if (el.classList.contains('annotate-squiggle') || el.classList.contains('annotate-underline')) {
            const styleType = el.classList.contains('annotate-squiggle') ? 'squiggle' : 'underline';
            this.applyTextDecorationStyle(el, styleType, color);
        }
        el.dataset.color = color;
        this.updateAnnotation(this.selectedAnnotationId, { color });
    }

    // ─── Placement ───────────────────────────────────

    handlePlacement(e) {
        if (e.target.closest('.annotate-toolbar, .annotate-sticky, .annotate-margin, .annotate-deco')) return;
        const tool = this.tools.find(t => t.id === this.activeTool);
        const color = this.getCurrentColor();
        const data = {
            x: e.pageX, y: e.pageY, content: '', color,
            fontFamily: this.activeTool === 'sticky' ? this.stickyFont : this.marginFont,
            fontSize: this.fontSize,
            icon: tool.icon, id: 'id-' + Date.now(), width: null, height: null
        };
        if (this.activeTool === 'sticky') this.createSticky(data, true);
        else if (this.activeTool === 'margin') this.createMarginNote(data, true);
        else if (['tab', 'flag', 'sticker'].includes(this.activeTool)) this.createDecorative(this.activeTool, data, true);
        this.selectTool(null);
    }

    // ─── Text Decorations ────────────────────────────

    handleHighlight() { this.applyTextDecoration('highlight', 'mark', 'annotate-highlight'); }
    handleUnderline() { this.applyTextDecoration('underline', 'span', 'annotate-underline'); }
    handleSquiggle() { this.applyTextDecoration('squiggle', 'span', 'annotate-squiggle'); }

    applyTextDecoration(type, tag, className) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const el = document.createElement(tag);
            const color = this.getCurrentColor();
            const id = 'id-' + Date.now();
            el.className = className;
            el.id = id;
            this.applyTextDecorationStyle(el, type === 'highlight' ? 'background' : type, color);
            const text = selection.toString();
            const parent = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
                ? range.commonAncestorContainer.parentElement
                : range.commonAncestorContainer;
            try {
                range.surroundContents(el);
                el.dataset.color = color;
                this.saveAnnotation(type, { id, text, color, path: this.getUniquePath(parent) });
            } catch (e) { console.error(`Could not apply ${type}:`, e); }
            selection.removeAllRanges();
        }
    }

    applyHighlight(data) { this.renderTextDecoration(data, 'mark', 'annotate-highlight', 'background'); }
    applyUnderline(data) { this.renderTextDecoration(data, 'span', 'annotate-underline', 'underline'); }
    applySquiggle(data) { this.renderTextDecoration(data, 'span', 'annotate-squiggle', 'squiggle'); }

    applyTextDecorationStyle(el, styleType, color) {
        if (!color) return;
        if (styleType === 'background') el.style.backgroundColor = color;
        else if (styleType === 'underline') el.style.borderBottom = `2px solid ${color}`;
        else if (styleType === 'squiggle') el.style.borderBottom = `2px wavy ${color}`;
    }

    wrapTextInElement(root, text, wrapper) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (node.parentElement?.closest('.annotate-highlight, .annotate-underline, .annotate-squiggle')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.textContent.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
        });
        const textNode = walker.nextNode();
        if (!textNode) return false;
        const idx = textNode.textContent.indexOf(text);
        if (idx === -1) return false;
        try {
            const range = document.createRange();
            range.setStart(textNode, idx);
            range.setEnd(textNode, idx + text.length);
            range.surroundContents(wrapper);
            return true;
        } catch (e) {
            console.error('Could not restore text decoration:', e);
            return false;
        }
    }

    renderTextDecoration(data, tag, className, styleType) {
        if (document.getElementById(data.id)) return;
        const host = this.getElementByPath(data.path);
        if (!host || !data.text) return;

        const el = document.createElement(tag);
        el.className = className;
        el.id = data.id;
        this.applyTextDecorationStyle(el, styleType, data.color);
        if (data.color) el.dataset.color = data.color;
        this.wrapTextInElement(host, data.text, el);
    }

    // ─── Sticky Notes ────────────────────────────────

    createSticky(data, isNew) {
        if (document.getElementById(data.id)) return;
        const sticky = document.createElement('div');
        sticky.className = 'annotate-sticky';
        sticky.id = data.id;
        sticky.style.left = data.x + 'px';
        sticky.style.top = data.y + 'px';
        sticky.style.backgroundColor = data.color;
        if (data.width) sticky.style.width = data.width + 'px';
        if (data.height) sticky.style.height = data.height + 'px';

        this.addDeleteBtn(sticky, data.id);

        const textarea = document.createElement('textarea');
        textarea.value = data.content || '';
        this.applyNoteTypography(textarea, data, 'sticky');
        if (data.height) textarea.style.height = Math.max(60, data.height - 40) + 'px';
        textarea.oninput = () => this.updateAnnotation(data.id, { content: textarea.value });
        sticky.appendChild(textarea);

        this.storeAnnotationMeta(sticky, data);

        this.addResizeHandle(sticky, data);

        document.body.appendChild(sticky);
        if (isNew) this.saveAnnotation('sticky', this.snapshotNoteData(data, textarea));
        this.makeDraggable(sticky, data);
    }

    // ─── Margin Notes ────────────────────────────────

    createMarginNote(data, isNew) {
        if (document.getElementById(data.id)) return;
        const margin = document.createElement('div');
        margin.className = 'annotate-margin';
        margin.id = data.id;
        margin.style.left = data.x + 'px';
        margin.style.top = data.y + 'px';
        if (data.width) margin.style.width = data.width + 'px';
        if (data.height) margin.style.height = data.height + 'px';

        this.addDeleteBtn(margin, data.id);

        const textarea = document.createElement('textarea');
        textarea.value = data.content || '';
        this.applyNoteTypography(textarea, data, 'margin');
        textarea.style.setProperty('color', data.color, 'important');
        if (data.height) textarea.style.height = Math.max(40, data.height - 16) + 'px';
        textarea.oninput = () => this.updateAnnotation(data.id, { content: textarea.value });
        margin.appendChild(textarea);

        this.storeAnnotationMeta(margin, data);

        this.addResizeHandle(margin, data);

        document.body.appendChild(margin);
        if (isNew) this.saveAnnotation('margin', this.snapshotNoteData(data, textarea));
        this.makeDraggable(margin, data);
    }

    // ─── Decorative Elements ─────────────────────────

    createDecorative(type, data, isNew) {
        if (document.getElementById(data.id)) return;
        const deco = document.createElement('div');
        deco.className = `annotate-deco annotate-${type}`;
        deco.id = data.id;
        deco.style.left = data.x + 'px';
        deco.style.top = data.y + 'px';
        const size = data.decoSize || 32;
        deco.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path d="${data.icon}" fill="${data.color}" /></svg>`;

        this.storeAnnotationMeta(deco, data);
        this.addDeleteBtn(deco, data.id);
        this.addResizeHandle(deco, data, true);

        document.body.appendChild(deco);
        if (isNew) this.saveAnnotation(type, { ...data, decoSize: size });
        this.makeDraggable(deco, data);
    }

    storeAnnotationMeta(el, data) {
        if (data.color) el.dataset.color = data.color;
        if (data.fontFamily) el.dataset.fontFamily = data.fontFamily;
        if (data.fontSize) el.dataset.fontSize = data.fontSize;
    }

    snapshotNoteData(data, textarea) {
        return {
            ...data,
            content: textarea.value,
            fontFamily: data.fontFamily,
            fontSize: data.fontSize || this.fontSize
        };
    }

    // ─── Shared UI Helpers ───────────────────────────

    addDeleteBtn(el, id) {
        const btn = document.createElement('button');
        btn.className = 'annotate-delete-btn';
        btn.innerHTML = '&times;';
        btn.onclick = (e) => { e.stopPropagation(); this.deleteAnnotation(id, el); };
        el.appendChild(btn);
    }

    addResizeHandle(el, data, isSvg = false) {
        const handle = document.createElement('div');
        handle.className = 'annotate-resize-handle';
        el.appendChild(handle);

        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = el.offsetWidth;
            const startH = el.offsetHeight;
            let currentSvgSize = data.decoSize || 32;

            const onMove = (ev) => {
                ev.preventDefault();
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                if (isSvg) {
                    // For decorative items, scale the SVG uniformly
                    const delta = Math.max(dx, dy);
                    const newSize = Math.max(16, currentSvgSize + delta);
                    const svg = el.querySelector('svg');
                    if (svg) {
                        svg.setAttribute('width', newSize);
                        svg.setAttribute('height', newSize);
                    }
                    data.decoSize = newSize;
                } else {
                    // For sticky/margin notes, resize the container
                    const newW = Math.max(120, startW + dx);
                    const newH = Math.max(80, startH + dy);
                    el.style.width = newW + 'px';
                    el.style.height = newH + 'px';
                    data.width = newW;
                    data.height = newH;

                    // Also stretch textarea to fill
                    const ta = el.querySelector('textarea');
                    if (ta) {
                        ta.style.height = (newH - 40) + 'px';
                    }
                }
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                if (isSvg) {
                    this.updateAnnotation(data.id, { decoSize: data.decoSize });
                } else {
                    this.updateAnnotation(data.id, { width: data.width, height: data.height });
                }
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    // ─── Persistence ─────────────────────────────────

    getPageKey() {
        return window.location.href.split('#')[0];
    }

    clearDomAnnotations() {
        document.querySelectorAll('.annotate-sticky, .annotate-margin, .annotate-deco, .annotate-highlight, .annotate-squiggle, .annotate-underline')
            .forEach(el => el.remove());
    }

    updateDomFromStorage(el, anno) {
        const { type, data } = anno;
        if (type === 'sticky') {
            if (data.color) el.style.backgroundColor = data.color;
            if (data.width) el.style.width = data.width + 'px';
            if (data.height) el.style.height = data.height + 'px';
            const textarea = el.querySelector('textarea');
            if (textarea) {
                if (data.content !== undefined) textarea.value = data.content;
                this.applyNoteTypography(textarea, data, 'sticky');
                if (data.height) textarea.style.height = Math.max(60, data.height - 40) + 'px';
            }
            this.storeAnnotationMeta(el, data);
        } else if (type === 'margin') {
            if (data.width) el.style.width = data.width + 'px';
            if (data.height) el.style.height = data.height + 'px';
            const textarea = el.querySelector('textarea');
            if (textarea) {
                if (data.content !== undefined) textarea.value = data.content;
                this.applyNoteTypography(textarea, data, 'margin');
                if (data.color) textarea.style.setProperty('color', data.color, 'important');
                if (data.height) textarea.style.height = Math.max(40, data.height - 16) + 'px';
            }
            this.storeAnnotationMeta(el, data);
        } else if (['tab', 'flag', 'sticker'].includes(type)) {
            if (data.color) el.querySelector('path')?.setAttribute('fill', data.color);
            if (data.decoSize) {
                const svg = el.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', data.decoSize);
                    svg.setAttribute('height', data.decoSize);
                }
            }
            this.storeAnnotationMeta(el, data);
        } else if (type === 'highlight' && data.color) {
            el.style.backgroundColor = data.color;
            el.dataset.color = data.color;
        } else if ((type === 'underline' || type === 'squiggle') && data.color) {
            this.applyTextDecorationStyle(el, type, data.color);
            el.dataset.color = data.color;
        }
    }

    renderStoredAnnotation(anno) {
        if (!anno?.data?.id || document.getElementById(anno.data.id)) return;
        const { type, data } = anno;
        if (type === 'highlight') this.applyHighlight(data);
        else if (type === 'sticky') this.createSticky(data, false);
        else if (type === 'margin') this.createMarginNote(data, false);
        else if (['tab', 'flag', 'sticker'].includes(type)) this.createDecorative(type, data, false);
        else if (type === 'underline') this.applyUnderline(data);
        else if (type === 'squiggle') this.applySquiggle(data);
    }

    reconcileAnnotations(stored, { allowRemoval = true } = {}) {
        const storedList = Array.isArray(stored) ? stored : [];
        const storedIds = new Set(storedList.map(a => a.data?.id).filter(Boolean));

        storedList.forEach(anno => {
            const el = document.getElementById(anno.data?.id);
            if (el) this.updateDomFromStorage(el, anno);
            else this.renderStoredAnnotation(anno);
        });

        if (allowRemoval && this.storageHydrated) {
            document.querySelectorAll('.annotate-sticky, .annotate-margin, .annotate-deco, .annotate-highlight, .annotate-squiggle, .annotate-underline')
                .forEach(el => { if (!storedIds.has(el.id)) el.remove(); });
        }

        this.storageHydrated = true;
    }

    loadAnnotations() {
        const key = this.getPageKey();
        const fullKey = window.location.href;
        this.currentPageKey = key;
        chrome.storage.local.get([key, fullKey], (result) => {
            let stored = result[key] || [];
            if (!stored.length && fullKey !== key && Array.isArray(result[fullKey])) {
                stored = result[fullKey];
                chrome.storage.local.set({ [key]: stored });
            }
            this.reconcileAnnotations(stored, { allowRemoval: false });
        });
    }

    setupStorageListener() {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;
            const key = this.getPageKey();
            if (changes[key]) this.reconcileAnnotations(changes[key].newValue || [], { allowRemoval: true });
        });
    }

    saveAnnotation(type, data) {
        const key = this.getPageKey();
        chrome.storage.local.get([key], (result) => {
            const annotations = result[key] || [];
            if (annotations.some(a => a.data?.id === data.id)) return;
            annotations.push({ type, data: { ...data }, timestamp: Date.now(), id: data.id });
            chrome.storage.local.set({ [key]: annotations });
        });
    }

    updateAnnotation(id, data) {
        const key = this.getPageKey();
        chrome.storage.local.get([key], (result) => {
            let annotations = result[key] || [];
            annotations = annotations.map(anno => {
                if (anno.data?.id !== id && anno.id !== id) return anno;
                const merged = { ...anno.data, ...data };
                return { ...anno, data: merged, timestamp: Date.now() };
            });
            chrome.storage.local.set({ [key]: annotations });
        });
    }

    deleteAnnotation(id, element) {
        const key = this.getPageKey();
        chrome.storage.local.get([key], (result) => {
            let annotations = (result[key] || []).filter(anno => anno.data?.id !== id && anno.id !== id);
            chrome.storage.local.set({ [key]: annotations }, () => { if (element) element.remove(); });
        });
    }

    // ─── Drag ────────────────────────────────────────

    makeDraggable(el, data) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        el.onmousedown = (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.classList.contains('annotate-resize-handle')) return;
            e.preventDefault();
            pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null; document.onmousemove = null;
                this.updateAnnotation(data.id, { x: el.offsetLeft, y: el.offsetTop });
            };
            document.onmousemove = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                pos3 = e.clientX; pos4 = e.clientY;
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            };
        };
    }

    // ─── Path Utilities ──────────────────────────────

    getUniquePath(element) {
        const segments = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let index = 1, sibling = element.previousSibling;
            while (sibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) index++;
                sibling = sibling.previousSibling;
            }
            segments.unshift(`${element.nodeName.toLowerCase()}:nth-of-type(${index})`);
            element = element.parentNode;
        }
        return segments.join(' > ');
    }

    getElementByPath(path) { try { return document.querySelector(path); } catch (e) { return null; } }
}

new AnnotateApp();


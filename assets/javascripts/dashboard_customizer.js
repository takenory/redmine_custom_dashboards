class DashboardCustomizer {
  constructor(options) {
    this.dashboardId = options.dashboardId;
    this.gridSize = options.gridSize || 20;
    this.csrfToken = options.csrfToken;
    this.translations = options.translations || {};
    this.urls = {
      addPanel: options.addPanelUrl,
      updatePanel: options.updatePanelUrl,
      deletePanel: options.deletePanelUrl,
      updatePositions: options.updatePositionsUrl
    };

    this.isCustomizeMode = false;
    this.isDragging = false;
    this.isResizing = false;
    this.dragData = null;
    this.resizeData = null;
    this.selectedPanel = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupGrid();
    this.restoreCustomizeModeState();
  }

  restoreCustomizeModeState() {
    // セッションストレージからカスタマイズモード状態を復元
    const wasCustomizeMode = sessionStorage.getItem('dashboardCustomizeMode');
    if (wasCustomizeMode === 'true') {
      sessionStorage.removeItem('dashboardCustomizeMode');
      // DOM読み込み完了後にカスタマイズモードを復元
      setTimeout(() => {
        if (!this.isCustomizeMode) {
          this.toggleCustomizeMode();
        }
      }, 100);
    }
  }

  bindEvents() {
    // カスタマイズモードのトグル
    const toggleBtn = document.getElementById('toggle-customize');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleCustomizeMode());
    }

    // パネル追加
    const addPanelBtn = document.getElementById('add-panel-btn');
    if (addPanelBtn) {
      addPanelBtn.addEventListener('click', () => this.startAddPanel());
    }


    // グローバルマウスイベント
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // パネルイベント
    this.bindPanelEvents();
  }

  bindPanelEvents() {
    const panels = document.querySelectorAll('.dashboard-panel');
    panels.forEach(panel => {
      this.bindSinglePanelEvents(panel);
    });
  }

  bindSinglePanelEvents(panel) {
    // ドラッグ開始
    panel.addEventListener('mousedown', (e) => this.handlePanelMouseDown(e, panel));

    // パネル選択
    panel.addEventListener('click', (e) => this.selectPanel(panel));

    // 設定ボタン
    const configureBtn = panel.querySelector('.panel-configure');
    if (configureBtn) {
      configureBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.configurePanel(panel);
      });
    }

    // 削除ボタン
    const deleteBtn = panel.querySelector('.panel-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deletePanel(panel);
      });
    }

    // リサイズハンドル
    const resizeHandle = panel.querySelector('.resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', (e) => this.handleResizeMouseDown(e, panel));
    }
  }

  setupGrid() {
    const grid = document.getElementById('dashboard-grid');
    const gridBackground = grid.querySelector('.grid-background');

    // グリッドクリックでパネル追加位置指定
    grid.addEventListener('click', (e) => {
      if (this.isCustomizeMode && this.isAddingPanel && !e.target.closest('.dashboard-panel')) {
        this.addPanelAtPosition(e);
      }
    });
  }

  toggleCustomizeMode() {
    this.isCustomizeMode = !this.isCustomizeMode;
    const container = document.getElementById('dashboard-container');
    const toolbar = document.getElementById('customize-toolbar');
    const toggleBtn = document.getElementById('toggle-customize');

    if (this.isCustomizeMode) {
      container.classList.add('customize-mode');
      toolbar.style.display = 'block';
      this.disablePanelTooltips();
      const iconLabel = toggleBtn.querySelector('.icon-label');
      if (iconLabel) iconLabel.textContent = this.translations.customizeEnd || 'End Customize';
      this.showMessage(this.translations.customizeModeStarted || 'Customize mode started', 'info');
    } else {
      container.classList.remove('customize-mode');
      toolbar.style.display = 'none';
      this.enablePanelTooltips();
      const iconLabel = toggleBtn.querySelector('.icon-label');
      if (iconLabel) iconLabel.textContent = this.translations.customize || 'Customize';
      this.isAddingPanel = false;
      this.hidePreview();
      this.clearSelection();
      this.showMessage(this.translations.customizeModeEnded || 'Customize mode ended', 'info');
    }
  }

  startAddPanel() {
    if (!this.isCustomizeMode) return;

    this.isAddingPanel = true;
    this.showMessage(this.translations.clickToPlacePanel || 'Click to specify placement position', 'info');

    // マウス追従プレビュー
    document.addEventListener('mousemove', this.handleAddPanelMouseMove.bind(this));
  }

  handleAddPanelMouseMove(e) {
    if (!this.isAddingPanel) return;

    const grid = document.getElementById('dashboard-grid');
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);

    this.showPreview(gridX, gridY, 10, 10); // デフォルトサイズ 10x10
  }

  addPanelAtPosition(e) {
    const grid = document.getElementById('dashboard-grid');
    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridX = Math.floor(x / this.gridSize);
    const gridY = Math.floor(y / this.gridSize);

    this.addPanel(gridX, gridY);
  }

  addPanel(gridX, gridY) {
    const panelType = document.getElementById('panel-type-select').value;
    const title = this.getPanelTypeTitle(panelType);

    const panelData = {
      title: title,
      panel_type: panelType,
      grid_x: gridX,
      grid_y: gridY,
      grid_width: 10,
      grid_height: 10,
      visible: true,
      z_index: this.getNextZIndex()
    };

    this.apiCall('POST', this.urls.addPanel, { panel: panelData })
      .then(response => {
        if (response.status === 'success') {
          this.createPanelElement(response.panel);
          this.showMessage(response.message, 'success');
          this.stopAddingPanel();
        } else {
          this.showMessage(response.errors.join(', '), 'error');
        }
      })
      .catch(error => {
        this.showMessage(this.translations.panelAddFailed || 'Failed to add panel', 'error');
        console.error(error);
      });
  }

  createPanelElement(panelData) {
    const grid = document.getElementById('dashboard-grid');
    const panel = document.createElement('div');
    panel.className = 'dashboard-panel';
    panel.setAttribute('data-panel-id', panelData.id);
    panel.setAttribute('data-grid-x', panelData.grid_x);
    panel.setAttribute('data-grid-y', panelData.grid_y);
    panel.setAttribute('data-grid-width', panelData.grid_width);
    panel.setAttribute('data-grid-height', panelData.grid_height);
    panel.style.left = panelData.pixel_x + 'px';
    panel.style.top = panelData.pixel_y + 'px';
    panel.style.width = panelData.pixel_width + 'px';
    panel.style.height = panelData.pixel_height + 'px';
    panel.style.zIndex = panelData.z_index;

    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">${this.escapeHtml(panelData.title)}</span>
        <div class="panel-controls">
          <a href="#" class="panel-configure" data-panel-id="${panelData.id}" title="${this.translations.configureLabel || 'Configure'}">${this.translations.configureIconSvg || '<svg class="s18 icon-svg" aria-hidden="true"><use href="/assets/icons-1857f271.svg#icon--settings"></use></svg>'}</a>
          <a href="#" class="panel-delete" data-panel-id="${panelData.id}" title="${this.translations.deleteLabel || 'Delete'}">${this.translations.deleteIconSvg || '<svg class="s18 icon-svg" aria-hidden="true"><use href="/assets/icons-1857f271.svg#icon--close"></use></svg>'}</a>
        </div>
      </div>
      <div class="panel-content">
        <div class="panel-default">
          <div class="panel-info">
            <strong>${this.translations.panelTypeFallback || 'Panel Type'}:</strong> ${panelData.panel_type}
          </div>
          <div class="panel-placeholder">
            <p>${this.translations.panelContentPlaceholder || 'Panel content placeholder'}</p>
            <small>${this.translations.panelConfigRequired || 'Configuration required'}</small>
          </div>
        </div>
      </div>
      <div class="resize-handle resize-se"></div>
    `;

    grid.appendChild(panel);
    this.bindSinglePanelEvents(panel);
  }

  handlePanelMouseDown(e, panel) {
    if (!this.isCustomizeMode) return;
    if (e.target.closest('.panel-controls') || e.target.closest('.resize-handle')) return;

    e.preventDefault();
    this.selectPanel(panel);

    const rect = panel.getBoundingClientRect();
    const gridRect = document.getElementById('dashboard-grid').getBoundingClientRect();

    this.dragData = {
      panel: panel,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: parseInt(panel.style.left),
      startTop: parseInt(panel.style.top),
      startGridX: parseInt(panel.getAttribute('data-grid-x')),
      startGridY: parseInt(panel.getAttribute('data-grid-y'))
    };

    this.isDragging = true;
    panel.classList.add('dragging');
    document.body.style.cursor = 'move';
  }

  handleResizeMouseDown(e, panel) {
    if (!this.isCustomizeMode) return;

    e.preventDefault();
    e.stopPropagation();

    this.selectPanel(panel);

    this.resizeData = {
      panel: panel,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: parseInt(panel.style.width),
      startHeight: parseInt(panel.style.height),
      startGridWidth: parseInt(panel.getAttribute('data-grid-width')),
      startGridHeight: parseInt(panel.getAttribute('data-grid-height'))
    };

    this.isResizing = true;
    panel.classList.add('resizing');
    document.body.style.cursor = 'se-resize';
  }

  handleMouseMove(e) {
    if (this.isDragging && this.dragData) {
      this.handleDrag(e);
    } else if (this.isResizing && this.resizeData) {
      this.handleResize(e);
    }
  }

  handleDrag(e) {
    const deltaX = e.clientX - this.dragData.startX;
    const deltaY = e.clientY - this.dragData.startY;

    const newLeft = this.dragData.startLeft + deltaX;
    const newTop = this.dragData.startTop + deltaY;

    // グリッドにスナップ
    const gridX = Math.max(0, Math.round(newLeft / this.gridSize));
    const gridY = Math.max(0, Math.round(newTop / this.gridSize));

    const pixelX = gridX * this.gridSize;
    const pixelY = gridY * this.gridSize;

    this.dragData.panel.style.left = pixelX + 'px';
    this.dragData.panel.style.top = pixelY + 'px';
    this.dragData.panel.setAttribute('data-grid-x', gridX);
    this.dragData.panel.setAttribute('data-grid-y', gridY);

    // 重複チェック
    const isValid = this.validatePanelPosition(this.dragData.panel, gridX, gridY);
    this.dragData.panel.classList.toggle('invalid', !isValid);
  }

  handleResize(e) {
    const deltaX = e.clientX - this.resizeData.startX;
    const deltaY = e.clientY - this.resizeData.startY;

    const newWidth = Math.max(80, this.resizeData.startWidth + deltaX);
    const newHeight = Math.max(80, this.resizeData.startHeight + deltaY);

    // グリッドにスナップ
    const gridWidth = Math.max(4, Math.round(newWidth / this.gridSize));
    const gridHeight = Math.max(4, Math.round(newHeight / this.gridSize));

    const pixelWidth = gridWidth * this.gridSize;
    const pixelHeight = gridHeight * this.gridSize;

    this.resizeData.panel.style.width = pixelWidth + 'px';
    this.resizeData.panel.style.height = pixelHeight + 'px';
    this.resizeData.panel.setAttribute('data-grid-width', gridWidth);
    this.resizeData.panel.setAttribute('data-grid-height', gridHeight);

    // 重複チェック
    const gridX = parseInt(this.resizeData.panel.getAttribute('data-grid-x'));
    const gridY = parseInt(this.resizeData.panel.getAttribute('data-grid-y'));
    const isValid = this.validatePanelPosition(this.resizeData.panel, gridX, gridY, gridWidth, gridHeight);
    this.resizeData.panel.classList.toggle('invalid', !isValid);
  }

  handleMouseUp(e) {
    if (this.isDragging && this.dragData) {
      this.finishDrag();
    } else if (this.isResizing && this.resizeData) {
      this.finishResize();
    }
  }

  finishDrag() {
    const panel = this.dragData.panel;
    panel.classList.remove('dragging');
    document.body.style.cursor = '';

    const gridX = parseInt(panel.getAttribute('data-grid-x'));
    const gridY = parseInt(panel.getAttribute('data-grid-y'));

    if (this.validatePanelPosition(panel, gridX, gridY)) {
      this.updatePanelPosition(panel);
    } else {
      // 無効な位置の場合は元に戻す
      panel.style.left = this.dragData.startLeft + 'px';
      panel.style.top = this.dragData.startTop + 'px';
      panel.setAttribute('data-grid-x', this.dragData.startGridX);
      panel.setAttribute('data-grid-y', this.dragData.startGridY);
      this.showMessage(this.translations.panelMoveBlocked || 'Cannot move panel due to overlap', 'error');
    }

    panel.classList.remove('invalid');
    this.isDragging = false;
    this.dragData = null;
  }

  finishResize() {
    const panel = this.resizeData.panel;
    panel.classList.remove('resizing');
    document.body.style.cursor = '';

    const gridX = parseInt(panel.getAttribute('data-grid-x'));
    const gridY = parseInt(panel.getAttribute('data-grid-y'));
    const gridWidth = parseInt(panel.getAttribute('data-grid-width'));
    const gridHeight = parseInt(panel.getAttribute('data-grid-height'));

    if (this.validatePanelPosition(panel, gridX, gridY, gridWidth, gridHeight)) {
      this.updatePanelPosition(panel);
    } else {
      // 無効なサイズの場合は元に戻す
      panel.style.width = this.resizeData.startWidth + 'px';
      panel.style.height = this.resizeData.startHeight + 'px';
      panel.setAttribute('data-grid-width', this.resizeData.startGridWidth);
      panel.setAttribute('data-grid-height', this.resizeData.startGridHeight);
      this.showMessage(this.translations.panelResizeBlocked || 'Cannot resize panel due to overlap', 'error');
    }

    panel.classList.remove('invalid');
    this.isResizing = false;
    this.resizeData = null;
  }

  validatePanelPosition(panel, x, y, width = null, height = null) {
    const panelId = panel.getAttribute('data-panel-id');
    const panelWidth = width || parseInt(panel.getAttribute('data-grid-width'));
    const panelHeight = height || parseInt(panel.getAttribute('data-grid-height'));

    // 境界チェック
    if (x < 0 || y < 0 || x + panelWidth > 60 || y + panelHeight > 40) {
      return false;
    }

    // 他のパネルとの重複チェック
    const panels = document.querySelectorAll('.dashboard-panel');
    for (let otherPanel of panels) {
      if (otherPanel.getAttribute('data-panel-id') === panelId) continue;

      const otherX = parseInt(otherPanel.getAttribute('data-grid-x'));
      const otherY = parseInt(otherPanel.getAttribute('data-grid-y'));
      const otherWidth = parseInt(otherPanel.getAttribute('data-grid-width'));
      const otherHeight = parseInt(otherPanel.getAttribute('data-grid-height'));

      if (!(x >= otherX + otherWidth ||
            otherX >= x + panelWidth ||
            y >= otherY + otherHeight ||
            otherY >= y + panelHeight)) {
        return false;
      }
    }

    return true;
  }

  updatePanelPosition(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const panelData = {
      grid_x: parseInt(panel.getAttribute('data-grid-x')),
      grid_y: parseInt(panel.getAttribute('data-grid-y')),
      grid_width: parseInt(panel.getAttribute('data-grid-width')),
      grid_height: parseInt(panel.getAttribute('data-grid-height'))
    };

    this.apiCall('PATCH', this.urls.updatePanel, { panel: panelData, panel_id: panelId })
      .then(response => {
        if (response.status === 'success') {
          this.showMessage(this.translations.panelUpdated || 'Panel updated successfully', 'success');
        } else {
          this.showMessage(response.errors.join(', '), 'error');
        }
      })
      .catch(error => {
        this.showMessage(this.translations.panelUpdateFailed || 'Failed to update panel', 'error');
        console.error(error);
      });
  }

  configurePanel(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const panelType = this.getPanelType(panel);
    
    // 汎用的なパネル設定モーダルを開く
    this.openPanelConfigurationModal(panel);
  }

  getPanelType(panel) {
    // パネルのdata-panel-type属性から取得
    return panel.getAttribute('data-panel-type') || 'text';
  }

  openPanelConfigurationModal(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const panelType = this.getPanelType(panel);
    
    // 汎用的な設定モーダルを作成
    this.createConfigurationModal(panel, {
      title: this.translations[`configure${panelType.charAt(0).toUpperCase() + panelType.slice(1)}Panel`] || `Configure ${panelType.charAt(0).toUpperCase() + panelType.slice(1)} Panel`,
      content: this.createPanelConfigurationContent(panel)
    });
  }

  openTextPanelEditor(panel) {
    // 後方互換性のため残すが、新しいメソッドを使用
    this.openPanelConfigurationModal(panel);
  }

  createConfigurationModal(panel, options) {
    // 既存のモーダルがあれば削除
    const existingModal = document.getElementById('panel-config-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // モーダル要素を作成
    const modal = document.createElement('div');
    modal.id = 'panel-config-modal';
    modal.className = 'panel-config-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>${options.title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${options.content}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="save-panel-config">${this.translations.buttonSave || 'Save'}</button>
          <button class="btn btn-secondary" id="cancel-panel-config">${this.translations.buttonCancel || 'Cancel'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // モーダルイベントをバインド
    this.bindModalEvents(modal, panel);
  }

  createPanelConfigurationContent(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const panelType = this.getPanelType(panel);
    const currentTitle = panel.querySelector('.panel-title').textContent;
    
    // 共通のタイトル編集フィールド
    let content = `
      <div class="panel-config-container">
        <div class="common-config-section">
          <p>
            <label for="panel_title_${panelId}">Panel Title</label>
            <input type="text" id="panel_title_${panelId}" 
                   name="panel[title]" 
                   value="${this.escapeHtml(currentTitle)}"
                   placeholder="Enter panel title"
                   maxlength="100"
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </p>
        </div>
    `;
    
    // パネルタイプ固有の設定を追加
    if (panelType === 'text') {
      content += this.createTextPanelSpecificContent(panel);
    } else if (panelType === 'issues') {
      content += this.createIssuesPanelSpecificContent(panel);
    } else {
      content += `
        <div class="type-specific-config-section">
          <p class="info-message">
            Content configuration for ${panelType} panels will be available in future updates.
          </p>
        </div>
      `;
    }
    
    content += '</div>';
    return content;
  }

  createTextPanelSpecificContent(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const currentContent = this.getCurrentPanelContent(panel);
    const textareaId = `panel_text_content_${panelId}`;
    
    return `
      <div class="type-specific-config-section">
        <p>
          <label for="${textareaId}">Text Content</label>
          <textarea id="${textareaId}" 
                    name="panel[text_content]"
                    class="wiki-edit" 
                    cols="60" 
                    rows="15"
                    data-auto-complete="true">${this.escapeHtml(currentContent)}</textarea>
        </p>
        <p class="formatting-help">
          <small>You can use Wiki formatting: *bold*, _italic_, [[links]], etc.</small>
        </p>
      </div>
    `;
  }

  createIssuesPanelSpecificContent(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const currentConfig = this.getCurrentPanelConfig(panel);
    
    return `
      <div class="type-specific-config-section">
        <p>
          <label for="panel_query_id_${panelId}">Query</label>
          <select id="panel_query_id_${panelId}" name="panel[query_id]" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="">Loading queries...</option>
          </select>
        </p>
        <div id="query_columns_${panelId}" style="display: none;">
          <p>
            <label>Columns</label>
            <div id="columns_selection_${panelId}" class="columns-selection">
              <!-- Columns will be loaded dynamically -->
            </div>
          </p>
        </div>
        <div id="query_sort_${panelId}" style="display: none;">
          <p>
            <label>Sort</label>
            <div id="sort_selection_${panelId}" class="sort-selection">
              <!-- Sort criteria will be loaded dynamically -->
            </div>
          </p>
        </div>
        <p class="info-message">
          <small>Configure which issues to display and how they should be presented.</small>
        </p>
      </div>
    `;
  }

  createTextEditorContent(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const currentContent = this.getCurrentPanelContent(panel);
    const textareaId = `panel_text_content_${panelId}`;
    
    return `
      <div class="text-editor-container">
        <p>
          <label for="${textareaId}">Text Content</label>
          <textarea id="${textareaId}" 
                    name="panel[text_content]"
                    class="wiki-edit" 
                    cols="60" 
                    rows="15"
                    data-auto-complete="true">${this.escapeHtml(currentContent)}</textarea>
        </p>
        <p class="formatting-help">
          <small>You can use Wiki formatting: *bold*, _italic_, [[links]], etc.</small>
        </p>
      </div>
    `;
  }

  getCurrentPanelContent(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    
    // パネルに既に保存されているconfigからtext_contentを取得
    if (panel.dataset.panelConfig) {
      try {
        const config = JSON.parse(panel.dataset.panelConfig);
        return config.text_content || '';
      } catch (e) {
        console.warn('Failed to parse panel config:', e);
      }
    }
    
    // フォールバック: パネル内のテキストコンテンツから取得を試行
    const textContent = panel.querySelector('.text-panel-content');
    if (textContent) {
      // HTMLをプレーンテキストに変換（簡易版）
      return this.htmlToPlainText(textContent.innerHTML);
    }
    
    return ''; // デフォルトは空
  }

  getCurrentPanelConfig(panel) {
    if (panel.dataset.panelConfig) {
      try {
        return JSON.parse(panel.dataset.panelConfig);
      } catch (e) {
        console.warn('Failed to parse panel config:', e);
      }
    }
    return {};
  }

  htmlToPlainText(html) {
    // HTMLタグを除去してプレーンテキストに変換
    let text = html;
    
    // <br> -> 改行
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // <li> -> * 
    text = text.replace(/<li[^>]*>/gi, '* ');
    text = text.replace(/<\/li>/gi, '\n');
    
    // その他のHTMLタグを除去
    text = text.replace(/<[^>]+>/g, '');
    
    // HTMLエンティティをデコード
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    
    return text.trim();
  }

  bindModalEvents(modal, panel) {
    // 閉じるボタン
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('#cancel-panel-config');
    
    closeBtn.addEventListener('click', () => this.closeConfigurationModal());
    cancelBtn.addEventListener('click', () => this.closeConfigurationModal());
    
    // バックドロップクリックで閉じる
    const backdrop = modal.querySelector('.modal-backdrop');
    backdrop.addEventListener('click', () => this.closeConfigurationModal());

    // 保存ボタン
    const saveBtn = modal.querySelector('#save-panel-config');
    saveBtn.addEventListener('click', () => this.savePanelConfiguration(panel));

    const panelType = this.getPanelType(panel);
    
    // パネルタイプ固有の初期化
    if (panelType === 'text') {
      // Wikiツールバーを初期化
      this.initializeWikiToolbar(panel);
    } else if (panelType === 'issues') {
      // Issues panel specific initialization
      this.initializeIssuesPanelConfiguration(panel);
    }
  }

  initializeWikiToolbar(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const textareaId = `panel_text_content_${panelId}`;
    
    // RedmineのjsToolBarを初期化
    setTimeout(() => {
      const textarea = document.getElementById(textareaId);
      if (textarea && typeof jsToolBar === 'function') {
        const wikiToolbar = new jsToolBar(textarea);
        if (wikiToolbar.setHelpLink) {
          wikiToolbar.setHelpLink('/help/wiki_syntax');
        }
        if (wikiToolbar.setPreviewUrl) {
          // CSRFトークンを含むプレビューURL
          const previewUrl = '/preview/text?authenticity_token=' + encodeURIComponent(this.csrfToken);
          wikiToolbar.setPreviewUrl(previewUrl);
        }
        wikiToolbar.draw();
        
        // プレビュー機能を手動で設定
        this.setupPreviewFunctionality(wikiToolbar, textareaId);
        
        console.log('Wiki toolbar initialized for', textareaId);
      } else {
        console.log('jsToolBar not available, using basic textarea');
      }
    }, 100);
  }

  setupPreviewFunctionality(wikiToolbar, textareaId) {
    // プレビュータブを取得
    const previewTab = wikiToolbar.tabsBlock.querySelector('.tab-preview');
    if (previewTab) {
      const self = this;
      // 元のクリックイベントを保存
      const originalOnClick = previewTab.onclick;
      
      // 新しいクリックイベントを設定
      previewTab.onclick = function(event) {
        event.preventDefault();
        
        // 元の表示切り替え処理を実行
        if (originalOnClick) {
          originalOnClick.call(this, event);
        } else {
          wikiToolbar.showPreview(event);
        }
        
        // プレビューコンテンツを更新
        const textarea = document.getElementById(textareaId);
        const previewDiv = wikiToolbar.preview;
        
        if (textarea && previewDiv) {
          const content = textarea.value.trim();
          if (content) {
            self.fetchRedminePreview(content).then(html => {
              previewDiv.innerHTML = html;
            }).catch(error => {
              console.error('Preview failed:', error);
              previewDiv.innerHTML = '<p>Preview not available</p>';
            });
          } else {
            previewDiv.innerHTML = '<p>Nothing to preview</p>';
          }
        }
        
        return false;
      };
    }
  }

  fetchRedminePreview(text) {
    // Redmineのプレビューエンドポイントを使用
    return fetch('/preview/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-Token': this.csrfToken
      },
      body: new URLSearchParams({
        'text': text,
        'format': 'textile'
      })
    })
    .then(response => response.text())
    .then(html => {
      // レスポンスからプレビュー部分を抽出
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const preview = doc.querySelector('.preview');
      return preview ? preview.innerHTML : html;
    });
  }

  switchTab(tabName) {
    const modal = document.getElementById('panel-config-modal');
    
    // タブボタンの状態を更新
    modal.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // タブコンテンツの表示を更新
    modal.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });

    // プレビュータブが選択されたら内容を更新
    if (tabName === 'preview') {
      this.updatePreview();
    }
  }

  initializeIssuesPanelConfiguration(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const currentConfig = this.getCurrentPanelConfig(panel);
    
    // Load available queries
    this.loadQueries(panelId, currentConfig.query_id);
  }

  loadQueries(panelId, selectedQueryId) {
    const querySelect = document.getElementById(`panel_query_id_${panelId}`);
    if (querySelect) {
      // 利用可能なクエリを読み込む
      this.fetchAvailableQueries().then(queries => {
        let options = '<option value="">Select a query...</option>';
        queries.forEach(query => {
          const selected = selectedQueryId == query.id ? 'selected' : '';
          options += `<option value="${query.id}" ${selected}>${this.escapeHtml(query.name)}</option>`;
        });
        querySelect.innerHTML = options;
        
        // Add change event listener
        querySelect.addEventListener('change', () => {
          this.onQuerySelectionChange(panelId, querySelect.value);
        });
        
        // If there's a selected query, show columns and sort options
        if (selectedQueryId) {
          this.onQuerySelectionChange(panelId, selectedQueryId);
        }
      }).catch(error => {
        console.error('Failed to load queries:', error);
        // フォールバック: 基本的なクエリリスト
        querySelect.innerHTML = `
          <option value="">Select a query...</option>
          <option value="assigned_to_me" ${selectedQueryId == 'assigned_to_me' ? 'selected' : ''}>Assigned to me</option>
          <option value="reported_by_me" ${selectedQueryId == 'reported_by_me' ? 'selected' : ''}>Reported by me</option>
          <option value="updated_by_me" ${selectedQueryId == 'updated_by_me' ? 'selected' : ''}>Updated by me</option>
          <option value="watched_by_me" ${selectedQueryId == 'watched_by_me' ? 'selected' : ''}>Watched by me</option>
        `;
        
        querySelect.addEventListener('change', () => {
          this.onQuerySelectionChange(panelId, querySelect.value);
        });
        
        if (selectedQueryId) {
          this.onQuerySelectionChange(panelId, selectedQueryId);
        }
      });
    }
  }

  fetchAvailableQueries() {
    // Redmineのクエリ一覧を取得（簡易版）
    // 本格的な実装では /queries.json などのエンドポイントを使用
    return fetch('/queries.json', {
      headers: {
        'X-CSRF-Token': this.csrfToken,
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch queries');
      }
      return response.json();
    })
    .then(data => {
      // クエリデータの構造に応じて調整
      if (data.queries) {
        return data.queries;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        throw new Error('Unexpected response format');
      }
    })
    .catch(error => {
      console.warn('Query API not available, using fallback queries');
      // フォールバック: マイページでよく使用される基本クエリ
      return [
        { id: 'assigned_to_me', name: 'Assigned to me' },
        { id: 'reported_by_me', name: 'Reported by me' }, 
        { id: 'updated_by_me', name: 'Updated by me' },
        { id: 'watched_by_me', name: 'Watched by me' }
      ];
    });
  }

  onQuerySelectionChange(panelId, queryId) {
    const columnsDiv = document.getElementById(`query_columns_${panelId}`);
    const sortDiv = document.getElementById(`query_sort_${panelId}`);
    
    if (queryId) {
      // Show columns and sort sections
      if (columnsDiv) columnsDiv.style.display = 'block';
      if (sortDiv) sortDiv.style.display = 'block';
      
      // Load default columns and sort options
      this.loadQueryColumns(panelId, queryId);
      this.loadQuerySort(panelId, queryId);
    } else {
      // Hide columns and sort sections
      if (columnsDiv) columnsDiv.style.display = 'none';
      if (sortDiv) sortDiv.style.display = 'none';
    }
  }

  loadQueryColumns(panelId, queryId) {
    const columnsContainer = document.getElementById(`columns_selection_${panelId}`);
    const currentConfig = this.getCurrentPanelConfig(document.querySelector(`[data-panel-id="${panelId}"]`));
    const selectedColumns = currentConfig.columns || ['project', 'tracker', 'status', 'subject'];
    
    if (columnsContainer) {
      const availableColumns = [
        'project', 'tracker', 'status', 'priority', 'subject', 'assigned_to', 
        'author', 'created_on', 'updated_on', 'due_date', 'done_ratio'
      ];
      
      columnsContainer.innerHTML = availableColumns.map(column => `
        <label style="display: inline-block; width: 150px; margin-right: 10px;">
          <input type="checkbox" name="panel[columns][]" value="${column}" 
                 ${selectedColumns.includes(column) ? 'checked' : ''}>
          ${this.formatColumnName(column)}
        </label>
      `).join('');
    }
  }

  loadQuerySort(panelId, queryId) {
    const sortContainer = document.getElementById(`sort_selection_${panelId}`);
    const currentConfig = this.getCurrentPanelConfig(document.querySelector(`[data-panel-id="${panelId}"]`));
    const selectedSort = currentConfig.sort || [['priority', 'desc'], ['updated_on', 'desc']];
    
    if (sortContainer) {
      const availableSortFields = [
        'priority', 'status', 'updated_on', 'created_on', 'due_date', 'project', 'tracker', 'subject'
      ];
      
      let sortHtml = '';
      for (let i = 0; i < 3; i++) {
        const currentSortField = selectedSort[i] ? selectedSort[i][0] : '';
        const currentSortDir = selectedSort[i] ? selectedSort[i][1] : 'asc';
        
        sortHtml += `
          <div style="margin-bottom: 8px;">
            <select name="panel[sort_field_${i}]" style="width: 150px; margin-right: 8px;">
              <option value="">None</option>
              ${availableSortFields.map(field => 
                `<option value="${field}" ${field === currentSortField ? 'selected' : ''}>${this.formatColumnName(field)}</option>`
              ).join('')}
            </select>
            <select name="panel[sort_dir_${i}]" style="width: 100px;">
              <option value="asc" ${currentSortDir === 'asc' ? 'selected' : ''}>Ascending</option>
              <option value="desc" ${currentSortDir === 'desc' ? 'selected' : ''}>Descending</option>
            </select>
          </div>
        `;
      }
      
      sortContainer.innerHTML = sortHtml;
    }
  }

  formatColumnName(column) {
    const names = {
      'project': 'Project',
      'tracker': 'Tracker',
      'status': 'Status',
      'priority': 'Priority',
      'subject': 'Subject',
      'assigned_to': 'Assignee',
      'author': 'Author',
      'created_on': 'Created',
      'updated_on': 'Updated',
      'due_date': 'Due date',
      'done_ratio': 'Progress'
    };
    return names[column] || column.charAt(0).toUpperCase() + column.slice(1);
  }

  updatePreview() {
    const textarea = document.getElementById('panel-text-content');
    const preview = document.getElementById('panel-text-preview');
    
    if (textarea && preview) {
      const content = textarea.value.trim();
      if (content) {
        // 簡単なWikiフォーマット変換
        const html = this.convertWikiToHtml(content);
        preview.innerHTML = html;
      } else {
        preview.innerHTML = this.translations.previewEmpty || 'Nothing to preview yet.';
      }
    }
  }

  convertWikiToHtml(wikiText) {
    // 基本的なWikiフォーマット変換
    let html = this.escapeHtml(wikiText);
    
    // **bold** -> <strong>bold</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // *italic* -> <em>italic</em>  
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // [link] -> <a href="link">link</a>
    html = html.replace(/\[([^\]]+)\]/g, '<a href="$1">$1</a>');
    
    // 行頭の * -> リスト項目
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>');
    
    // 改行を <br> に変換
    html = html.replace(/\n/g, '<br>');
    
    return html;
  }

  savePanelConfiguration(panel) {
    const panelId = panel.getAttribute('data-panel-id');
    const panelType = this.getPanelType(panel);
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Saving configuration for panel:', panelId, 'type:', panelType);
    }
    
    // タイトルを取得
    const titleInput = document.getElementById(`panel_title_${panelId}`);
    const newTitle = titleInput ? titleInput.value.trim() : '';
    
    if (!newTitle) {
      alert('Panel title is required');
      return;
    }
    
    // パネル設定データを収集
    const configData = {};
    
    // パネルタイプ固有の設定データを収集
    if (panelType === 'text') {
      const textareaId = `panel_text_content_${panelId}`;
      const textarea = document.getElementById(textareaId);
      if (textarea) {
        configData.text_content = textarea.value;
      }
    } else if (panelType === 'issues') {
      // Issues panel configuration
      const querySelect = document.getElementById(`panel_query_id_${panelId}`);
      if (querySelect) {
        configData.query_id = querySelect.value;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('Selected query ID:', configData.query_id);
        }
      }
      
      // Collect columns
      const columnCheckboxes = document.querySelectorAll(`input[name="panel[columns][]"]`);
      const selectedColumns = [];
      columnCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          selectedColumns.push(checkbox.value);
        }
      });
      configData.columns = selectedColumns;
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Selected columns:', selectedColumns);
      }
      
      // Collect sort criteria
      const sortCriteria = [];
      for (let i = 0; i < 3; i++) {
        const fieldSelect = document.querySelector(`select[name="panel[sort_field_${i}]"]`);
        const dirSelect = document.querySelector(`select[name="panel[sort_dir_${i}]"]`);
        
        if (fieldSelect && dirSelect && fieldSelect.value) {
          sortCriteria.push([fieldSelect.value, dirSelect.value]);
        }
      }
      configData.sort = sortCriteria;
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Sort criteria:', sortCriteria);
        console.log('Final issues config data:', configData);
      }
    }
    
    // タイトルとコンフィグの両方を更新
    this.updatePanelTitleAndConfig(panelId, newTitle, configData).then(() => {
      // パネル表示を更新
      this.updatePanelTitleDisplay(panel, newTitle);
      this.closeConfigurationModal();
      
      // Issues パネルの場合は保存完了後に部分更新を試行
      if (panelType === 'issues' && configData.query_id) {
        // カスタマイズモードの状態を保存
        const wasCustomizeMode = this.isCustomizeMode;
        
        // AJAXでパネル内容を更新試行
        this.refreshIssuesPanelContent(panel, configData).then(() => {
          // 成功した場合はカスタマイズモードを維持
          if (wasCustomizeMode && !this.isCustomizeMode) {
            this.toggleCustomizeMode();
          }
        }).catch(() => {
          // 失敗した場合はページリロード（カスタマイズモード状態を保存）
          if (wasCustomizeMode) {
            sessionStorage.setItem('dashboardCustomizeMode', 'true');
          }
          setTimeout(() => {
            window.location.reload();
          }, 100);
        });
      } else {
        this.updatePanelDisplay(panel, configData);
      }
    }).catch(error => {
      console.error('Failed to save panel configuration:', error);
      this.showMessage('Failed to save configuration', 'error');
    });
  }

  updatePanelTitleAndConfig(panelId, title, configData) {
    const panelData = {
      title: title,
      panel_config: JSON.stringify(configData)
    };
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Sending panel data to server:', panelData);
    }

    return this.apiCall('PATCH', this.urls.updatePanel, { panel: panelData, panel_id: panelId })
      .then(response => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('Server response:', response);
        }
        if (response.status === 'success') {
          this.showMessage(this.translations.panelConfigSaved || 'Panel configuration saved', 'success');
        } else {
          this.showMessage(response.errors ? response.errors.join(', ') : 'Failed to save configuration', 'error');
          throw new Error('Save failed');
        }
      })
      .catch(error => {
        console.error('API call failed:', error);
        throw error;
      });
  }

  updatePanelConfig(panelId, configData) {
    const panelData = {
      panel_config: JSON.stringify(configData)
    };

    return this.apiCall('PATCH', this.urls.updatePanel, { panel: panelData, panel_id: panelId })
      .then(response => {
        if (response.status === 'success') {
          this.showMessage(this.translations.panelConfigSaved || 'Panel configuration saved', 'success');
        } else {
          this.showMessage(response.errors ? response.errors.join(', ') : 'Failed to save configuration', 'error');
          throw new Error('Save failed');
        }
      });
  }

  updatePanelTitleDisplay(panel, newTitle) {
    const titleElement = panel.querySelector('.panel-title');
    if (titleElement) {
      titleElement.textContent = newTitle;
    }
  }

  refreshIssuesPanelContent(panel, configData) {
    const panelId = panel.getAttribute('data-panel-id');
    const content = panel.querySelector('.panel-content');
    
    // ローディング表示
    content.innerHTML = '<div class="panel-loading">Loading issues...</div>';
    
    // パネルのdata-panel-configを更新
    panel.dataset.panelConfig = JSON.stringify(configData);
    
    // パネルの再描画をリクエスト（同期リクエスト）
    return fetch(window.location.href, {
      method: 'GET',
      headers: {
        'X-CSRF-Token': this.csrfToken,
        'Accept': 'text/html'
      }
    })
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error('Failed to refresh panel');
      }
    })
    .then(html => {
      // レスポンスから該当パネルの内容を抽出
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const updatedPanel = tempDiv.querySelector(`[data-panel-id="${panelId}"] .panel-content`);
      
      if (updatedPanel) {
        content.innerHTML = updatedPanel.innerHTML;
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('Issues panel updated successfully');
        }
      } else {
        throw new Error('Panel content not found in response');
      }
    });
  }

  updatePanelDisplay(panel, configData) {
    const content = panel.querySelector('.panel-content');
    const panelType = this.getPanelType(panel);
    
    // パネルのdata-panel-configを更新
    panel.dataset.panelConfig = JSON.stringify(configData);
    
    if (panelType === 'text' && content && configData.text_content) {
      // テキストパネルの場合
      this.fetchRedminePreview(configData.text_content).then(html => {
        content.innerHTML = `<div class="text-panel-content">${html}</div>`;
      }).catch(error => {
        console.error('Failed to format panel content:', error);
        // フォールバック: 簡易フォーマットを使用
        const fallbackHtml = this.convertWikiToHtml(configData.text_content);
        content.innerHTML = `<div class="text-panel-content">${fallbackHtml}</div>`;
      });
    } else if (content) {
      // その他のパネルタイプまたはコンテンツが空の場合はプレースホルダーを表示
      content.innerHTML = `
        <div class="panel-placeholder">
          <p>${this.translations.panelContentPlaceholder || 'No content configured yet.'}</p>
          <small>${this.translations.panelConfigRequired || 'Click the configure button to add content.'}</small>
        </div>
      `;
    }
  }

  closeConfigurationModal() {
    const modal = document.getElementById('panel-config-modal');
    if (modal) {
      modal.remove();
    }
  }

  deletePanel(panel) {
    if (!confirm(this.translations.confirmDeletePanel || 'Are you sure you want to delete this panel?')) return;

    const panelId = panel.getAttribute('data-panel-id');

    this.apiCall('DELETE', this.urls.deletePanel, { panel_id: panelId })
      .then(response => {
        if (response.status === 'success') {
          // 選択状態をクリア
          if (this.selectedPanel === panel) {
            this.clearSelection();
          }
          panel.remove();
          this.showMessage(response.message, 'success');
        } else {
          this.showMessage(response.message, 'error');
        }
      })
      .catch(error => {
        this.showMessage(this.translations.panelDeleteFailed || 'Failed to delete panel', 'error');
        console.error(error);
      });
  }

  selectPanel(panel) {
    this.clearSelection();
    this.selectedPanel = panel;
    panel.classList.add('selected');
  }

  clearSelection() {
    if (this.selectedPanel) {
      this.selectedPanel.classList.remove('selected');
      this.selectedPanel = null;
    }
  }

  disablePanelTooltips() {
    const controlButtons = document.querySelectorAll('.panel-configure, .panel-delete');
    controlButtons.forEach(btn => {
      if (btn.title) {
        btn.dataset.originalTitle = btn.title;
        btn.removeAttribute('title');
      }
    });
  }

  enablePanelTooltips() {
    const controlButtons = document.querySelectorAll('.panel-configure, .panel-delete');
    controlButtons.forEach(btn => {
      if (btn.dataset.originalTitle) {
        btn.title = btn.dataset.originalTitle;
        delete btn.dataset.originalTitle;
      }
    });
  }


  showPreview(gridX, gridY, gridWidth, gridHeight) {
    let preview = document.getElementById('panel-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'panel-preview';
      preview.className = 'panel-preview';
      document.getElementById('dashboard-grid').appendChild(preview);
    }

    const pixelX = gridX * this.gridSize;
    const pixelY = gridY * this.gridSize;
    const pixelWidth = gridWidth * this.gridSize;
    const pixelHeight = gridHeight * this.gridSize;

    preview.style.left = pixelX + 'px';
    preview.style.top = pixelY + 'px';
    preview.style.width = pixelWidth + 'px';
    preview.style.height = pixelHeight + 'px';
    preview.style.display = 'block';

    // 有効性チェック
    const isValid = this.validatePanelPosition({ 
      getAttribute: (attr) => {
        switch(attr) {
          case 'data-panel-id': return 'preview';
          case 'data-grid-x': return gridX;
          case 'data-grid-y': return gridY;
          case 'data-grid-width': return gridWidth;
          case 'data-grid-height': return gridHeight;
        }
      }
    }, gridX, gridY, gridWidth, gridHeight);

    preview.classList.toggle('invalid', !isValid);
  }

  hidePreview() {
    const preview = document.getElementById('panel-preview');
    if (preview) {
      preview.style.display = 'none';
    }
  }

  stopAddingPanel() {
    this.isAddingPanel = false;
    this.hidePreview();
    document.removeEventListener('mousemove', this.handleAddPanelMouseMove);
  }


  getPanelTypeTitle(type) {
    const titles = {
      text: this.translations.panelTypeText || 'Text Panel',
      chart: this.translations.panelTypeChart || 'Chart Panel',
      list: this.translations.panelTypeList || 'List Panel',
      calendar: this.translations.panelTypeCalendar || 'Calendar Panel',
      issues: this.translations.panelTypeIssues || 'Issues Panel',
      activity: this.translations.panelTypeActivity || 'Activity Panel',
      custom: this.translations.panelTypeCustom || 'Custom Panel'
    };
    return titles[type] || (this.translations.panelTypeFallback || 'Panel');
  }

  getNextZIndex() {
    const panels = document.querySelectorAll('.dashboard-panel');
    let maxZ = 0;
    panels.forEach(panel => {
      const z = parseInt(panel.style.zIndex) || 1;
      if (z > maxZ) maxZ = z;
    });
    return maxZ + 1;
  }

  apiCall(method, url, data = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken
      }
    };

    let finalUrl = url;

    if (data) {
      if (method === 'DELETE') {
        // DELETEの場合はクエリパラメータとして送信
        const params = new URLSearchParams(data);
        finalUrl = `${url}?${params.toString()}`;
      } else {
        // その他のメソッドはリクエストボディとして送信
        options.body = JSON.stringify(data);
      }
    }

    return fetch(finalUrl, options)
      .then(response => response.json());
  }

  showMessage(message, type = 'info') {
    // Redmineのフラッシュメッセージエリアを使用
    const flashArea = document.getElementById('flash_notice') || document.getElementById('flash_error');
    if (flashArea) {
      flashArea.textContent = message;
      flashArea.className = type === 'error' ? 'flash error' : 'flash notice';
      flashArea.style.display = 'block';

      setTimeout(() => {
        flashArea.style.display = 'none';
      }, 3000);
    } else {
      // フォールバック: アラート
      alert(message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
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
    const deleteButtons = document.querySelectorAll('.panel-delete');
    deleteButtons.forEach(btn => {
      if (btn.title) {
        btn.dataset.originalTitle = btn.title;
        btn.removeAttribute('title');
      }
    });
  }

  enablePanelTooltips() {
    const deleteButtons = document.querySelectorAll('.panel-delete');
    deleteButtons.forEach(btn => {
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
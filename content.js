// 内容脚本 - 处理页面上的文本选择
class ContentScript {
  constructor() {
    this.selectedText = '';
    this.resultPopup = null;
    this.init();
  }

  init() {
    // 监听文本选择事件
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('keyup', this.handleTextSelection.bind(this));
    
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  handleTextSelection(event) {
    const selection = window.getSelection();
    this.selectedText = selection.toString().trim();
    
    if (this.selectedText) {
      // 发送选中文本到background script
      chrome.runtime.sendMessage({
        type: 'TEXT_SELECTED',
        text: this.selectedText
      });
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'SHOW_RESULT':
        this.showResult(message.result, message.originalText);
        break;
      case 'HIDE_RESULT':
        this.hideResult();
        break;
      case 'GET_SELECTED_TEXT':
        sendResponse({ text: this.selectedText });
        break;
    }
  }

  showResult(result, originalText) {
    this.hideResult(); // 先隐藏之前的结果

    this.resultPopup = document.createElement('div');
    this.resultPopup.className = 'query-selection-result';
    this.resultPopup.innerHTML = `
      <div class="result-content">
        ${result}
      </div>
    `;

    // 添加到页面
    document.body.appendChild(this.resultPopup);

    // 定位到选中文本附近
    this.positionPopup();
  }

  showStreamResult(originalText) {
    this.hideResult(); // 先隐藏之前的结果

    this.resultPopup = document.createElement('div');
    this.resultPopup.className = 'query-selection-result';
    this.resultPopup.innerHTML = `
      <div class="result-content">
        <div class="stream-content">正在处理中...</div>
      </div>
    `;

    // 添加到页面
    document.body.appendChild(this.resultPopup);

    // 定位到选中文本附近
    this.positionPopup();
  }

  updateStreamResult(content) {
    if (this.resultPopup) {
      const streamContent = this.resultPopup.querySelector('.stream-content');
      if (streamContent) {
        // 如果是"正在处理中..."，先清空
        if (streamContent.textContent === '正在处理中...') {
          streamContent.textContent = '';
        }
        streamContent.textContent += content;
        // 自动滚动到底部
        streamContent.scrollTop = streamContent.scrollHeight;
      }
    }
  }

  hideResult() {
    if (this.resultPopup) {
      this.resultPopup.remove();
      this.resultPopup = null;
    }
  }

  positionPopup() {
    // 尝试获取选中文本的位置
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.resultPopup.style.position = 'absolute';
      this.resultPopup.style.top = `${rect.bottom + window.scrollY + 10}px`;
      this.resultPopup.style.left = `${rect.left + window.scrollX}px`;
      this.resultPopup.style.zIndex = '10000';
    } else {
      // 如果没有选中文本，显示在页面中央
      this.resultPopup.style.position = 'fixed';
      this.resultPopup.style.top = '50%';
      this.resultPopup.style.left = '50%';
      this.resultPopup.style.transform = 'translate(-50%, -50%)';
      this.resultPopup.style.zIndex = '10000';
      this.resultPopup.style.maxWidth = '80%';
      this.resultPopup.style.maxHeight = '80%';
      this.resultPopup.style.overflow = 'auto';
    }
  }
}

// 初始化内容脚本
new ContentScript();

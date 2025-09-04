// 弹出窗口脚本
class PopupScript {
  constructor() {
    this.init();
  }

  init() {
    // 加载保存的API密钥
    this.loadApiKey();
    
    // 加载保存的自定义提示词
    this.loadCustomPrompt();
    
    // 加载缓存的历史记录
    this.loadHistory();
    
    // 绑定tab切换事件
    this.bindTabEvents();
    
    // 获取所有按钮和输入框
    this.saveApiKeyBtn = document.getElementById('saveApiKey');
    this.updateApiKeyBtn = document.getElementById('updateApiKey');
    this.saveCustomPromptBtn = document.getElementById('saveCustomPrompt');
    this.updateCustomPromptBtn = document.getElementById('updateCustomPrompt');
    this.explainBtn = document.getElementById('explainBtn');
    this.translateBtn = document.getElementById('translateBtn');
    this.chatBtn = document.getElementById('chatBtn');
    this.customBtn = document.getElementById('customBtn');
    this.inputText = document.getElementById('inputText');
    this.clearHistoryBtn = document.getElementById('clearHistory');
    this.saveModelBtn=document.getElementById('saveModelName');
    this.updateModelBtn=document.getElementById('updateModelName');

    // 绑定事件
    this.saveApiKeyBtn.addEventListener('click', this.saveApiKey.bind(this));
    this.updateApiKeyBtn.addEventListener('click', this.updateApiKey.bind(this));
    this.saveCustomPromptBtn.addEventListener('click', this.saveCustomPrompt.bind(this));
    this.updateCustomPromptBtn.addEventListener('click', this.updateCustomPrompt.bind(this));
    this.explainBtn.addEventListener('click', this.explainText.bind(this));
    this.translateBtn.addEventListener('click', this.translateText.bind(this));
    this.chatBtn.addEventListener('click', this.directChat.bind(this));
    this.customBtn.addEventListener('click', this.customAction.bind(this));
    this.clearHistoryBtn.addEventListener('click', this.clearHistory.bind(this));
    this.saveModelBtn.addEventListener('click',this.saveModelName.bind(this));
    this.updateModelBtn.addEventListener('click',this.updateModelName.bind(this));
    document.getElementById('customPrompt').addEventListener('input', ()=>{
      this.showCustomPromptEditState();
    });

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener(this.handleBackgroundMessage.bind(this));
  }

  bindTabEvents() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        // 更新按钮状态
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新内容显示
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `${targetTab}-tab`) {
            content.classList.add('active');
          }
        });
      });
    });
  }

  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(['apiKey']);
      if (result.apiKey) {
        document.getElementById('apiKey').value = result.apiKey;
        // 如果已有API密钥，显示已保存状态
        this.showSavedState();
      }
    } catch (error) {
      console.error('加载API密钥失败:', error);
    }
  }

  async loadCustomPrompt() {
    try {
      const result = await chrome.storage.sync.get(['customPrompt']);
      if (result.customPrompt) {
        document.getElementById('customPrompt').value = result.customPrompt;
        this.showCustomPromptSavedState();
      }
    } catch (error) {
      console.error('加载自定义提示词失败:', error);
    }
  }

  async saveCustomPrompt() {
    const customPrompt = document.getElementById('customPrompt').value.trim();
    
    if (!customPrompt) {
      this.showStatus('请输入自定义提示词', 'error');
      return;
    }

    this.showStatus('正在保存自定义提示词...', 'success');
    
    try {
      await chrome.storage.sync.set({ customPrompt: customPrompt });
      this.showStatus('✅ 自定义提示词保存成功！', 'success');
      this.showCustomPromptSavedState();
    } catch (error) {
      console.error('保存自定义提示词失败:', error);
      this.showStatus('❌ 保存自定义提示词失败: ' + error.message, 'error');
    }
  }

  showCustomPromptSavedState() {
    const saveButton = document.getElementById('saveCustomPrompt');
    const updateButton = document.getElementById('updateCustomPrompt');
    
    if (saveButton && updateButton) {
      saveButton.style.display = 'none';
      updateButton.style.display = 'block';
    }
  }

  showCustomPromptEditState() {
    document.getElementById('saveCustomPrompt').style.display = 'block';
    document.getElementById('updateCustomPrompt').style.display = 'none';
  }

  updateCustomPrompt() {
    this.showCustomPromptEditState();
    document.getElementById('customPrompt').focus();
    this.showStatus('请修改自定义提示词', 'success');
  }

  async loadHistory() {
    try {
      const result = await chrome.storage.sync.get(['lastInput', 'lastResult', 'lastAction']);
      if (result.lastInput) {
        // 恢复上一次的输入
        document.getElementById('inputText').value = result.lastInput;
      }
      if (result.lastResult) {
        // 恢复上一次的结果
        this.showCachedResult(result.lastResult, result.lastAction || '');
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }

  async saveHistory(input, result, action) {
    try {
      await chrome.storage.sync.set({
        lastInput: input,
        lastResult: result,
        lastAction: action,
        lastUpdateTime: Date.now()
      });
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  }

  showCachedResult(result, action) {
    const resultArea = document.getElementById('resultArea');
    const actionText = action ? `[${action}] ` : '';
    const timestamp = new Date().toLocaleString();
    
    resultArea.innerHTML = `
      <div class="result-container">
        <div class="result-content">
          <div style="color: #666; font-size: 11px; margin-bottom: 8px;">
            ${actionText}上次结果 (${timestamp})
          </div>
          <div class="stream-content">${result}</div>
        </div>
      </div>
    `;
  }

  async saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
      this.showStatus('请输入API密钥', 'error');
      return;
    }

    // 显示保存中状态
    this.showStatus('正在保存API密钥...', 'success');
    
    try {
      console.log('发送API密钥保存请求...');
      console.log('API密钥长度:', apiKey.length);
      
      // 直接保存到存储，避免消息传递问题
      await chrome.storage.sync.set({ apiKey: apiKey });
      console.log('API密钥已保存到存储');
      
      // 发送消息到background script更新服务
      chrome.runtime.sendMessage({
        type: 'SET_API_KEY',
        apiKey: apiKey
      });
      
      console.log('保存成功，切换到已保存状态');
      this.showStatus('✅ API密钥保存成功！', 'success');
      // 保存成功后切换到已保存状态
      this.showSavedState();
      
    } catch (error) {
      console.error('保存API密钥失败:', error);
      this.showStatus('❌ 保存API密钥失败: ' + error.message, 'error');
    }
  }

  async explainText() {
    const text = document.getElementById('inputText').value.trim();
    const streamMode = document.getElementById('streamMode').checked;
    
    if (!text) {
      this.showStatus('请在文本框中输入要解释的文本', 'error');
      return;
    }

    try {
      this.showStatus('正在解释文本...', 'success');
      
      if (streamMode) {
        // 流式响应处理
        await this.handleStreamResponse('EXPLAIN_TEXT_STREAM', text);
        // 保存历史记录
        await this.saveHistory(text, '解释完成', '解释文本');
      } else {
        // 非流式响应处理
        const response = await chrome.runtime.sendMessage({
          type: 'EXPLAIN_TEXT',
          text: text,
          stream: false
        });
        
        console.log('解释结果:', response);
        this.showResultInPopup(response, text);
        // 保存历史记录
        await this.saveHistory(text, response, '解释文本');
      }
      
    } catch (error) {
      console.error('解释文本失败:', error);
      this.showStatus('解释文本失败: ' + error.message, 'error');
    }
  }

  async translateText() {
    const text = document.getElementById('inputText').value.trim();
    const streamMode = document.getElementById('streamMode').checked;
    
    if (!text) {
      this.showStatus('请在文本框中输入要翻译的文本', 'error');
      return;
    }

    try {
      this.showStatus('正在翻译文本...', 'success');
      
      if (streamMode) {
        // 流式响应处理
        await this.handleStreamResponse('TRANSLATE_TEXT_STREAM', text);
        // 保存历史记录
        await this.saveHistory(text, '翻译完成', '翻译文本');
      } else {
        // 非流式响应处理
        const response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          text: text,
          stream: false
        });
        
        console.log('翻译结果:', response);
        this.showResultInPopup(response, text);
        // 保存历史记录
        await this.saveHistory(text, response, '翻译文本');
      }
      
    } catch (error) {
      console.error('翻译文本失败:', error);
      this.showStatus('翻译文本失败: ' + error.message, 'error');
    }
  }

  async directChat() {
    const text = this.inputText.value.trim();
    if (text) {
      const streamMode = document.getElementById('streamMode').checked;
      if (streamMode) {
        // 流式响应处理
        await this.handleStreamResponse('DIRECT_CHAT_STREAM', text);
        // 保存历史记录
        await this.saveHistory(text, '对话完成', '直接对话');
      } else {
        // 非流式响应处理
        const response = await chrome.runtime.sendMessage({
          type: 'DIRECT_CHAT',
          text: text,
          stream: false
        });
        this.showResultInPopup(response, text);
        // 保存历史记录
        await this.saveHistory(text, response, '直接对话');
      }
    } else {
      this.showStatus('请输入对话内容', 'error');
    }
  }

  async customAction() {
    const text = document.getElementById('inputText').value.trim();
    const streamMode = document.getElementById('streamMode').checked;
    
    if (!text) {
      this.showStatus('请在文本框中输入要处理的文本', 'error');
      return;
    }

    try {
      const result = await chrome.storage.sync.get(['customPrompt']);
      if (!result.customPrompt) {
        this.showStatus('请先在设置中配置自定义提示词', 'error');
        return;
      }

      this.showStatus('正在使用自定义提示词处理...', 'success');
      
      if (streamMode) {
        await this.handleCustomStreamResponse(text, result.customPrompt);
      } else {
        const response = await chrome.runtime.sendMessage({
          type: 'CUSTOM_PROMPT',
          text: text,
          prompt: result.customPrompt,
          stream: false
        });
        
        this.showResultInPopup(response, text);
        await this.saveHistory(text, response, '自定义处理');
      }
      
    } catch (error) {
      console.error('自定义处理失败:', error);
      this.showStatus('自定义处理失败: ' + error.message, 'error');
    }
  }

  async handleCustomStreamResponse(text, customPrompt) {
    const resultContainer = this.createStreamResultContainer(text);
    this.updateStreamResult(resultContainer, '');

    try {
      const port = chrome.runtime.connect({ name: 'llm-stream' });
      port.postMessage({ type: 'CUSTOM_PROMPT_STREAM', text: text, prompt: customPrompt });

      port.onMessage.addListener((message) => {
        switch (message.type) {
          case 'STREAM_DATA':
            console.log('[POPUP] 收到流式数据:', message.content);
            this.updateStreamResult(resultContainer, message.content);
            break;
          case 'STREAM_END':
            const finalResult = resultContainer.querySelector('.stream-content').textContent;
            this.saveHistory(text, finalResult, '自定义处理');
            port.disconnect();
            break;
          case 'STREAM_ERROR':
            this.updateStreamResult(resultContainer, `\n错误: ${message.error}`);
            port.disconnect();
            break;
        }
      });

    } catch (error) {
      console.error('创建端口连接失败:', error);
      this.updateStreamResult(resultContainer, `连接失败: ${error.message}`);
    }
  }

  showSavedState() {
    console.log('切换到已保存状态');
    // 隐藏保存按钮，显示已保存按钮
    const saveButton = document.getElementById('saveApiKey');
    const updateButton = document.getElementById('updateApiKey');
    
    if (saveButton && updateButton) {
      saveButton.style.display = 'none';
      updateButton.style.display = 'block';
      console.log('按钮状态切换成功');
    } else {
      console.error('找不到按钮元素');
    }
  }

  showEditState() {
    // 显示保存按钮，隐藏已保存按钮
    document.getElementById('saveApiKey').style.display = 'block';
    document.getElementById('updateApiKey').style.display = 'none';
  }

  updateApiKey() {
    // 点击更新按钮时，切换到编辑状态
    this.showEditState();
    // 清空输入框，让用户重新输入
    document.getElementById('apiKey').value = '';
    // 聚焦到输入框
    document.getElementById('apiKey').focus();
    this.showStatus('请重新输入API密钥', 'success');
  }

  async handleStreamResponse(actionType, text) {
    const resultContainer = this.createStreamResultContainer(text);
    this.updateStreamResult(resultContainer, ''); // 清空"正在处理中"

    try {
      const port = chrome.runtime.connect({ name: 'llm-stream' });

      port.postMessage({ type: actionType, text: text });

      port.onMessage.addListener((message) => {
        switch (message.type) {
          case 'STREAM_START':
            console.log('流式传输开始...');
            break;
          case 'STREAM_DATA':
            console.log('[POPUP] 收到流式数据:', message.content);
            this.updateStreamResult(resultContainer, message.content);
            break;
          case 'STREAM_END':
            console.log('流式传输结束');
            // 保存完整的历史记录
            const finalResult = resultContainer.querySelector('.stream-content').textContent;
            this.saveHistory(text, finalResult, this.getActionName(actionType));
            port.disconnect();
            break;
          case 'STREAM_ERROR':
            console.error('流式传输错误:', message.error);
            this.updateStreamResult(resultContainer, `\n错误: ${message.error}`);
            port.disconnect();
            break;
        }
      });

      port.onDisconnect.addListener(() => {
        console.log('端口已断开');
      });

    } catch (error) {
      console.error('创建端口连接失败:', error);
      this.updateStreamResult(resultContainer, `连接失败: ${error.message}`);
    }
  }

  async clearHistory() {
    try {
      await chrome.storage.sync.remove(['lastInput', 'lastResult', 'lastAction', 'lastUpdateTime']);
      // 清空输入框和结果区域
      document.getElementById('inputText').value = '';
      document.getElementById('resultArea').innerHTML = '';
      this.showStatus('历史记录已清除', 'success');
    } catch (error) {
      console.error('清除历史记录失败:', error);
      this.showStatus('清除历史记录失败: ' + error.message, 'error');
    }
  }

  async handleBackgroundMessage(message, sender, sendResponse) {
    console.log('Popup收到background消息:', message);
    
    if (message.type === 'CONTEXT_MENU_ACTION') {
      // 处理右键菜单操作
      await this.handleContextMenuAction(message.text, message.action);
    }
  }

  async handleContextMenuAction(selectedText, action) {
    try {
      // 将选中的文本填入输入框
      document.getElementById('inputText').value = selectedText;
      
      // 切换到功能操作标签
      this.switchToFunctionTab();
      
      // 显示状态信息
      this.showStatus('正在处理选中的文本...', 'success');
      
      // 根据操作类型执行相应功能
      switch (action) {
        case 'explain-selected-text':
          await this.explainText();
          break;
        case 'translate-selected-text':
          await this.translateText();
          break;
        default:
          console.log('未知的操作类型:', action);
          this.showStatus('未知的操作类型', 'error');
      }
    } catch (error) {
      console.error('处理右键菜单操作失败:', error);
      this.showStatus('处理右键菜单操作失败: ' + error.message, 'error');
    }
  }

  switchToFunctionTab() {
    // 切换到功能操作标签
    const functionTab = document.querySelector('[data-tab="function"]');
    const settingsTab = document.querySelector('[data-tab="settings"]');
    const functionContent = document.getElementById('function-tab');
    const settingsContent = document.getElementById('settings-tab');
    
    if (functionTab && settingsTab && functionContent && settingsContent) {
      functionTab.classList.add('active');
      settingsTab.classList.remove('active');
      functionContent.classList.add('active');
      settingsContent.classList.remove('active');
    }
  }

  getActionName(actionType) {
    switch (actionType) {
      case 'DIRECT_CHAT_STREAM':
        return '直接对话';
      case 'EXPLAIN_TEXT_STREAM':
        return '解释文本';
      case 'TRANSLATE_TEXT_STREAM':
        return '翻译文本';
      default:
        return '未知操作';
    }
  }

  createStreamResultContainer(originalText) {
    // 创建新的流式结果容器
    const resultContainer = document.createElement('div');
    resultContainer.className = 'result-container';
    resultContainer.innerHTML = `
      <div class="result-content">
        <div class="stream-content">正在处理中...</div>
      </div>
    `;

    // 插入到结果区域
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = '';
    resultArea.appendChild(resultContainer);
    
    // 隐藏状态消息
    const statusElement = document.getElementById('status');
    statusElement.style.display = 'none';
    
    return resultContainer;
  }

  updateStreamResult(container, content) {
    const streamContent = container.querySelector('.stream-content');
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

  showResultInPopup(result, originalText) {
    // 创建结果显示区域
    const resultContainer = document.createElement('div');
    resultContainer.className = 'result-container';
    resultContainer.innerHTML = `
      <div class="result-content">
        ${result}
      </div>
    `;

    // 插入到结果区域
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = '';
    resultArea.appendChild(resultContainer);
    
    // 隐藏状态消息
    const statusElement = document.getElementById('status');
    statusElement.style.display = 'none';
  }

  showStatus(message, type) {
    const statusElement = document.getElementById('status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';
    
    // 根据消息类型设置不同的显示时间
    const displayTime = type === 'success' ? 5000 : 3000; // 成功消息显示5秒，错误消息显示3秒
    
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, displayTime);
  }

  async loadModelName(){
    const res=await chrome.storage.sync.get(['modelName']);
    if(res.modelName){document.getElementById('modelName').value=res.modelName;this.showModelSaved();}
  }
  async saveModelName(){
    const name=document.getElementById('modelName').value.trim();
    if(!name){this.showStatus('请输入模型名称','error');return;}
    await chrome.storage.sync.set({modelName:name});
    chrome.runtime.sendMessage({type:'SET_MODEL_NAME',modelName:name});
    this.showModelSaved();this.showStatus('✅ 模型名称已保存','success');
  }
  showModelSaved(){document.getElementById('saveModelName').style.display='none';document.getElementById('updateModelName').style.display='block';}
  updateModelName(){document.getElementById('saveModelName').style.display='block';document.getElementById('updateModelName').style.display='none';this.showStatus('请修改模型名称','success');}
}

// 初始化弹出窗口脚本
new PopupScript();

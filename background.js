// 后台脚本 - 处理API调用和消息传递

// LLM API 服务类 - 使用豆包API
class LLMService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
  }

  async callAPI(prompt, model = 'doubao-seed-1-6-thinking-250715', stream = true, port = null) {
    try {
      console.log('LLM API调用开始:', { prompt: prompt.substring(0, 50) + '...', model, stream });
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              content: [
                {
                  text: prompt,
                  type: 'text'
                }
              ],
              role: 'user'
            }
          ],
          stream: stream
        })
      });

      console.log('API响应状态:', response.status);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      if (stream) {
        // 流式响应处理
        if (port) {
          // 如果提供了port，则通过port流式传输数据
          await this.handleStreamResponseWithPort(response, port);
          return; // 由handleStreamResponseWithPort处理完成
        } else {
          // 否则，收集完整结果后返回
          return this.handleStreamResponse(response);
        }
      } else {
        // 非流式响应处理
        const data = await response.json();
        console.log('API响应数据:', data);
        
        // 解析豆包API的响应格式
        const content = data.choices[0].message.content;
        console.log('解析的内容:', content);
        
        if (Array.isArray(content)) {
          // 如果是数组，取第一个文本内容
          for (const item of content) {
            if (item.type === 'text') {
              console.log('提取的文本内容:', item.text);
              return item.text;
            }
          }
        } else if (typeof content === 'string') {
          console.log('直接字符串内容:', content);
          return content;
        }
        
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('LLM API call failed:', error);
      throw error;
    }
  }

  async handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log('流式响应完成');
              return result;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const content = parsed.choices[0].delta.content;
                if (content) {
                  result += content;
                  console.log('流式内容:', content);
                }
              }
            } catch (e) {
              console.log('解析流式数据失败:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return result;
  }

  async handleStreamResponseWithPort(response, port) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      port.postMessage({ type: 'STREAM_START' });
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          port.postMessage({ type: 'STREAM_END' });
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              port.postMessage({ type: 'STREAM_END' });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const content = parsed.choices[0].delta.content;
                if (content) {
                  port.postMessage({ type: 'STREAM_DATA', content: content });
                }
              }
            } catch (e) {
              console.log('解析流式数据失败:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式响应处理失败:', error);
      port.postMessage({ type: 'STREAM_ERROR', error: error.message });
    } finally {
      reader.releaseLock();
    }
  }

  // 检索功能 - 对选中内容进行解释
  async explainText(text, stream = true) {
    const prompt = `请对以下内容进行解释：\n\n${text}`;
    return await this.callAPI(prompt, 'doubao-seed-1-6-thinking-250715', stream);
  }

  // 翻译功能
  async translateText(text, stream = true) {
    // 检测是否为中文
    const isChinese = /[\u4e00-\u9fff]/.test(text);
    
    if (isChinese) {
      // 如果是中文，直接解释
      return await this.explainText(text, stream);
    } else {
      // 如果不是中文，翻译成中文并解释
      const prompt = `请将以下内容翻译成中文，并对翻译结果进行解释：\n\n${text}`;
      return await this.callAPI(prompt, 'doubao-seed-1-6-thinking-250715', stream);
    }
  }

  // 语言检测功能
  detectLanguage(text) {
    const chineseRegex = /[\u4e00-\u9fff]/;
    const englishRegex = /[a-zA-Z]/;
    
    if (chineseRegex.test(text)) {
      return 'chinese';
    } else if (englishRegex.test(text)) {
      return 'english';
    } else {
      return 'unknown';
    }
  }
}

class BackgroundScript {
  constructor() {
    this.llmService = null;
    this.apiKey = null;
    this.modelName = 'doubao-seed-1-6-thinking-250715'; // 默认模型名称
    this.init();
  }

  async init() {
    // 从存储中获取API密钥和模型名称
    const result = await chrome.storage.sync.get(['apiKey', 'modelName']);
    this.apiKey = result.apiKey;
    this.modelName = result.modelName || 'doubao-seed-1-6-thinking-250715';
    
    if (this.apiKey) {
      try {
        this.llmService = new LLMService(this.apiKey);
        console.log('Background: LLMService初始化成功');
      } catch (error) {
        console.error('Background: LLMService初始化失败:', error);
      }
    }

    // 创建右键菜单
    this.createContextMenus();
    // 监听右键菜单点击
    chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));

    // 监听来自content script或popup的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    // 监听长连接
    chrome.runtime.onConnect.addListener(this.handleConnection.bind(this));
    console.log('Background: 消息和连接监听器已设置');
  }

  handleMessage(message, sender, sendResponse) {
    console.log('Background: 收到消息:', message.type);
    
    switch (message.type) {
      case 'TEXT_SELECTED':
        // 存储选中的文本，等待用户操作
        this.selectedText = message.text;
        break;
      case 'EXPLAIN_TEXT':
        // 非流式响应处理
        this.handleExplainText(message.text, false).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse('解释文本失败: ' + error.message);
        });
        return true; // 保持消息通道开放
      case 'TRANSLATE_TEXT':
        // 非流式响应处理
        this.handleTranslateText(message.text, false).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse('翻译文本失败: ' + error.message);
        });
        return true; // 保持消息通道开放
      case 'CUSTOM_PROMPT':
        // 自定义提示词处理
        this.handleCustomPrompt(message.text, message.prompt, false).then(result => {
          sendResponse(result);
        }).catch(error => {
          sendResponse('自定义处理失败: ' + error.message);
        });
        return true; // 保持消息通道开放
      case 'SET_API_KEY':
        this.setApiKey(message.apiKey);
        break;
      case 'SET_MODEL_NAME':
        this.modelName = message.modelName || 'doubao-seed-1-6-thinking-250715';
        chrome.storage.sync.set({ modelName: this.modelName });
        break;
    }
  }

  handleConnection(port) {
    console.log(`Background: ${port.name} 已连接`);
    
    port.onMessage.addListener((message) => {
      console.log('Background: 收到端口消息:', message);
      
      switch (message.type) {
        case 'EXPLAIN_TEXT_STREAM':
          this.handleStreamRequest(message.text, 'explain', port);
          break;
        case 'TRANSLATE_TEXT_STREAM':
          this.handleStreamRequest(message.text, 'translate', port);
          break;
        case 'DIRECT_CHAT_STREAM':
          this.handleStreamRequest(message.text, 'direct_chat', port);
          break;
        case 'CUSTOM_PROMPT_STREAM':
          this.handleStreamRequest(message.text, 'custom', port, message.prompt);
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      console.log(`Background: ${port.name} 已断开`);
    });
  }

  async handleStreamRequest(text, action, port, customPrompt = null) {
    try {
      if (!this.llmService) {
        throw new Error('API密钥未设置');
      }

      let prompt;
      if (action === 'explain') {
        prompt = `请对以下内容进行详细解释：\n\n${text}`;
      } else if (action === 'translate') {
        const isChinese = /[\u4e00-\u9fff]/.test(text);
        prompt = isChinese ? `请将以下内容翻译成英文：\n\n${text}` : `请将以下内容翻译成中文：\n\n${text}`;
      } else if (action === 'custom') {
        // 自定义prompt：如含 {text} 占位符则替换；否则直接拼接输入
        if (customPrompt && customPrompt.includes('{text}')) {
          prompt = customPrompt.replace('{text}', text);
        } else {
          prompt = `${customPrompt}\n\n${text}`;
        }
      } else { // direct_chat
        prompt = text;
      }
      
      // 直接调用流式API，并通过port传递数据
      await this.llmService.callAPI(prompt, this.modelName, true, port);

    } catch (error) {
      console.error(`Background: 流式处理失败 (${action}):`, error);
      port.postMessage({ type: 'STREAM_ERROR', error: error.message });
    } finally {
      port.disconnect();
    }
  }

  async handleExplainText(text, stream = false) {
    try {
      if (!this.llmService) {
        throw new Error('API密钥未设置');
      }

      const result = await this.llmService.explainText(text, stream);
      return result;
    } catch (error) {
      console.error('解释文本失败:', error);
      return '解释文本失败: ' + error.message;
    }
  }

  async handleTranslateText(text, stream = false) {
    try {
      if (!this.llmService) {
        throw new Error('API密钥未设置');
      }

      const result = await this.llmService.translateText(text, stream);
      return result;
    } catch (error) {
      console.error('翻译文本失败:', error);
      return '翻译文本失败: ' + error.message;
    }
  }

  async handleCustomPrompt(text, customPrompt, stream = false) {
    try {
      if (!this.llmService) {
        throw new Error('API密钥未设置');
      }

      let prompt;
      if (customPrompt && customPrompt.includes('{text}')) {
        prompt = customPrompt.replace('{text}', text);
      } else {
        prompt = `${customPrompt}\n\n${text}`;
      }
      const result = await this.llmService.callAPI(prompt, this.modelName, stream);
      return result;
    } catch (error) {
      console.error('自定义处理失败:', error);
      return '自定义处理失败: ' + error.message;
    }
  }

  async setApiKey(apiKey, modelName = 'doubao-seed-1-6-thinking-250715') {
    console.log('Background: 开始保存API密钥');
    this.apiKey = apiKey;
    
    try {
      this.llmService = new LLMService(apiKey);
      console.log('Background: LLMService创建成功');
    } catch (error) {
      console.error('Background: LLMService创建失败:', error);
      throw error;
    }
    
    // 保存到存储
    await chrome.storage.sync.set({ apiKey: apiKey });
    console.log('Background: API密钥保存完成');
  }

  showError(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'SHOW_RESULT',
        result: `<div style="color: red;">${message}</div>`,
        originalText: ''
      });
    });
  }

  createContextMenus() {
    chrome.contextMenus.removeAll(() => {
      const items = [
        {id:'explain-selected-text',title:'解释选中文本'},
        {id:'translate-selected-text',title:'翻译选中文本'},
        {id:'custom-selected-text',title:'自定义处理'}
      ];
      items.forEach(it=>{
        chrome.contextMenus.create({
          id:it.id,
          title:it.title,
          contexts:['selection']
        });
      });
    });
  }

  async handleContextMenuClick(info, tab){
    const selectedText = info.selectionText?.trim();
    if(!selectedText) return;
    // 打开弹窗
    await chrome.action.openPopup();
    // 等待 150ms 让 popup 初始化
    setTimeout(()=>{
      chrome.runtime.sendMessage({
        type:'CONTEXT_MENU_ACTION',
        text:selectedText,
        action:info.menuItemId
      });
    },150);
  }
}

// 初始化后台脚本
console.log('Background: 开始初始化后台脚本');
new BackgroundScript();
console.log('Background: 后台脚本初始化完成');

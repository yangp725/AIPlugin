// LLM API 服务类 - 使用豆包API
class LLMService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
  }

  async callAPI(prompt, model = 'doubao-seed-1-6-thinking-250715', stream = true) {
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
        return this.handleStreamResponse(response);
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

  // 检索功能 - 对选中内容进行解释
  async explainText(text, stream = true) {
    const prompt = `请对以下内容进行精简地解释：\n\n${text}`;
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
      const prompt = `请将以下内容翻译成中文，并对翻译结果进行简短解释，并对重点单词进行词汇分析，不要太长：\n\n${text}`;
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

// 兼容CommonJS和ES模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLMService;
}

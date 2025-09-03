# AI Plugin

一个Chrome浏览器扩展，用于查询和翻译选中的文本，使用豆包AI API。

## 功能特性

- 🔍 **文本解释**: 对选中的文本进行详细解释
- 🌐 **文本翻译**: 支持中英文互译
- 💬 **直接对话**: 与AI进行直接对话
- 🖱️ **右键菜单**: 在网页上选中文本后右键使用功能
- ⚡ **流式响应**: 实时显示AI响应内容
- 🎨 **简洁界面**: 现代化的白色按钮设计
- 💾 **历史缓存**: 自动保存上次的输入和输出结果

## 安装说明

### 1. 获取豆包AI API密钥
- 访问 [豆包AI控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/overview?briefPage=0&briefType=introduce&type=new)
- 注册并登录火山引擎账号
- 开通豆包AI服务并获取API密钥

### 2. 下载扩展
- 克隆或下载此仓库
- 确保包含所有必要文件

### 3. 在Chrome中加载扩展
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此项目文件夹

### 4. 配置API密钥
1. 点击扩展图标打开弹窗
2. 切换到"API 设置"标签页
3. 在"豆包AI API Key"输入框中输入您的API密钥
4. 点击"保存API密钥"按钮

### 5. 开始使用
- 在"API 设置"中确认API密钥已保存
- 开始使用文本解释和翻译功能

## 使用方法

### 方式一：在扩展弹窗中使用
1. 点击扩展图标打开弹窗
2. 在文本框中输入要处理的文本
3. 点击相应的功能按钮（直接对话、解释文本、翻译文本）

### 方式二：在网页上使用（推荐）
1. 在任意网页上选中要处理的文本
2. 右键选择"解释选中文本"或"翻译选中文本"
3. 插件会自动打开并处理选中的文本
4. 结果将显示在插件弹窗中

### 功能说明
- **直接对话**: 与AI进行自由对话
- **解释文本**: 对文本内容进行详细解释和分析
- **翻译文本**: 支持中英文互译，并提供词汇分析

## 文件结构

```
query_selection_extensions/
├── manifest.json          # 扩展清单文件
├── popup.html             # 弹窗界面
├── popup.js               # 弹窗逻辑
├── background.js          # 后台脚本
├── content.js             # 内容脚本
├── content.css            # 内容脚本样式
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # 项目说明
```

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **API**: [豆包AI API](https://console.volcengine.com/ark/region:ark+cn-beijing/overview?briefPage=0&briefType=introduce&type=new)
- **浏览器**: Chrome Extension Manifest V3
- **功能**: 流式响应, 右键菜单, 消息传递, 历史缓存

## 开发说明

### 核心文件说明

- `manifest.json`: 扩展配置，包含权限和文件引用
- `popup.html/js`: 用户界面和交互逻辑
- `background.js`: 后台服务，处理API调用和消息传递
- `content.js`: 页面内容脚本，处理文本选择和右键菜单

### 主要功能流程

1. **文本选择**: content.js监听文本选择事件
2. **用户操作**: 通过popup.js或右键菜单触发功能
3. **API调用**: background.js调用豆包AI API
4. **结果展示**: 流式显示结果到用户界面

## 注意事项

- 需要有效的豆包AI API密钥，可在[豆包AI控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/overview?briefPage=0&briefType=introduce&type=new)获取
- 确保网络连接正常
- 某些特殊页面（如chrome://）可能无法使用
- API调用需要账户余额充足
- 建议定期清理历史记录以节省存储空间
- API密钥通过Chrome扩展存储管理，安全可靠

## 许可证

MIT License

## 相关链接

- [豆包AI控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/overview?briefPage=0&briefType=introduce&type=new) - 获取API密钥
- [火山引擎官网](https://www.volcengine.com/) - 了解更多服务

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展。

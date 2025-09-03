# Query Selection Extensions

一个Chrome浏览器扩展，用于查询和翻译选中的文本，使用豆包AI API。

## 功能特性

- 🔍 **文本解释**: 对选中的文本进行详细解释
- 🌐 **文本翻译**: 支持中英文互译
- 💬 **直接对话**: 与AI进行直接对话
- 🖱️ **右键菜单**: 在网页上选中文本后右键使用功能
- ⚡ **流式响应**: 实时显示AI响应内容
- 🎨 **简洁界面**: 现代化的白色按钮设计

## 安装说明

### 1. 下载扩展
- 克隆或下载此仓库
- 确保包含所有必要文件

### 2. 配置API密钥
- 复制 `apis/key.example.txt` 为 `apis/key.txt`
- 编辑 `apis/key.txt`，将 `your_api_key_here` 替换为您的豆包AI API密钥

### 3. 在Chrome中加载
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此项目文件夹

### 4. 开始使用
- 点击扩展图标打开弹窗
- 在"API 设置"中确认API密钥已保存
- 开始使用文本解释和翻译功能

## 使用方法

### 方式一：在扩展弹窗中使用
1. 点击扩展图标打开弹窗
2. 在文本框中输入要处理的文本
3. 点击相应的功能按钮

### 方式二：在网页上使用（推荐）
1. 在任意网页上选中要处理的文本
2. 右键选择"解释选中文本"或"翻译选中文本"
3. 插件会自动打开并处理选中的文本
4. 结果将显示在插件弹窗中

## 文件结构

```
query_selection_extensions/
├── manifest.json          # 扩展清单文件
├── popup.html             # 弹窗界面
├── popup.js               # 弹窗逻辑
├── background.js          # 后台脚本
├── content.js             # 内容脚本
├── content.css            # 内容脚本样式
├── llm-service.js         # LLM API服务
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # 项目说明
```

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **API**: 豆包AI API
- **浏览器**: Chrome Extension Manifest V3
- **功能**: 流式响应, 右键菜单, 消息传递

## 开发说明

### 核心文件说明

- `manifest.json`: 扩展配置，包含权限和文件引用
- `popup.html/js`: 用户界面和交互逻辑
- `background.js`: 后台服务，处理API调用和消息传递
- `content.js`: 页面内容脚本，处理文本选择和右键菜单
- `llm-service.js`: LLM API服务封装

### 主要功能流程

1. **文本选择**: content.js监听文本选择事件
2. **用户操作**: 通过popup.js或右键菜单触发功能
3. **API调用**: background.js调用豆包AI API
4. **结果展示**: 流式显示结果到用户界面

## 注意事项

- 需要有效的豆包AI API密钥
- 确保网络连接正常
- 某些特殊页面（如chrome://）可能无法使用
- API调用需要账户余额充足

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展。

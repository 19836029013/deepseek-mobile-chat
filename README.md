# DeepSeek Mobile Chat

一个面向手机屏幕的 DeepSeek API 聊天网页，采用 iOS 风格界面。

## 功能

- 新建和切换多个对话
- 对话历史保存在当前浏览器本地
- DeepSeek 模型切换
- 思考深度：低 / 中 / 高
- 深度思考开关
- 手机键盘弹出时输入框自动避让
- 不内置 system prompt、提示词或额外约束；发送给 API 的消息保持原始 `role` / `content`

## 使用

打开网页后，进入设置，填入你自己的 DeepSeek API Key。Key 只保存在当前设备浏览器的 `localStorage`，不会提交到本仓库。

## 本地运行

```bash
npm ci
npm run dev
```

## GitHub Pages

项目通过 GitHub Actions 构建 `dist/client` 并发布到 Pages。推送到 `main` 后会自动部署。

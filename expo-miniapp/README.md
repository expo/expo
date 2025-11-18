# Expo MiniApp - 定制内容

这个目录包含所有**我们自己定制开发的小程序容器相关代码**，与上游 Expo 的 `packages/` 目录**完全分离**。

## 📁 目录结构

```
expo/
├── packages/                      # Expo 官方包（不要修改）
├── expo-miniapp/                  # 我们的定制内容（本目录）
│   ├── create-expo-miniapp-container/    # CLI 工具
│   ├── expo-dev-miniapp-launcher/        # 自定义启动器
│   └── README.md                          # 本文件
└── ...
```

## 🎯 为什么独立目录？

1. **清晰分离** - 一眼就能区分 Expo 官方代码和我们的定制代码
2. **避免冲突** - 更新上游 Expo 时不会影响我们的代码
3. **易于管理** - 可以单独维护、版本控制
4. **团队协作** - 新成员能快速找到定制代码

## 📦 包说明

### 1. create-expo-miniapp-container

**CLI 工具**，用于快速创建 MiniApp Container 项目。

**使用：**
```bash
npx create-expo-miniapp-container my-container
```

**功能：**
- 生成 bare React Native 项目
- 自动配置 expo-dev-miniapp-launcher
- 预设项目结构
- TypeScript 支持

📚 [详细文档](./create-expo-miniapp-container/README.md)

---

### 2. expo-dev-miniapp-launcher

**自定义开发启动器**，完全替代 expo-dev-launcher。

**特性：**
- 🎨 美观的自定义 UI
- 📷 QR 码扫描
- 🔌 手动 URL 输入
- 📚 最近使用记录

📚 [详细文档](./expo-dev-miniapp-launcher/README.md)

---

## 🚀 快速开始

### 开发 CLI 工具

```bash
cd expo-miniapp/create-expo-miniapp-container
npm install
npm run build

# 测试
npx . test-project
```

### 开发 Launcher

```bash
cd expo-miniapp/expo-dev-miniapp-launcher

# 修改 UI
vim android/src/debug/java/expo/modules/devminiapplauncher/ui/MiniAppHomeScreen.kt

# 在测试项目中使用
cd ../test-project
npm install
npx expo run:android
```

---

## 🔄 更新上游 Expo

由于我们的代码在独立目录，更新非常简单：

```bash
# 1. 拉取上游更新
git fetch upstream
git merge upstream/main

# 2. 我们的 expo-miniapp/ 目录不受影响！

# 3. 如有冲突，只可能在文档中，代码完全隔离
```

---

## 📝 开发规范

### 提交规范

```bash
# 修改 CLI
git commit -m "feat(cli): add new option"

# 修改 Launcher
git commit -m "feat(launcher): add feature"

# 修改文档
git commit -m "docs(miniapp): update guide"
```

### 文件组织

保持清晰的结构：

```
expo-miniapp/<package-name>/
├── src/              # 源代码
├── android/          # Android 原生
├── ios/              # iOS 原生
├── plugin/           # Config plugin
├── package.json
└── README.md
```

---

## 🧪 测试

```bash
# 测试 CLI
cd create-expo-miniapp-container
npm test

# 创建测试项目
npx . test-output
cd test-output
npm install
npx expo prebuild
npx expo run:android
```

---

## 🌟 路线图

### v0.2.0 - 基础功能
- [ ] iOS UI (SwiftUI)
- [ ] QR 扫描实现
- [ ] 自动发现开发服务器

### v0.3.0 - 小程序加载
- [ ] Manifest 解析
- [ ] Bundle 加载
- [ ] 运行时引擎

### v1.0.0 - 生产就绪
- [ ] 完整小程序管理
- [ ] 离线包支持
- [ ] 权限系统

---

## 📚 文档

- [CLI 工具](./create-expo-miniapp-container/README.md)
- [Launcher](./expo-dev-miniapp-launcher/README.md)
- [测试指南](./create-expo-miniapp-container/TESTING.md)
- [MVP 总结](../MVP_V2_SUMMARY.md)

---

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

## 📄 许可证

MIT

---

**维护者：** MiniApp Container Team
**最后更新：** 2025-11-18

# create-expo-miniapp-container

创建 Expo 小程序容器的 CLI 工具 - 快速搭建基于 Expo 的动态小程序运行环境。

## 使用方法

创建新的小程序容器项目：

```bash
npx create-expo-miniapp-container my-container
```

或使用交互式提示：

```bash
npx create-expo-miniapp-container
```

## 什么是小程序容器？

小程序容器是一个原生 App，可以动态加载和运行小程序（独立的小型应用）。它提供：

- 🔄 从二维码或离线包动态加载小程序
- 🛠️ 自定义开发者工具 UI
- 🔌 完全兼容 Expo 开发工作流
- 📦 离线包管理
- 🔒 沙箱化执行环境

## 功能特性

生成的项目包含：

- ✅ Expo SDK 52 + Bare 工作流支持
- ✅ 集成自定义 expo-dev-miniapp-launcher
- ✅ TypeScript 配置
- ✅ 为小程序容器优化的项目结构
- ✅ 可自定义的开发启动器 UI

## 命令选项

```
用法:
  npx create-expo-miniapp-container [项目名称] [选项]

选项:
  -h, --help              显示帮助信息
  -v, --version           显示版本号
  -y, --yes               跳过所有提示，使用默认值
  --template <名称>       使用指定模板 (默认: 'default')
```

## ⚠️ 重要：路径配置

创建项目后，你需要根据实际情况配置 `expo-dev-miniapp-launcher` 的路径。

### 场景 1：在 expo 仓库内创建项目（开发模式）

如果你在 expo 仓库根目录创建项目：

```
expo/
├── expo-miniapp/
│   └── expo-dev-miniapp-launcher/
└── my-container/  ← 你的项目
```

修改 `package.json` 中的路径为：

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:../expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

### 场景 2：在任意位置创建项目（使用已发布的包）

如果 `expo-dev-miniapp-launcher` 已发布到 npm，直接使用版本号：

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "~0.1.0"
  }
}
```

### 场景 3：使用绝对路径（临时方案）

如果需要使用绝对路径：

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:/绝对路径/expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

## 后续步骤

创建项目后：

1. **配置依赖路径**（重要！）：
   - 根据上面的场景说明，编辑 `package.json`
   - 确保 `expo-dev-miniapp-launcher` 的路径正确

2. 安装依赖：
   ```bash
   cd my-container
   npm install
   ```

3. 生成原生项目：
   ```bash
   npx expo prebuild
   ```

4. 在设备上运行：
   ```bash
   npx expo run:android
   # 或
   npx expo run:ios
   ```

5. 自定义开发启动器 UI：
   - 编辑 `expo-miniapp/expo-dev-miniapp-launcher` 包
   - 修改 Android/iOS 的原生 UI 组件
   - 重新构建项目查看效果

## 项目结构

```
my-container/
├── src/
│   ├── components/       # 可复用组件
│   ├── screens/          # 屏幕组件
│   ├── navigation/       # 导航配置
│   └── services/         # 业务逻辑和服务
├── assets/              # 资源文件
├── App.tsx             # 主应用组件
├── app.json            # Expo 配置
└── package.json        # 依赖配置
```

## 相关文档

- [测试指南](./TESTING.md)
- [expo-dev-miniapp-launcher 文档](../expo-dev-miniapp-launcher/README.md)
- [expo-miniapp 总览](../README.md)

## 许可证

MIT

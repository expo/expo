# 配置指南

**版本**: MVP v2.0
**日期**: 2025-11-18

---

## 📋 目录

1. [快速开始](#快速开始)
2. [路径配置详解](#路径配置详解)
3. [开发环境配置](#开发环境配置)
4. [生产环境配置](#生产环境配置)
5. [常见问题](#常见问题)
6. [故障排除](#故障排除)

---

## 快速开始

### 1. 创建项目

```bash
# 在 expo 仓库根目录
cd /path/to/expo
npx create-expo-miniapp-container my-container
```

### 2. 配置依赖路径

**重要**：创建项目后，必须先配置 `expo-dev-miniapp-launcher` 的路径！

编辑 `my-container/package.json`：

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:../expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

### 3. 安装依赖

```bash
cd my-container
npm install
```

### 4. 生成原生项目

```bash
npx expo prebuild
```

### 5. 运行项目

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## 路径配置详解

### 为什么需要配置路径？

`expo-dev-miniapp-launcher` 是本地开发的包，还未发布到 npm。因此需要使用 `file:` 协议指定本地路径。

路径配置取决于：
- 项目创建位置
- expo 仓库位置
- 是否使用已发布的包

### 配置场景

#### 场景 1：在 expo 仓库根目录创建（推荐）

**目录结构**：
```
expo/
├── expo-miniapp/
│   ├── create-expo-miniapp-container/
│   └── expo-dev-miniapp-launcher/    ← 本地包位置
├── packages/                           ← Expo 官方包
└── my-container/                       ← 你的项目
```

**配置**：
```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:../expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

**路径解释**：
- `my-container/` → `../` → `expo/` → `expo-miniapp/expo-dev-miniapp-launcher/`

---

#### 场景 2：在 expo 仓库外创建

**目录结构**：
```
/home/user/
├── expo/
│   └── expo-miniapp/
│       └── expo-dev-miniapp-launcher/    ← 本地包位置
└── projects/
    └── my-container/                     ← 你的项目
```

**配置选项 A**：使用相对路径
```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:../../expo/expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

**配置选项 B**：使用绝对路径（不推荐，不便于团队协作）
```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:/home/user/expo/expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

---

#### 场景 3：使用已发布的 npm 包（生产环境）

当 `expo-dev-miniapp-launcher` 发布到 npm 后：

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "~0.1.0"
  }
}
```

---

#### 场景 4：使用 GitHub Packages

如果发布到 GitHub Packages：

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "github:your-org/expo#expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

---

## 开发环境配置

### 本地开发

**目标**：在修改 `expo-dev-miniapp-launcher` 代码时，容器项目能实时获取更新。

**方法 1：使用 file: 协议（推荐）**

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:../expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

**优点**：
- ✅ 修改代码后，重新运行 `npm install` 即可同步
- ✅ 简单直接

**缺点**：
- ❌ 每次修改后需要重新安装依赖

---

**方法 2：使用 npm link（高级）**

```bash
# 1. 在 expo-dev-miniapp-launcher 目录
cd expo-miniapp/expo-dev-miniapp-launcher
npm link

# 2. 在容器项目目录
cd my-container
npm link expo-dev-miniapp-launcher
```

**优点**：
- ✅ 修改代码后立即生效，无需重新安装

**缺点**：
- ❌ 配置稍复杂
- ❌ 可能遇到符号链接相关问题

---

### 多项目开发

如果同时开发多个容器项目：

**目录结构**：
```
expo/
├── expo-miniapp/
│   └── expo-dev-miniapp-launcher/
├── container-app-1/
├── container-app-2/
└── container-app-3/
```

**每个项目的配置**：
```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:../expo-miniapp/expo-dev-miniapp-launcher"
  }
}
```

---

## 生产环境配置

### 发布到 npm

**步骤 1：准备发布**

```bash
cd expo-miniapp/expo-dev-miniapp-launcher

# 确保版本号正确
npm version 0.1.0

# 登录 npm（如果未登录）
npm login

# 发布
npm publish
```

**步骤 2：更新容器项目**

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "~0.1.0"
  }
}
```

---

### 私有 npm Registry

如果使用私有 npm registry（如 Verdaccio、Artifactory）：

**配置 .npmrc**：
```
registry=https://your-registry.com/
//your-registry.com/:_authToken=${NPM_TOKEN}
```

**package.json**：
```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "~0.1.0"
  }
}
```

---

## 常见问题

### Q1: 运行 npm install 时报错 "Cannot find module 'expo-dev-miniapp-launcher'"

**原因**：路径配置不正确。

**解决方案**：
1. 检查 `package.json` 中的路径是否正确
2. 使用绝对路径测试：
   ```json
   "expo-dev-miniapp-launcher": "file:/full/path/to/expo-miniapp/expo-dev-miniapp-launcher"
   ```
3. 确保目标目录存在且包含 `package.json`

---

### Q2: 修改 expo-dev-miniapp-launcher 代码后，容器项目没有更新

**原因**：npm 的 `file:` 依赖默认缓存。

**解决方案**：
```bash
# 方法 1：强制重新安装
rm -rf node_modules package-lock.json
npm install

# 方法 2：使用 npm link（见上文）

# 方法 3：修改版本号
# 在 expo-dev-miniapp-launcher/package.json 中
"version": "0.1.1"  # 递增版本号
```

---

### Q3: 团队协作时，每个人的路径都不同怎么办？

**解决方案 1：统一目录结构（推荐）**

团队约定：所有人都在 expo 仓库根目录创建项目。

**解决方案 2：使用环境变量**

```json
{
  "dependencies": {
    "expo-dev-miniapp-launcher": "file:${EXPO_MINIAPP_PATH}/expo-dev-miniapp-launcher"
  }
}
```

每个人在 `.bashrc` 或 `.zshrc` 中设置：
```bash
export EXPO_MINIAPP_PATH=/path/to/expo/expo-miniapp
```

**解决方案 3：发布到私有 npm registry**

---

### Q4: 如何验证路径配置是否正确？

**验证命令**：
```bash
# 查看已安装的包
npm ls expo-dev-miniapp-launcher

# 查看包的实际路径
npm ls expo-dev-miniapp-launcher --parseable

# 检查包是否可用
node -e "require('expo-dev-miniapp-launcher')"
```

---

## 故障排除

### 问题：npm install 失败

**检查清单**：
- [ ] 路径是否正确？
- [ ] 目标目录是否存在？
- [ ] 目标目录是否包含 `package.json`？
- [ ] 是否有文件权限问题？

**调试步骤**：
```bash
# 1. 测试路径
ls -la ../expo-miniapp/expo-dev-miniapp-launcher/package.json

# 2. 使用绝对路径测试
npm install file:/absolute/path/to/expo-miniapp/expo-dev-miniapp-launcher

# 3. 检查 npm 日志
npm install --loglevel=verbose
```

---

### 问题：Expo prebuild 失败

**常见原因**：
- 依赖未正确安装
- 原生配置冲突

**解决步骤**：
```bash
# 1. 清理并重新安装
rm -rf node_modules android ios
npm install

# 2. 清理预构建
npx expo prebuild --clean

# 3. 检查 expo-module.config.json
cat node_modules/expo-dev-miniapp-launcher/expo-module.config.json
```

---

### 问题：Android 构建失败

**检查**：
1. `expo-dev-miniapp-launcher/android/build.gradle` 配置
2. 命名空间是否正确：`expo.modules.devminiapplauncher`
3. Gradle 缓存：
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo run:android
   ```

---

## 最佳实践

### ✅ 推荐做法

1. **统一目录结构**：所有容器项目都在 expo 仓库根目录创建
2. **使用相对路径**：避免绝对路径，便于团队协作
3. **版本管理**：本地开发用 `file:`，生产环境用版本号
4. **文档同步**：在项目 README 中说明路径配置

### ❌ 不推荐做法

1. **硬编码绝对路径**：难以团队协作
2. **混用多种路径方式**：容易混淆
3. **忽略路径验证**：导致后续问题

---

## 总结

| 场景 | 路径配置 | 优点 | 缺点 |
|------|---------|------|------|
| expo 根目录 | `file:../expo-miniapp/...` | 简单，团队统一 | 限制项目位置 |
| 任意位置 | `file:../../path/...` | 灵活 | 路径复杂 |
| npm 发布 | `~0.1.0` | 标准，易用 | 需发布流程 |
| GitHub | `github:org/repo#path` | 版本控制 | 依赖 GitHub |

**推荐**：
- 开发环境：使用相对路径 `file:`
- 生产环境：发布到 npm，使用版本号

---

**最后更新**: 2025-11-18
**维护者**: AI Assistant

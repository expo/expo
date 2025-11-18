# create-expo-miniapp-container

Create Expo MiniApp Container - A CLI tool to bootstrap a new Expo-based mini-app container project.

## Usage

Create a new mini-app container project:

```bash
npx create-expo-miniapp-container my-container
```

Or with interactive prompts:

```bash
npx create-expo-miniapp-container
```

## What is a MiniApp Container?

A MiniApp Container is a native app that can dynamically load and run mini-apps (small, self-contained applications). It provides:

- 🔄 Dynamic loading of mini-apps from QR codes or offline packages
- 🛠️ Custom development tools UI
- 🔌 Expo-compatible development workflow
- 📦 Offline package management
- 🔒 Sandboxed execution environment

## Features

The generated project includes:

- ✅ Expo SDK 52 with bare workflow support
- ✅ Custom expo-dev-client integration
- ✅ TypeScript configuration
- ✅ Project structure optimized for mini-app container
- ✅ Ready-to-customize development launcher UI

## Options

```
Usage:
  npx create-expo-miniapp-container [project-name] [options]

Options:
  -h, --help              Show help message
  -v, --version           Show version number
  -y, --yes               Skip all prompts and use default values
  --template <name>       Use a specific template (default: 'default')
```

## Next Steps

After creating your project:

1. Install dependencies:
   ```bash
   cd my-container
   npm install
   ```

2. Generate native projects:
   ```bash
   npx expo prebuild
   ```

3. Run on device:
   ```bash
   npx expo run:android
   # or
   npx expo run:ios
   ```

4. Customize the dev launcher UI in your fork of expo-dev-launcher

## License

MIT

# expo-dev-miniapp-launcher

Custom development launcher for Expo MiniApp Container - **fully decoupled** from `expo-dev-launcher`.

## Why a separate package?

This package is a complete reimplementation of the development launcher UI, specifically designed for the MiniApp Container project. By creating a separate package instead of modifying `expo-dev-launcher`, we:

- ✅ Avoid conflicts when updating the upstream Expo repository
- ✅ Maintain full control over the UI and functionality
- ✅ Can iterate independently without affecting the original package
- ✅ Keep the codebase clean and maintainable

## Features

- 🎨 **Custom UI** - Beautiful, modern interface designed for mini-app loading
- 📱 **QR Code Scanner** - Quick connection to development servers
- 🔌 **Manual URL Input** - Connect to any development server
- 📚 **Recent Apps** - Track recently opened mini-apps
- 🌐 **Fully Compatible** - Works with standard Expo development workflow

## Installation

```bash
npm install expo-dev-miniapp-launcher
```

Or use the `create-expo-miniapp-container` CLI:

```bash
npx create-expo-miniapp-container my-container
```

## Configuration

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-dev-miniapp-launcher",
        {
          "enabled": true,
          "launchMode": "launcher"
        }
      ]
    ]
  }
}
```

### Options

- `enabled` (boolean, default: `true`) - Enable or disable the launcher
- `launchMode` (string, default: `'launcher'`) - Launch mode:
  - `'launcher'` - Always show the launcher UI
  - `'most-recent'` - Try to load the most recent app first

## Usage

The launcher will automatically appear when you run:

```bash
npx expo run:android
# or
npx expo run:ios
```

### Features

1. **Scan QR Code** - Point your camera at a QR code from `npx expo start`
2. **Enter URL Manually** - Type in your development server address (e.g., `http://192.168.1.100:8081`)
3. **Recent Apps** - Quick access to previously loaded apps

## Development

### Building

```bash
cd packages/expo-dev-miniapp-launcher
npm run build
```

### Testing

```bash
# Create a test project
npx create-expo-miniapp-container test-container
cd test-container

# Link to local package
npm install file:../expo/packages/expo-dev-miniapp-launcher

# Run
npx expo run:android
```

## Architecture

```
expo-dev-miniapp-launcher/
├── android/                    # Android native code
│   └── src/
│       ├── main/              # Main module
│       └── debug/             # Debug-only UI
│           └── ui/
│               └── MiniAppHomeScreen.kt  # Custom Compose UI
├── ios/                       # iOS native code (TODO)
├── plugin/                    # Expo config plugin
│   └── src/
│       └── index.ts
└── package.json
```

## Comparison with expo-dev-launcher

| Feature | expo-dev-launcher | expo-dev-miniapp-launcher |
|---------|-------------------|---------------------------|
| Purpose | General Expo development | MiniApp Container specific |
| UI | Standard dev tools | Custom mini-app UI |
| Updates | Managed by Expo team | Independent versioning |
| Customization | Limited | Full control |
| Conflicts | May conflict on updates | No conflicts |

## Roadmap

- [x] Android custom UI
- [ ] iOS custom UI (SwiftUI)
- [ ] Mini-app manifest parser
- [ ] Offline package loader
- [ ] Mini-app permissions system
- [ ] Hot reload for mini-apps

## Contributing

This package is part of the MiniApp Container project. Contributions welcome!

## License

MIT

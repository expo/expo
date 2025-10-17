# expo-window-tint-color

Config plugin to set iOS `window.tintColor` from `app.json` during prebuild.

## Installation

```bash
npx expo install expo-window-tint-color
```

## Configuration in app.json / app.config.js

### Basic Usage

Add the plugin to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "windowTintColor": "#FF6C1A"
    },
    "plugins": ["expo-window-tint-color"]
  }
}
```

### With Plugin Props

You can also pass the color directly to the plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-window-tint-color",
        {
          "windowTintColor": "#FF6C1A"
        }
      ]
    ]
  }
}
```

### Shorthand Syntax

Or use the shorthand string syntax:

```json
{
  "expo": {
    "plugins": [["expo-window-tint-color", "#FF6C1A"]]
  }
}
```

## API

### Plugin Props

| Prop               | Type     | Description                                         |
| ------------------ | -------- | --------------------------------------------------- |
| `windowTintColor` | `string` | Hex color string for window tint color (e.g., "#FF6C1A") |

## How It Works

This plugin injects `window.tintColor` into your iOS `AppDelegate.swift` file during `expo prebuild`. The injected code looks like this:

```swift
// Set global tint color (injected by expo-window-tint-color plugin)
// This works around iOS 26 bug where inline tab bar layout ignores per-item tint colors
if let window = window {
  window.tintColor = UIColor(red: 1.0, green: 0.423529, blue: 0.101961, alpha: 1.0) // #FF6C1A
}
```

### Why This Is Needed

On iOS 26, iPads using the inline tab bar layout (icon beside text) ignore per-item `UITabBarItemAppearance` tint colors and default to system blue, even when colors are correctly set via `tintColor` props in expo-router's `NativeTabs`. This appears to be an iOS 26 bug.

Setting the global `window.tintColor` provides a fallback that iOS 26 uses when the per-item appearance color fails to apply.

### Supported iOS Versions

- ✅ iOS 26.0 and later (fixes inline tab bar color bug)
- ✅ iOS 25.x and earlier (works as expected)

### Compatibility

- ✅ iPhone (stacked tab bar layout)
- ✅ iPad (inline tab bar layout)
- ✅ Expo SDK 50+
- ✅ React Native 0.74+

## Usage with Continuous Native Generation (CNG)

This plugin is designed for use with [Continuous Native Generation (CNG)](https://docs.expo.dev/workflow/continuous-native-generation/), where your `ios/` directory is generated on-demand and not committed to version control.

1. Add `ios/` to your `.gitignore`
2. Configure the plugin in `app.json`
3. Run `npx expo prebuild` to generate native projects
4. The plugin automatically injects the tint color code

## Manual Setup (Without Plugin)

If you're not using CNG and want to set the window tint color manually:

1. Open `ios/YourApp/AppDelegate.swift`
2. Find the line `window = UIWindow(frame: UIScreen.main.bounds)`
3. Add this code immediately after:

```swift
// Set global tint color
if let window = window {
  window.tintColor = UIColor(red: 1.0, green: 0.423529, blue: 0.101961, alpha: 1.0) // #FF6C1A
}
```

## Troubleshooting

### Plugin not working

- Ensure you're using `expo prebuild` (not `npx react-native init`)
- Check that `AppDelegate.swift` exists (not `AppDelegate.m`)
- Verify the plugin is listed in your `app.json` plugins array

### Color not changing

- Run `npx expo prebuild --clean` to regenerate native projects
- Check `ios/YourApp/AppDelegate.swift` to verify the code was injected
- Ensure the hex color format is valid (e.g., "#FF6C1A" or "FF6C1A")

### TypeScript errors

- Make sure you're using a recent version of Expo SDK (50+)
- Run `npx expo install --check` to verify package compatibility

## Contributing

Contributions are welcome! Please read the [contributing guidelines](https://github.com/expo/expo/blob/main/CONTRIBUTING.md) before submitting a PR.

## License

MIT

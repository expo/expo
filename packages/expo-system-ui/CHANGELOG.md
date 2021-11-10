# Changelog

## Unpublished

### 🛠 Breaking changes

- Change iOS to set the background color of the first view controller in the hierarchy instead of the current active view controller.

### 🎉 New features

- iOS now sets the background color of the base window to support native-stack modals.
- Initial background color on iOS will now be set inside the module instead of in the template.

### 🐛 Bug fixes

- Fix `getBackgroundColorAsync` return type. ([#15127](https://github.com/expo/expo/pull/15127) by [@EvanBacon](https://github.com/EvanBacon))

### 💡 Others

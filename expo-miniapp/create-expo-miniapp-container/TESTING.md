# Testing the MiniApp Container MVP

## 🎯 MVP Overview

This MVP provides:
1. ✅ A CLI tool to create MiniApp Container projects
2. ✅ Custom dev launcher UI with branding
3. ✅ Bare workflow project template
4. ⚠️ Basic project structure (mini-app loading to be added in next iteration)

## 📦 Build the CLI Tool

First, you need to build the CLI tool from source:

```bash
# Navigate to the CLI package
cd packages/create-expo-miniapp-container

# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally for testing
npm link
```

## 🚀 Create a Test Project

### Method 1: Using the linked CLI

```bash
# Create a new project
create-expo-miniapp-container my-test-container

# Or with prompts
create-expo-miniapp-container
```

### Method 2: Using npx with local path

```bash
# From the expo repo root
npx ./packages/create-expo-miniapp-container my-test-container
```

### Method 3: Direct execution

```bash
# From the expo repo root
node packages/create-expo-miniapp-container/build/index.js my-test-container
```

## 🔧 Setup the Test Project

After creating the project:

```bash
cd my-test-container

# Install dependencies
npm install

# For the custom dev launcher UI to work, you need to link to your fork
# Edit package.json to point to your local expo packages:
```

Edit `package.json`:

```json
{
  "dependencies": {
    "expo-dev-client": "file:../path/to/expo/packages/expo-dev-client",
    "expo-dev-launcher": "file:../path/to/expo/packages/expo-dev-launcher",
    "expo-dev-menu": "file:../path/to/expo/packages/expo-dev-menu"
  }
}
```

Then:

```bash
# Reinstall with local packages
npm install

# Generate native projects
npx expo prebuild

# Or for clean prebuild
npx expo prebuild --clean
```

## 📱 Run on Device/Emulator

### Android

```bash
# Make sure Android emulator is running or device is connected
npx expo run:android
```

### iOS (macOS only)

```bash
# Make sure iOS simulator is running
npx expo run:ios
```

## ✅ Verification Checklist

When the app launches, you should see:

1. **Custom Dev Launcher UI:**
   - [ ] Purple welcome banner with "🚀 MiniApp Container"
   - [ ] Text: "Ready to load mini-apps dynamically!"
   - [ ] Text: "Scan QR code or connect to development server"

2. **Original Dev Launcher Features:**
   - [ ] App header with app icon
   - [ ] "DEVELOPMENT SERVERS" section
   - [ ] Local network packager discovery
   - [ ] Manual URL input (accordion)
   - [ ] "RECENTLY OPENED" section (if any)

3. **Functionality:**
   - [ ] Can scan QR codes (camera permission required)
   - [ ] Can manually enter dev server URL
   - [ ] Can connect to Metro bundler
   - [ ] Hot reload works

## 🐛 Troubleshooting

### CLI Build Fails

```bash
# Clean and rebuild
cd packages/create-expo-miniapp-container
npm run clean
npm install
npm run build
```

### "expo-module-scripts not found"

Install from the repo root:

```bash
cd /path/to/expo
npm install
```

### Custom UI Not Showing

Make sure you're using the local packages:

```bash
# Check package.json has file: paths
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild native projects
npx expo prebuild --clean
```

### Build Errors

```bash
# Android: Clean gradle cache
cd android
./gradlew clean
cd ..

# iOS: Clean build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

## 📊 Expected Output

### CLI Output

```
🚀 Create Expo MiniApp Container

What is your project named? my-test-container
✔ Project files created
✔ Git repository initialized

✅ MiniApp Container created successfully!

Next steps:
  cd my-test-container
  npm install
  npx expo run:android
  # or
  npx expo run:ios
```

### Dev Launcher Screen

```
┌─────────────────────────────────────┐
│  [Icon]  MiniApp Container    [👤]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🚀 MiniApp Container            │ │
│ │ Ready to load mini-apps         │ │
│ │ dynamically!                    │ │
│ │ Scan QR code or connect to dev  │ │
│ │ server                          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ DEVELOPMENT SERVERS           [INFO]│
│                                     │
│ [No development servers found]      │
│ [Or local dev servers listed]       │
│                                     │
│ ▼ New development server            │
│   [Scan QR Code]                    │
│   [Enter URL manually]              │
│                                     │
└─────────────────────────────────────┘
```

## 🎉 Success Criteria

Your MVP is successful if:

1. ✅ CLI tool creates a project without errors
2. ✅ Generated project has correct structure
3. ✅ `npm install` completes successfully
4. ✅ `expo prebuild` generates native projects
5. ✅ App builds and runs on Android/iOS
6. ✅ Custom welcome banner is visible
7. ✅ All original dev launcher features work
8. ✅ Can connect to Metro and load JS bundles

## 📝 Next Steps

After MVP validation:

1. Add mini-app manifest parser
2. Implement QR code mini-app loading
3. Add offline package installer
4. Create mini-app API bridge
5. Add mini-app list management UI

## 📚 Reference

- CLI source: `packages/create-expo-miniapp-container/src/`
- Custom UI: `packages/expo-dev-launcher/android/.../HomeScreen.kt`
- Project template: Generated in `src/create.ts`

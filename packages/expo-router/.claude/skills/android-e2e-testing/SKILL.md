---
name: android-e2e-testing
description: Test Expo Router features on Android emulators using ADB. Use after implementing native Android features or when verifying UI behavior on Android.
user-invokable: true
---

# Android E2E Testing for Expo Router

Use `adb` to manually test Expo Router screens and components on Android emulators.

## When to Use

- After implementing or modifying native Android UI components (toolbars, tabs, menus)
- When verifying Jetpack Compose components (`@expo/ui/jetpack-compose`)
- When running the `native-navigation` or other E2E apps on Android
- Before opening a PR that touches Android-specific behavior

## Prerequisites

An Android emulator must be running. Prefer **Pixel emulators** over tablet ones for standard phone-sized testing.

```bash
# Verify emulator is connected
adb devices

# Check which emulator is running
adb -s DEVICE_ID emu avd name

# Check screen resolution (important for coordinate calculations)
adb -s DEVICE_ID shell wm size
```

## Step 1: Build and Launch

### Router E2E apps

Package name: `dev.expo.routere2e`

Each app in `apps/router-e2e/__e2e__/` has a corresponding `yarn android:<name>` script. Check `apps/router-e2e/package.json` for available scripts.

```bash
cd apps/router-e2e
yarn android:[APP_NAME]   # e.g. yarn android:native-navigation
```

If the app is already built, relaunch it:

```bash
adb shell monkey -p dev.expo.routere2e -c android.intent.category.LAUNCHER 1
```

To find the package name of any installed app:

```bash
adb shell pm list packages | grep -i <keyword>
```

## Step 2: Navigate Using UI Dump

**CRITICAL: Always use `uiautomator dump` for element coordinates.** Screenshot pixel coordinates have display scaling factors that make them unreliable for `adb shell input tap`. The UI dump provides actual device coordinates.

### Dump the view hierarchy

```bash
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml
```

This returns XML with every UI element including:
- `text` — displayed text
- `content-desc` — accessibility description (useful for icon buttons)
- `bounds` — position as `[left,top][right,bottom]`
- `clickable` — whether the element responds to taps
- `class` — Android view class

### Find and tap an element

1. Search the XML for your target element by `text` or `content-desc`
2. Extract the `bounds` attribute: `bounds="[left,top][right,bottom]"`
3. Calculate center: `x = (left + right) / 2`, `y = (top + bottom) / 2`
4. Tap:

```bash
adb shell input tap <x> <y>
```

**Example:** For `bounds="[367,498][714,633]"`:
- x = (367 + 714) / 2 = 540
- y = (498 + 633) / 2 = 565

```bash
adb shell input tap 540 565
```

### Wait for navigation to settle

After tapping a navigation element, wait before verifying:

```bash
sleep 1
```

For slow transitions or heavy screens, use `sleep 2`.

## Step 3: Interact

### Tap items

```bash
adb shell input tap <x> <y>
```

### Scroll

```bash
# Scroll down
adb shell input swipe 540 1500 540 500 300

# Scroll up
adb shell input swipe 540 500 540 1500 300

# Scroll further (larger distance)
adb shell input swipe 540 1500 540 200 500
```

### Type text

```bash
adb shell input text "hello%sworld"   # %s = space
```

### Press hardware buttons

```bash
adb shell input keyevent 4    # Back
adb shell input keyevent 3    # Home
adb shell input keyevent 82   # Menu / React Native dev menu
```

### Long press

```bash
adb shell input swipe <x> <y> <x> <y> 1000
```

## Step 4: Verify

### Visual verification via screenshot

```bash
adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png /tmp/screenshot.png
```

Then use the `Read` tool to view `/tmp/screenshot.png`. Screenshots are useful for:
- Confirming visual appearance (colors, layout, styling)
- Verifying toolbar/tab positioning
- Checking selection states and visual feedback

**Note:** Use screenshots for *visual* verification only. For element positions and tapping, always use `uiautomator dump`.

### Programmatic verification via UI dump

```bash
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml
```

Search the XML for expected content:
- Verify text content appears
- Check `content-desc` for accessibility labels
- Confirm element presence after navigation
- Verify selection states (look for checkmarks, content-desc changes)

### Check for errors

```bash
# React Native JS errors
adb logcat -d -s ReactNativeJS:E | tail -20

# Crash logs
adb logcat -b crash -d

# All recent errors
adb logcat -d *:E | tail -30
```

## Step 5: Report Results

After testing, summarize results in a table:

| Test | Result |
|------|--------|
| Navigation to screen | PASS/FAIL |
| Component renders correctly | PASS/FAIL |
| Interaction works | PASS/FAIL |
| No JS errors in logcat | PASS/FAIL |

Include details for any failures: what was expected vs what happened, relevant logcat output, and screenshots.

Preferably attach screenshots for features you tested.

## Testing Jetpack Compose Components

Components from `@expo/ui/jetpack-compose` (like `HorizontalFloatingToolbar`, `IconButton`, `Host`) render as Compose views inside React Native. In UI dumps they appear as:

- `androidx.compose.ui.platform.ComposeView` — the Compose container
- `android.widget.HorizontalScrollView` — inside toolbar layouts
- `android.widget.Button` — Compose buttons
- `android.view.View` with `content-desc` — icon buttons with accessibility labels

When testing Compose components:
1. Look for `content-desc` attributes to identify buttons (e.g., `content-desc="Clear selection"`)
2. The `ComposeView` wrapper may have different bounds than the inner interactive elements
3. Tap the interactive element's bounds, not the container's

## Troubleshooting

### uiautomator dump fails or returns empty

This can happen during animations or transitions. Wait and retry:

```bash
sleep 2 && adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml
```

### Tap doesn't register

- Recalculate coordinates from a fresh UI dump — the layout may have shifted
- Ensure you're tapping a `clickable="true"` element
- Try tapping the parent element if the child isn't clickable

### App navigated to wrong screen or went to home

- The Back button (`keyevent 4`) can exit the app entirely if on the root screen
- Use `monkey` command to relaunch: `adb shell monkey -p dev.expo.routere2e -c android.intent.category.LAUNCHER 1`
- Wait 2 seconds after launch before interacting

### Metro bundler not connecting

```bash
adb reverse tcp:8081 tcp:8081
```

### App crashes on launch

```bash
# Check crash buffer
adb logcat -b crash -d

# Look for fatal exceptions
adb logcat -d | grep -A 10 "FATAL EXCEPTION"
```

### Reload the app

```bash
# Open React Native dev menu and tap Reload
adb shell input keyevent 82

# Or force-stop and relaunch
adb shell am force-stop dev.expo.routere2e && adb shell monkey -p dev.expo.routere2e -c android.intent.category.LAUNCHER 1
```

## Disable Animations (Recommended for Testing)

Disabling animations prevents flaky UI dumps and makes testing more reliable:

```bash
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

Re-enable when done:

```bash
adb shell settings put global window_animation_scale 1
adb shell settings put global transition_animation_scale 1
adb shell settings put global animator_duration_scale 1
```

## Complete Example: Testing a Toolbar Screen

```bash
# 1. Launch app
adb shell monkey -p dev.expo.routere2e -c android.intent.category.LAUNCHER 1
sleep 2

# 2. Dump UI to find navigation button
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml
# Find: content-desc="Android Toolbar" bounds="[367,498][714,633]"
# Center: (540, 565)

# 3. Navigate to screen
adb shell input tap 540 565
sleep 1

# 4. Take screenshot to verify visual appearance
adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png /tmp/screenshot.png

# 5. Dump UI to find toolbar buttons
adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml
# Find buttons by content-desc: "Clear selection", "Select all", "Delete", "Add"

# 6. Test toolbar interactions
adb shell input tap 457 2233  # "Select all" button center
sleep 1

# 7. Verify state changed
adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png /tmp/screenshot.png

# 8. Check for errors
adb logcat -d -s ReactNativeJS:E | tail -20
```

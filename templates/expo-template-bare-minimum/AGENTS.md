# {{projectName}}

Expo SDK {{sdkVersion}} bare project. Package manager: **{{packageManager}}**.

This project has native `android/` and `ios/` directories — use development builds, not Expo Go.

## Commands

- `{{packageRunCommand}} start` — Start dev server
- `npx expo install <package>` — Install Expo-compatible dependency (use this, not `{{packageManager}} add`)
- `npx expo run:android` — Build and run on Android
- `npx expo run:ios` — Build and run on iOS
- `npx expo doctor` — Check project health

## Documentation

- https://docs.expo.dev/llms-full.txt — Complete Expo documentation
- https://docs.expo.dev/llms-sdk.txt — SDK reference

## Notes

- Use `npx expo install` for Expo packages to ensure compatible versions
- After modifying native code, rebuild with `npx expo run:android` or `npx expo run:ios`

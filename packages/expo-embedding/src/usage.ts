export const usage = `Usage:
  npx expo-embedding init
  npx expo-embedding install <package...>

With Bun, use bunx expo-embedding with the same command and options:
  bunx expo-embedding init

Options:
  --platform ios|android Select the native platform
  --project <App.xcodeproj> --target <App>  Select the iOS application target
  --frozen-lockfile      Reproduce installed dependencies (init only)
  --configure-host       Authorize Android Application/Activity/theme edits (init/install)
  --migrate-activity=appcompat  Authorize only Android Activity/theme edits (init/install)
  --help, -h             Show this usage
  --version, -v          Show the CLI version

Run from the native app directory or a subdirectory.
init installs dependencies and generates the native integration. It preserves existing app UI and prints the integration guide after successful setup.
install runs Expo's installer and then refreshes the native integration.
CI=1 disables prompts; it does not authorize host edits.
Successful setup remembers the iOS project and target.

For local CLI development, build the package first, then use:
  node /path/to/expo/packages/expo-embedding/bin/expo-embedding.js <command> [options]
`;

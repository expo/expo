type ExpoUISwiftUI = typeof import('@expo/ui/swift-ui');
type ExpoUISwiftUIModifiers = typeof import('@expo/ui/swift-ui/modifiers');

let loaded: { expoUI: ExpoUISwiftUI; modifiers: ExpoUISwiftUIModifiers } | undefined;

// Loads on first use so bundles for other platforms never touch the SwiftUI entry points.
export function requireExpoUISwiftUI(
  errorMessage = "The '@expo/ui' package needs to be installed in order to use this feature."
) {
  if (!loaded) {
    try {
      loaded = {
        expoUI: require('@expo/ui/swift-ui'),
        modifiers: require('@expo/ui/swift-ui/modifiers'),
      };
    } catch {
      throw new Error(errorMessage);
    }
  }
  return loaded;
}

/**
 * The native library that renders `SplitView`:
 * - `rns` - `Split.Host` from `react-native-screens`.
 * - `expo-ui` - `NavigationSplitView` from `@expo/ui/swift-ui`.
 */
export type SplitViewImplementation = 'rns' | 'expo-ui';

let implementation: SplitViewImplementation = 'rns';

/**
 * Selects the native library that renders `SplitView`. Call it before the first `SplitView`
 * renders, for example at the top level of the root layout module.
 *
 * @default 'rns'
 */
export function setSplitViewImplementation(next: SplitViewImplementation) {
  implementation = next;
}

export function getSplitViewImplementation() {
  return implementation;
}

import { requireNativeView, requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

type Classification =
  | 'first-child'
  | 'nested-navigator'
  | 'none'
  | 'ambiguous'
  | 'embedded'
  | 'off-path';

interface ScrollViewDetectedEvent {
  nativeEvent: {
    classification: Classification;
    // Native class names from the screen content down, see `describePath`.
    firstChildPath: string[];
    scrollViewPath: string[];
  };
}

type NativeProps = ViewProps & {
  onScrollViewDetected: (event: ScrollViewDetectedEvent) => void;
};

const MODULE_NAME = 'ExpoRouterScrollViewDetector';

// The native side ships with expo-router, but a development build made before this JS was
// added has no such view. Render nothing in that case instead of crashing the screen.
const NativeDetectorView: ComponentType<NativeProps> | null =
  process.env.NODE_ENV === 'development' &&
  (process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android') &&
  requireOptionalNativeModule(MODULE_NAME)
    ? requireNativeView(MODULE_NAME, 'RouterScrollViewDetectorView')
    : null;

const FRIENDLY_VIEW_NAMES: Record<string, string> = {
  RCTViewComponentView: 'View',
  ReactViewGroup: 'View',
  RCTParagraphComponentView: 'Text',
  ReactTextView: 'Text',
  RCTScrollViewComponentView: 'ScrollView',
  RCTEnhancedScrollView: 'ScrollView',
  ReactScrollView: 'ScrollView',
  RCTImageComponentView: 'Image',
  ReactImageView: 'Image',
  RCTTextInputComponentView: 'TextInput',
  ReactEditText: 'TextInput',
  RNSSafeAreaViewComponentView: 'SafeAreaView',
};

// React Native's `ScrollView` is two native views on iOS, so collapse repeated names.
function describePath(path: string[]) {
  return path
    .map((name) => FRIENDLY_VIEW_NAMES[name] ?? name)
    .filter((name, index, names) => name !== names[index - 1])
    .join(' > ');
}

const warnedRoutes = new Set<string>();

function warnOnce(routeName: string, event: ScrollViewDetectedEvent['nativeEvent']) {
  if (warnedRoutes.has(routeName)) {
    return;
  }
  warnedRoutes.add(routeName);
  // TODO(@ubax): Suggest `ScrollViewMarker` from `react-native-screens/experimental` once the
  // screens used by the native stack read it. Today only the native tabs screens do.
  console.warn(
    `[expo-router] Screen "${routeName}" renders a scroll view that is not on its first child path. ` +
      'Native header collapse, scroll edge effects, content insets and scroll-to-top on tab re-selection apply only to the first scroll view reached by following the first child at each level of the screen, so they will not work for this screen. ' +
      `Following the first child ends at: ${describePath(event.firstChildPath)}. The scroll view is at: ${describePath(event.scrollViewPath)}. ` +
      'Make the scroll view the first child of the screen, for example by moving headers into `ListHeaderComponent`. ' +
      'This check runs only in development. To turn it off, set `extra.router.disableScrollViewDetection` to true in the app config.'
  );
}

/**
 * Development-only sibling of a screen's content. It asks the native side whether the screen's
 * scroll view sits on the first child path that react-native-screens follows, and warns when
 * it does not. Rendered after the content so it never changes that path itself.
 */
export function ScrollViewPathDetector({ routeName }: { routeName: string }) {
  if (!NativeDetectorView || Constants.expoConfig?.extra?.router?.disableScrollViewDetection) {
    return null;
  }
  return (
    <NativeDetectorView
      style={styles.detector}
      pointerEvents="none"
      onScrollViewDetected={(event) => {
        if (event.nativeEvent.classification === 'off-path') {
          warnOnce(routeName, event.nativeEvent);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  detector: { position: 'absolute', width: 0, height: 0 },
});

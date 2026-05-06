import React, { useCallback, useDeferredValue, useMemo } from 'react';
import { View } from 'react-native';
import type { TabsHostProps } from 'react-native-screens';

import type { NativeTabOptions, NativeTabsViewProps } from './types';
import { useAwaitedScreensIcon } from './utils/icon';
import { useTheme } from '../react-navigation/native';

export function useSelectedScreenKey({
  focusedIndex,
  provenance,
  tabs,
}: Pick<NativeTabsViewProps, 'focusedIndex' | 'provenance' | 'tabs'>): {
  selectedScreenKey: string;
  provenance: number;
} {
  const stableState = useMemo(() => ({ focusedIndex, provenance }), [focusedIndex, provenance]);
  const { focusedIndex: deferredFocusedIndex, provenance: deferredProvenance } =
    useDeferredValue(stableState);

  // We need to check if the deferred index is not out of bounds
  // This can happen when the focused index is the last tab, and user removes that tab
  // In that case the deferred index will still point to the last tab, but after re-render
  // it will be out of bounds
  const inBoundsDeferredFocusedIndex =
    deferredFocusedIndex < tabs.length ? deferredFocusedIndex : focusedIndex;

  return {
    selectedScreenKey: tabs[inBoundsDeferredFocusedIndex]!.routeKey,
    provenance: deferredProvenance,
  };
}

export function useOnTabSelectedHandler(
  onTabChange: NativeTabsViewProps['onTabChange']
): NonNullable<TabsHostProps['onTabSelected']> {
  return useCallback<NonNullable<TabsHostProps['onTabSelected']>>(
    ({ nativeEvent: { selectedScreenKey, provenance, isNativeAction } }) => {
      onTabChange({ selectedKey: selectedScreenKey, provenance, isNativeAction });
    },
    [onTabChange]
  );
}

/**
 * Cross-platform fields used to render a single tab screen. Each platform
 * extends this with its own appearance fields.
 */
export interface InternalTabScreenProps {
  routeKey: string;
  name: string;
  // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
  isFocused: boolean;
  options: NativeTabOptions;
  contentRenderer: () => React.ReactNode;
}

export function useSharedScreenProps(props: InternalTabScreenProps) {
  const { options, isFocused, name, routeKey } = props;
  const title = options.title ?? name;
  const {
    ios: nativeIosOverrides,
    android: nativeAndroidOverrides,
    ...nativeRestOverrides
  } = options.nativeProps ?? {};

  // We need to await the icon, as VectorIcon will load asynchronously
  const icon = useAwaitedScreensIcon(options.icon);
  const selectedIcon = useAwaitedScreensIcon(options.selectedIcon);

  return {
    options,
    // TODO(@ubax): https://linear.app/expo/issue/ENG-20736/remove-pointerevents-from-nativetabsview
    pointerEvents: (isFocused ? 'box-none' : 'none') as 'box-none' | 'none',
    title,
    nativeIosOverrides,
    nativeAndroidOverrides,
    nativeRestOverrides,
    screenKey: routeKey,
    icon,
    selectedIcon,
  };
}

export function ScreenContent({
  options,
  contentRenderer,
}: {
  options: NativeTabOptions;
  contentRenderer: () => React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      // https://github.com/software-mansion/react-native-screens/issues/2662#issuecomment-2757735088
      collapsable={false}
      style={[
        { backgroundColor: colors.background },
        options.contentStyle,
        { flex: 1, position: 'relative', overflow: 'hidden' },
      ]}>
      {contentRenderer()}
    </View>
  );
}

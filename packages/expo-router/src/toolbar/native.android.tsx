import { Host, HorizontalFloatingToolbar, Box } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, height, padding, imePadding } from '@expo/ui/jetpack-compose/modifiers';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RouterToolbarHostProps } from './native.types';

export function RouterToolbarHost(props: RouterToolbarHostProps) {
  const insets = useSafeAreaInsets();

  const modifiers = useMemo(() => {
    const baseModifiers = [fillMaxWidth(), padding(0, 0, 0, insets.bottom)];
    if (props.withImePadding) {
      baseModifiers.push(imePadding());
    }
    return baseModifiers;
  }, [insets.bottom, props.withImePadding]);

  // The wrapper fills the screen so it can pin the toolbar to the bottom, but `box-none` keeps it
  // from being a touch target. The Compose `Host` then wraps just the toolbar (matchContents), so
  // only that area swallows touches — taps elsewhere reach the screen content below (ENG-22124).
  return (
    <View testID="RouterToolbarWrapper" style={styles.container} pointerEvents="box-none">
      <Host matchContents={{ vertical: true }} style={styles.host}>
        <Box modifiers={modifiers} contentAlignment="center">
          <HorizontalFloatingToolbar
            colors={{
              ...(props.backgroundColor ? { toolbarContainerColor: props.backgroundColor } : {}),
            }}
            modifiers={[height(64)]}>
            {props.children}
          </HorizontalFloatingToolbar>
        </Box>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  host: { width: '100%', paddingHorizontal: 24 },
});

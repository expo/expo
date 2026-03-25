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

  return (
    <View style={[StyleSheet.absoluteFill]} pointerEvents="box-none">
      <Host style={styles.host}>
        <Box modifiers={modifiers} contentAlignment="bottomCenter">
          <HorizontalFloatingToolbar modifiers={[height(64)]}>
            {props.children}
          </HorizontalFloatingToolbar>
        </Box>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%', height: '100%', paddingHorizontal: 24 },
});

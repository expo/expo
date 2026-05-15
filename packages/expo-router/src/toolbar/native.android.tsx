import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RouterToolbarHostProps } from './native.types';
import {
  getExpoUiJetpackCompose,
  getExpoUiJetpackComposeModifiers,
} from '../optional-dependencies/expo-ui';

export function RouterToolbarHost(props: RouterToolbarHostProps) {
  const { Host, HorizontalFloatingToolbar, Box } = getExpoUiJetpackCompose(
    '`Stack.Toolbar` bottom toolbar on Android'
  );
  const { fillMaxWidth, height, padding, imePadding } = getExpoUiJetpackComposeModifiers(
    '`Stack.Toolbar` bottom toolbar on Android'
  );
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
  host: { width: '100%', height: '100%', paddingHorizontal: 24 },
});

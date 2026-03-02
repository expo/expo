import { Host, HorizontalFloatingToolbar, Icon, IconButton } from '@expo/ui/jetpack-compose';
import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RouterToolbarHostProps, RouterToolbarItemProps } from './native.types';

export function RouterToolbarHost(props: RouterToolbarHostProps) {
  return (
    <View style={styles.hostContainer} pointerEvents="box-none">
      <Host matchContents>
        <HorizontalFloatingToolbar>{props.children}</HorizontalFloatingToolbar>
      </Host>
    </View>
  );
}

export function RouterToolbarItem(props: RouterToolbarItemProps) {
  if (props.hidden) {
    return null;
  }

  if (props.type === 'fixedSpacer' || props.type === 'fluidSpacer') {
    if (process.env.NODE_ENV !== 'production') {
      // prettier-ignore
      console.warn('Stack.Toolbar.Spacer is not supported on Android. The spacer will not render.');
    }
    return null;
  }

  if (props.type === 'searchBar') {
    if (process.env.NODE_ENV !== 'production') {
      // prettier-ignore
      console.warn('Stack.Toolbar.SearchBarSlot is not supported on Android. The search bar will not render.');
    }
    return null;
  }

  if (hasChildren(props.children)) {
    if (process.env.NODE_ENV !== 'production') {
      // prettier-ignore
      console.warn('Stack.Toolbar.View is not supported on Android. Custom views inside the toolbar will not render.');
    }
    return null;
  }

  if (!props.source) {
    if (process.env.NODE_ENV !== 'production') {
      // prettier-ignore
      console.warn('Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
    }
    return null;
  }

  return (
    <IconButton onPress={props.onSelected} disabled={props.disabled}>
      <Icon source={props.source} tintColor={props.tintColor} />
    </IconButton>
  );
}

function hasChildren(children: ReactNode | undefined): boolean {
  if (children == null) return false;
  return Children.count(children) > 0;
}

const styles = StyleSheet.create({
  hostContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

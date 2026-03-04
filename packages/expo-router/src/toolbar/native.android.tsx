import {
  Host,
  HorizontalFloatingToolbar,
  Icon,
  IconButton,
  Box,
  AnimatedVisibility,
  EnterTransition,
  ExitTransition,
  RNHostView,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  width,
  height,
  imePadding,
  safeDrawingPadding,
} from '@expo/ui/jetpack-compose/modifiers';
import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { RouterToolbarHostProps, RouterToolbarItemProps } from './native.types';

export function RouterToolbarHost(props: RouterToolbarHostProps) {
  return (
    <View style={[styles.hostContainer]} pointerEvents="box-none">
      <Host style={{ width: '100%', height: '100%' }}>
        <Box
          modifiers={[fillMaxWidth(), imePadding(), safeDrawingPadding()]}
          contentAlignment="bottomCenter">
          <HorizontalFloatingToolbar modifiers={[height(64)]}>
            {props.children}
          </HorizontalFloatingToolbar>
        </Box>
      </Host>
    </View>
  );
}

export function RouterToolbarItem(props: RouterToolbarItemProps) {
  if (props.type === 'fluidSpacer') {
    // Silently ignore fluid spacer on android
    return null;
  }
  if (props.type === 'fixedSpacer') {
    if (props.width) {
      return (
        <AnimatedWrapper visible={!props.hidden}>
          <Box modifiers={[width(props.width)]} />
        </AnimatedWrapper>
      );
    }
    return null;
  }

  if (props.type === 'searchBar') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Stack.Toolbar.SearchBarSlot is not supported on Android. The search bar will not render.'
      );
    }
    return null;
  }

  if (hasChildren(props.children)) {
    return (
      <AnimatedWrapper visible={!props.hidden}>
        <RNHostView matchContents>
          <>{props.children}</>
        </RNHostView>
      </AnimatedWrapper>
    );
  }

  if (!props.source) {
    if (process.env.NODE_ENV !== 'production' && !props.mdIconName) {
      console.warn(
        'Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.'
      );
    }
    return null;
  }

  return (
    <AnimatedWrapper visible={!props.hidden}>
      <IconButton onPress={props.onSelected} disabled={props.disabled}>
        <Icon source={props.source} tintColor={props.tintColor} size={24} />
      </IconButton>
    </AnimatedWrapper>
  );
}

function AnimatedWrapper({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <AnimatedVisibility
      // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
      // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
      enterTransition={EnterTransition.scaleIn().plus(EnterTransition.expandIn())}
      exitTransition={ExitTransition.scaleOut().plus(ExitTransition.shrinkOut())}
      visible={visible}>
      {children}
    </AnimatedVisibility>
  );
}

function hasChildren(children: ReactNode | undefined): boolean {
  if (children == null) return false;
  return Children.count(children) > 0;
}

const styles = StyleSheet.create({
  hostContainer: {
    position: 'absolute',
    inset: 0,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

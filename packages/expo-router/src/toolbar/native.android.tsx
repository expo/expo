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
  DropdownMenu,
  DropdownMenuItem,
  Divider,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  width,
  height,
  imePadding,
  padding,
} from '@expo/ui/jetpack-compose/modifiers';
import { Children, createContext, use, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  RouterToolbarHostProps,
  RouterToolbarItemProps,
  RouterToolbarMenuProps,
  RouterToolbarMenuItemProps,
} from './native.types';
import { Color } from '../color';
import { useMaterialIconSource } from '../utils/materialIcon';

const arrowRightIcon = require('expo-router/assets/arrow_right.xml');
const checkIcon = require('expo-router/assets/check.xml');

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
      <Host style={{ width: '100%', height: '100%', paddingHorizontal: 24 }}>
        <Box modifiers={modifiers} contentAlignment="bottomCenter">
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

const MenuDismissContext = createContext<(() => void) | undefined>(undefined);

export function RouterToolbarMenu(props: RouterToolbarMenuProps) {
  const parentDismiss = use(MenuDismissContext);
  const isNested = parentDismiss !== undefined;

  if (isNested) {
    return <NestedRouterToolbarMenu {...props} parentDismiss={parentDismiss} />;
  }

  return <RootRouterToolbarMenu {...props} />;
}

function RootRouterToolbarMenu(props: RouterToolbarMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const dismiss = () => setExpanded(false);
  const materialSource = useMaterialIconSource(props.mdIconName);
  const resolvedSource = props.source ?? materialSource;

  const computedHidden = props.hidden || !resolvedSource;

  if (!resolvedSource) {
    if (process.env.NODE_ENV !== 'production' && !props.mdIconName) {
      console.warn('Stack.Toolbar.Menu on Android requires an icon. Use the `icon` or `md` prop.');
    }
  }

  return (
    <AnimatedWrapper visible={!computedHidden}>
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={dismiss}
        color={Color.android.dynamic.surface}>
        <DropdownMenu.Trigger>
          <IconButton onPress={() => setExpanded((prev) => !prev)} disabled={props.disabled}>
            {resolvedSource ? (
              <Icon source={resolvedSource} tintColor={props.tintColor} size={24} />
            ) : undefined}
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          <MenuDismissContext value={dismiss}>{props.children}</MenuDismissContext>
        </DropdownMenu.Items>
      </DropdownMenu>
    </AnimatedWrapper>
  );
}

function NestedRouterToolbarMenu(props: RouterToolbarMenuProps & { parentDismiss: () => void }) {
  const { parentDismiss, ...menuProps } = props;

  if (menuProps.hidden) {
    return null;
  }

  if (menuProps.inline) {
    return (
      <MenuDismissContext value={parentDismiss}>
        <Divider />
        {menuProps.children}
        <Divider />
      </MenuDismissContext>
    );
  }

  return <NestedSubmenuDropdown {...menuProps} parentDismiss={parentDismiss} />;
}

function NestedSubmenuDropdown(props: RouterToolbarMenuProps & { parentDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const arrowSource = arrowRightIcon;

  const dismiss = () => {
    setExpanded(false);
    props.parentDismiss();
  };

  const trailingIcon = arrowSource ? (
    <DropdownMenuItem.TrailingIcon>
      <Icon source={arrowSource} size={24} tintColor={Color.android.dynamic.onSurface} />
    </DropdownMenuItem.TrailingIcon>
  ) : null;

  return (
    <DropdownMenu
      expanded={expanded}
      onDismissRequest={() => setExpanded(false)}
      color={Color.android.dynamic.surface}>
      <DropdownMenu.Trigger>
        <DropdownMenuItem onClick={() => setExpanded(true)}>
          <DropdownMenuItem.Text>
            <Text>{props.label ?? ''}</Text>
          </DropdownMenuItem.Text>
          {trailingIcon}
        </DropdownMenuItem>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        <MenuDismissContext value={dismiss}>{props.children}</MenuDismissContext>
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}

export function RouterToolbarMenuItem(props: RouterToolbarMenuItemProps) {
  const onDismiss = use(MenuDismissContext);
  const materialSource = useMaterialIconSource(props.leadingMdIconName);
  const iconSource = props.leadingIconSource ?? materialSource;
  const checkSource = props.isOn ? checkIcon : undefined;

  if (props.hidden) {
    return null;
  }

  const leadingIcon = iconSource ? (
    <DropdownMenuItem.LeadingIcon>
      <Icon source={iconSource} size={24} tintColor={Color.android.dynamic.onSurface} />
    </DropdownMenuItem.LeadingIcon>
  ) : null;

  const trailingIcon = checkSource ? (
    <DropdownMenuItem.TrailingIcon>
      <Icon source={checkSource} size={24} tintColor={Color.android.dynamic.onSurface} />
    </DropdownMenuItem.TrailingIcon>
  ) : null;

  return (
    <DropdownMenuItem
      enabled={props.enabled !== false}
      onClick={() => {
        props.onPress?.();
        onDismiss?.();
      }}>
      <DropdownMenuItem.Text>
        <Text>{props.label}</Text>
      </DropdownMenuItem.Text>
      {leadingIcon}
      {trailingIcon}
    </DropdownMenuItem>
  );
}

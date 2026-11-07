'use client';
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import type { MouseEvent } from 'react';
import React, { useMemo } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Text, Platform } from 'react-native';

import { Prefetch } from '../Prefetch';
import { Slot } from '../ui/Slot';
import { resolveHref } from './href';
import type { LinkProps } from './useLinkHooks';
import { useInteropClassName, useHrefAttrs } from './useLinkHooks';
import useLinkToPathProps from './useLinkToPathProps';

export function BaseExpoRouterLink({
  href,
  replace,
  push,
  dismissTo,
  // TODO: This does not prevent default on the anchor tag.
  relativeToDirectory,
  asChild,
  rel,
  target,
  download,
  withAnchor,
  dangerouslySingular: singular,
  prefetch,
  ...rest
}: LinkProps) {
  // Mutate the style prop to add the className on web.
  const style = useInteropClassName(rest);

  // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
  const hrefAttrs = useHrefAttrs({ asChild, rel, target, download });

  const resolvedHref = useMemo(() => {
    if (href == null) {
      throw new Error('Link: href is required');
    }
    return resolveHref(href);
  }, [href]);

  let event;
  if (push) event = 'PUSH';
  if (replace) event = 'REPLACE';
  if (dismissTo) event = 'POP_TO';

  const props = useLinkToPathProps({
    href: resolvedHref,
    event,
    relativeToDirectory,
    withAnchor,
    dangerouslySingular: singular,
  });

  const onPress = (e: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => {
    if ('onPress' in rest) {
      rest.onPress?.(e);
    }
    props.onPress(e);
  };

  const Component = asChild ? Slot : Text;

  if (asChild && React.Children.count(rest.children) > 1) {
    throw new Error(
      'Link: When using `asChild`, you must pass a single child element that will emit the `onPress` event.'
    );
  }

  // Forward the wrapper as `onPress` so a child that fires only `onPress` also navigates.
  const forwardedProps = { ...props, ...hrefAttrs, ...rest, onPress };
  // React DOM warns about `onPress` on a DOM element. On web, `onClick` below calls it.
  // Other children keep `onPress`: React Native Web's `Pressable` replaces `onClick` with its own handler.
  const { onPress: _onPress, ...domProps } = forwardedProps;
  const isDomChild =
    Platform.OS === 'web' &&
    asChild &&
    React.isValidElement(rest.children) &&
    typeof rest.children.type === 'string';

  // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
  const element = (
    <Component
      {...(isDomChild ? domProps : forwardedProps)}
      style={style}
      {...Platform.select({
        web: {
          onClick: onPress,
        } as any,
        default: { onPress },
      })}
    />
  );

  return prefetch ? (
    <>
      <Prefetch href={href} />
      {element}
    </>
  ) : (
    element
  );
}

'use client';
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import React, { useMemo, MouseEvent } from 'react';
import { Text, GestureResponderEvent, Platform } from 'react-native';

import { resolveHref } from './href';
import { useInteropClassName, useHrefAttrs, LinkProps } from './useLinkHooks';
import useLinkToPathProps from './useLinkToPathProps';
import { Prefetch } from '../Prefetch';
import { Slot } from '../ui/Slot';

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

  // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
  const element = (
    <Component
      {...props}
      {...hrefAttrs}
      {...rest}
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

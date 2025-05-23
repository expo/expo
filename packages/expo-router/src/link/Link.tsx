'use client';
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { PropsWithChildren, forwardRef, useMemo, MouseEvent, ForwardedRef, JSX } from 'react';
import { Text, GestureResponderEvent, Platform } from 'react-native';

import { resolveHref } from './href';
import useLinkToPathProps from './useLinkToPathProps';
import { Href } from '../types';
import { useInteropClassName, useHrefAttrs, LinkProps, WebAnchorProps } from './useLinkHooks';
import { Prefetch } from '../Prefetch';
import { Slot } from '../ui/Slot';

export interface LinkComponent {
  (props: PropsWithChildren<LinkProps>): JSX.Element;
  /** Helper method to resolve an Href object into a string. */
  resolveHref: (href: Href) => string;
}

export { Redirect, RedirectProps } from './Redirect';

/**
 * Component that renders a link using [`href`](#href) to another route.
 * By default, it accepts children and wraps them in a `<Text>` component.
 *
 * Uses an anchor tag (`<a>`) on web and performs a client-side navigation to preserve
 * the state of the website and navigate faster. The web-only attributes such as `target`,
 * `rel`, and `download` are supported and passed to the anchor tag on web. See
 * [`WebAnchorProps`](#webanchorprops) for more details.
 *
 * > **Note**: Client-side navigation works with both single-page apps,
 * and [static-rendering](/router/reference/static-rendering/).
 *
 * @example
 * ```tsx
 * import { Link } from 'expo-router';
 * import { View } from 'react-native';
 *
 * export default function Route() {
 *  return (
 *   <View>
 *    <Link href="/about">About</Link>
 *   </View>
 *  );
 *}
 * ```
 */
export const Link = forwardRef(ExpoRouterLink) as unknown as LinkComponent;

Link.resolveHref = resolveHref;

function ExpoRouterLink(
  {
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
  }: LinkProps,
  ref: ForwardedRef<Text>
) {
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

  // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
  const element = (
    <Component
      ref={ref}
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

export { LinkProps, WebAnchorProps };

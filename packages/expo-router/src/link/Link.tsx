// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { Text, TextProps, GestureResponderEvent, Platform } from 'react-native';

import { Href, resolveHref } from './href';
import useLinkToPathProps from './useLinkToPathProps';
import { useRouter } from '../hooks';
import { useFocusEffect } from '../useFocusEffect';

export interface LinkProps extends Omit<TextProps, 'href'> {
  /** Path to route to. */
  href: Href;

  // TODO(EvanBacon): This may need to be extracted for React Native style support.
  /** Forward props to child component. Useful for custom buttons. */
  asChild?: boolean;

  /** Should replace the current route without adding to the history. */
  replace?: boolean;

  /** On web, this sets the HTML `class` directly. On native, this can be used with CSS interop tools like Nativewind. */
  className?: string;

  onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
}

/** Redirects to the href as soon as the component is mounted. */
export function Redirect({ href }: { href: Href }) {
  const router = useRouter();
  useFocusEffect(() => {
    try {
      router.replace(href);
    } catch (error) {
      console.error(error);
    }
  });
  return null;
}

export interface LinkComponent {
  (props: React.PropsWithChildren<LinkProps>): JSX.Element;
  /** Helper method to resolve an Href object into a string. */
  resolveHref: typeof resolveHref;
}

/**
 * Component to render link to another route using a path.
 * Uses an anchor tag on the web.
 *
 * @param props.href Absolute path to route (e.g. `/feeds/hot`).
 * @param props.replace Should replace the current route without adding to the history.
 * @param props.asChild Forward props to child component. Useful for custom buttons.
 * @param props.children Child elements to render the content.
 * @param props.className On web, this sets the HTML `class` directly. On native, this can be used with CSS interop tools like Nativewind.
 */
export const Link = React.forwardRef(ExpoRouterLink) as unknown as LinkComponent;

Link.resolveHref = resolveHref;

// Mutate the style prop to add the className on web.
function useInteropClassName(props: { style?: TextProps['style']; className?: string }) {
  if (Platform.OS !== 'web') {
    return props.style;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return React.useMemo(() => {
    if (props.className == null) {
      return props.style;
    }
    const cssStyle = {
      $$css: true,
      __routerLinkClassName: props.className,
    };

    if (Array.isArray(props.style)) {
      return [...props.style, cssStyle];
    }
    return [props.style, cssStyle];
  }, [props.style, props.className]);
}

function ExpoRouterLink(
  {
    href,
    replace,
    // TODO: This does not prevent default on the anchor tag.
    asChild,
    ...rest
  }: LinkProps,
  ref: React.ForwardedRef<Text>
) {
  // Mutate the style prop to add the className on web.
  const style = useInteropClassName(rest);

  const resolvedHref = React.useMemo(() => {
    if (href == null) {
      throw new Error('Link: href is required');
    }
    return resolveHref(href);
  }, [href]);

  const props = useLinkToPathProps({ href: resolvedHref, replace });

  const onPress = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => {
    if ('onPress' in rest) {
      rest.onPress?.(e);
    }
    props.onPress(e);
  };

  const Element = asChild ? Slot : Text;

  // Avoid using createElement directly, favoring JSX, to allow tools like Nativewind to perform custom JSX handling on native.
  return (
    <Element
      ref={ref}
      {...props}
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
}

import { router, usePathname } from 'expo-router';
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from 'react';

import { events } from './events';
import { isInternal, resolveHref } from './url';

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  legacyBehavior?: boolean;
  passHref?: boolean;
};

function isClientNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
  const target = event.currentTarget.getAttribute('target');
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!target || target === '_self') &&
    isInternal(href) &&
    !event.currentTarget.hasAttribute('download')
  );
}

/**
 * The `next/link` component. It renders a plain anchor, as Next.js does. The Expo Router
 * `Link` renders a React Native `Text` component, or passes `onPress` to a child element.
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href: originalHref,
    prefetch,
    replace,
    scroll,
    shallow,
    legacyBehavior,
    passHref,
    onClick,
    onMouseEnter,
    ...rest
  },
  ref
) {
  const href = resolveHref(originalHref, usePathname());

  return (
    <a
      ref={ref}
      href={href}
      onClick={event => {
        onClick?.(event);
        if (!isClientNavigation(event, href)) {
          return;
        }
        event.preventDefault();
        events.emit('routeChangeStart', href);
        if (replace) {
          router.replace(href as any);
        } else {
          router.push(href as any);
        }
      }}
      onMouseEnter={event => {
        onMouseEnter?.(event);
        if (prefetch !== false && isInternal(href)) {
          router.prefetch(href as any);
        }
      }}
      {...rest}
    />
  );
});

// `@expo/styleguide` loads this module with `require('next/link')` and uses the result as
// the component. The module value must be the component, not a namespace object.
(Link as any).default = Link;
module.exports = Link;

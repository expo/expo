import { MouseEvent } from 'react';
import { GestureResponderEvent, Platform } from 'react-native';

import { useExpoRouter } from '../global-state/router-store';
import { LinkToOptions } from '../global-state/routing';
import { stripGroupSegmentsFromPath } from '../matchers';
import { emitDomLinkEvent } from './useDomComponentNavigation';
import { appendBaseUrl } from '../fork/getPathFromState-forks';

function eventShouldPreventDefault(
  e: MouseEvent<HTMLAnchorElement> | GestureResponderEvent
): boolean {
  if (e?.defaultPrevented) {
    return false;
  }

  if (
    // Only check MouseEvents
    'button' in e &&
    // ignore clicks with modifier keys
    !e.metaKey &&
    !e.altKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    (e.button == null || e.button === 0) && // Only accept left clicks
    [undefined, null, '', 'self'].includes(e.currentTarget.target) // let browser handle "target=_blank" etc.
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if base url should be appended to the given href.
 * @param href the href to check
 * @returns false if `href` contains an authority or a scheme, otherwise true
 */
function shouldAppendBaseUrl(href: string): boolean {
  // See rfc2396 appendix b for regex used. Capture group 2 identifies the scheme, capture group 4 identifies the authority.
  // If either is present, base url should not be appended because the href is not relative to the app.
  const uriRegex = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?/;
  const hrefMatches = href.match(uriRegex);
  if (!hrefMatches) {
    return true;
  } else {
    const scheme = hrefMatches[2];
    const authority = hrefMatches[4];
    return !scheme && !authority;
  }
}

type UseLinkToPathPropsOptions = LinkToOptions & {
  href: string;
};

export default function useLinkToPathProps({ href, ...options }: UseLinkToPathPropsOptions) {
  const { linkTo } = useExpoRouter();

  const onPress = (event?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => {
    if (shouldHandleMouseEvent(event)) {
      if (emitDomLinkEvent(href, options)) {
        return;
      }
      linkTo(href, options);
    }
  };

  let strippedHref = stripGroupSegmentsFromPath(href) || '/';

  // Append base url only if needed.
  if (shouldAppendBaseUrl(strippedHref)) {
    strippedHref = appendBaseUrl(strippedHref);
  }

  return {
    href: strippedHref,
    role: 'link' as const,
    onPress,
  };
}

export function shouldHandleMouseEvent(
  event?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent
) {
  if (Platform.OS !== 'web') {
    return !event?.defaultPrevented;
  }

  if (event && eventShouldPreventDefault(event)) {
    event.preventDefault();
    return true;
  }

  return false;
}

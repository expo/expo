import * as React from 'react';
import { GestureResponderEvent, Platform } from 'react-native';

import { appendBaseUrl } from '../fork/getPathFromState';
import { useExpoRouter } from '../global-state/router-store';
import { LinkToOptions } from '../global-state/routing';
import { stripGroupSegmentsFromPath } from '../matchers';

function eventShouldPreventDefault(
  e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
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

  const onPress = (e?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => {
    let shouldHandle = false;

    if (Platform.OS !== 'web' || !e) {
      shouldHandle = e ? !e.defaultPrevented : true;
    } else if (eventShouldPreventDefault(e)) {
      e.preventDefault();
      shouldHandle = true;
    }

    if (shouldHandle) {
      linkTo(href, options);
    }
  };

  const baseAppendedStrippedHref = React.useMemo(() => {
    const strippedHref = stripGroupSegmentsFromPath(href);
    // Ensure there's always a value for href.
    if (!strippedHref) {
      return appendBaseUrl('/');
    }

    // Append base url only if needed.
    if (shouldAppendBaseUrl(strippedHref)) {
      return appendBaseUrl(strippedHref);
    } else {
      return strippedHref;
    }
  }, [href]);

  return {
    href: baseAppendedStrippedHref,
    role: 'link' as const,
    onPress,
  };
}

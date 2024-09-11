import * as React from 'react';
import { GestureResponderEvent, Platform } from 'react-native';

import { appendBaseUrl } from '../fork/getPathFromState';
import { useExpoRouter } from '../global-state/router-store';
import { LinkToOptions } from '../global-state/routing';
import { stripGroupSegmentsFromPath } from '../matchers';
import { shouldLinkExternally } from '../utils/url';

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

    // Append base url only if needed (for non-external URLs)
    if (shouldLinkExternally(strippedHref)) {
      return strippedHref;
    } else {
      return appendBaseUrl(strippedHref);
    }
  }, [href]);

  return {
    href: baseAppendedStrippedHref,
    role: 'link' as const,
    onPress,
  };
}

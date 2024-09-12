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

  return {
    // Ensure there's always a value for href. Manually append the baseUrl to the href prop that shows in the static HTML.
    href: appendBaseUrl(stripGroupSegmentsFromPath(href) || '/'),
    role: 'link' as const,
    onPress,
  };
}

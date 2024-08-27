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

  const onPress = (
    event?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => {
    if (shouldHandleMouseEvent(event)) {
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

export function shouldHandleMouseEvent(
  event?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
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

import { MouseEvent } from 'react';
import { GestureResponderEvent, Platform } from 'react-native';

import * as expo from '../fork/getPathFromState-forks';
import { useExpoRouter } from '../global-state/router-store';
import { LinkToOptions } from '../global-state/routing';
import { stripGroupSegmentsFromPath } from '../matchers';
import { emitDomLinkEvent } from './useDomComponentNavigation';

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

  return {
    // Ensure there's always a value for href. Manually append the baseUrl to the href prop that shows in the static HTML.
    href: expo.appendBaseUrl(stripGroupSegmentsFromPath(href) || '/'),
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

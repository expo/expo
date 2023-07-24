import * as React from "react";
import { GestureResponderEvent, Platform } from "react-native";

import { useExpoRouter } from "../global-state/router-store";
import { stripGroupSegmentsFromPath } from "../matchers";

function eventShouldPreventDefault(
  e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
): boolean {
  if (e?.defaultPrevented) {
    return false;
  }

  if (
    // Only check MouseEvents
    "button" in e &&
    // ignore clicks with modifier keys
    !e.metaKey &&
    !e.altKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    (e.button == null || e.button === 0) && // Only accept left clicks
    [undefined, null, "", "self"].includes(e.currentTarget.target) // let browser handle "target=_blank" etc.
  ) {
    return true;
  }

  return false;
}

export default function useLinkToPathProps(props: {
  href: string;
  replace?: boolean;
}) {
  const { linkTo } = useExpoRouter();

  const onPress = (
    e?: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
  ) => {
    let shouldHandle = false;

    if (Platform.OS !== "web" || !e) {
      shouldHandle = e ? !e.defaultPrevented : true;
    } else if (eventShouldPreventDefault(e)) {
      e.preventDefault();
      shouldHandle = true;
    }

    if (shouldHandle) {
      linkTo(props.href, props.replace ? "REPLACE" : undefined);
    }
  };

  return {
    // Ensure there's always a value for href
    href: stripGroupSegmentsFromPath(props.href) || "/",
    accessibilityRole: "link" as const,
    onPress,
  };
}

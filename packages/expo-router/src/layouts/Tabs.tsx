import { Pressable } from "@bacons/react-views";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import React from "react";
import { Platform } from "react-native";

import { Link } from "../link/Link";
import { Href } from "../link/href";
import { withLayoutContext } from "./withLayoutContext";

// This is the only way to access the navigator.
const BottomTabNavigator = createBottomTabNavigator().Navigator;

export const Tabs = withLayoutContext<
  BottomTabNavigationOptions & { href?: Href | null },
  typeof BottomTabNavigator
>(BottomTabNavigator, (screens) => {
  // Support the `href` shortcut prop.
  return screens.map((screen) => {
    if (
      typeof screen.options !== "function" &&
      screen.options?.href !== undefined
    ) {
      const { href, ...options } = screen.options;
      if (options.tabBarButton) {
        throw new Error("Cannot use `href` and `tabBarButton` together.");
      }
      return {
        ...screen,
        options: {
          ...options,
          tabBarButton: (props) => {
            if (href == null) {
              return null;
            }
            const children =
              Platform.OS === "web" ? (
                props.children
              ) : (
                <Pressable>{props.children}</Pressable>
              );
            return (
              <Link
                {...props}
                style={[{ display: "flex" }, props.style]}
                href={href}
                asChild={Platform.OS !== "web"}
                children={children}
              />
            );
          },
        },
      };
    }
    return screen;
  });
});

export default Tabs;

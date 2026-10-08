---
'expo-router': minor
---

[iOS] Stack headers that set no background now use the system bar background (clear at the scroll edge, as in a plain `UINavigationController`) instead of the built-in theme's `card` color. This changes the default iOS header appearance. The bar's interface style still follows the theme, so the title color stays readable in light and dark mode. `headerStyle.backgroundColor`, transparent and large-title headers, and a theme `card` color that differs from the built-in `DefaultTheme` / `DarkTheme` values are unchanged.

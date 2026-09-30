---
"@expo/ui": patch
"expo-widgets": patch
---

[iOS] Stop linking WidgetKit into apps that use `@expo/ui` without widgets. The `widgetURL`, `activityBackgroundTint`, `widgetAccentedRenderingMode`, and `containerBackground` (`widget` placement) modifiers and the `AccessoryWidgetBackground` view now take effect only inside `expo-widgets` widgets and Live Activities.

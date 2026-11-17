---
'expo-widgets': patch
---

[Android] Fix widgets keeping the colors of the previous theme after the system switches between light and dark mode. The widget is now rendered for both color schemes and colors that differ between them are passed to the launcher as day/night pairs, so `environment.colorScheme` follows the system theme without the app updating the widget. Layouts whose light and dark renders differ in more than color keep the previous behavior.

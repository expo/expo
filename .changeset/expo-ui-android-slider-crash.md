---
"@expo/ui": patch
---

[Android] Fix a crash when dragging `Slider` or `VerticalSlider` in release builds. Their `onValueChange` and `onValueChangeFinished` events are now declared with `Event<T>()` in the view definition, as `ToggleButton` and `TextField` already do.

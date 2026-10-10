---
'@expo/ui': patch
---

[iOS] Fix the community `BottomSheet` clipping its content when the sheet is narrower than the window, as on iPhone Duo. When the sheet sized itself to its content, the content was pinned to the window width and centered in the sheet, so its leading edge was cut off. The content now takes its width from the sheet and its height from the content. `presentationSizing` takes a `fitted` option (`{ horizontal, vertical }`) to fit a sheet to its content on one axis only.

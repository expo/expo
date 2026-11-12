---
'expo-image-manipulator': patch
---

[iOS] Round the calculated dimension in `resize` to whole pixels. Before, a resize with only `width` or only `height` could add a partly transparent last row or column, which shows as a light line in a saved JPEG.

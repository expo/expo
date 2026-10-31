---
'expo-image': patch
---

[Android] Fix a crash ("Canvas: trying to draw too large bitmap") when rendering an image larger than the hardware bitmap size limit with `allowDownscaling={false}`. Such images are now capped at the limit, like with `contentFit="fill"` or `"none"`. Smaller images are still decoded at full size.

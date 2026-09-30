---
"expo-media-library": patch
---

[Android] Fix assets moved with `Album.create` (with `moveAssets` set to `true`) or `album.add` sometimes disappearing from the media library. The file was moved, but its MediaStore entry was deleted, so it only showed up again after a rescan, with a new ID.

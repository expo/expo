---
'expo-image-picker': patch
---

[iOS] Keep the photo library picker open behind a loading indicator until the selection has loaded, and settle `launchImageLibraryAsync` only once the picker is dismissed. Previously the picker closed as soon as an item was tapped, so a photo stored only in iCloud was downloaded with nothing on screen.

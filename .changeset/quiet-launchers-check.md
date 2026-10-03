---
'expo-dev-launcher': patch
---

[Android] Show an error instead of loading a web page as a development server when the opened URL returns HTML and no development server answers at its `/status` endpoint, for example after scanning the QR code of an EAS build page from the launcher.

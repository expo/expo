---
'expo': patch
---

[iOS] Fix DOM components reporting an unhandled `Unable to find the 'DomWebView' view with tag` promise rejection on mount. Prop updates are now sent to the WebView only after its DOM is ready.

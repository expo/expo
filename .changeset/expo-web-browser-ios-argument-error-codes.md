---
'expo-web-browser': patch
---

[iOS] Invalid arguments now reject with the code of the conversion error instead of `ERR_ARGUMENT_CAST`. For example, a URL that isn't a string or a color that isn't a color value rejects with `ERR_CONVERTING_FAILED`, and an unknown `presentationStyle` or `dismissButtonStyle` rejects with `ERR_ENUM_NO_SUCH_VALUE`.

---
'@expo/fingerprint': patch
---

Fix fingerprints differing between machines with different locales (for example Croatian, Czech, Swedish, or Turkish versus English), which made a locally computed runtime version never match the one computed on EAS. Sources, directory entries, and `.gitignore` files are now sorted with a fixed English collator instead of the process default locale.

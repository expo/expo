---
'@expo/fingerprint': patch
---

Fix `diffFingerprints` reporting an `added` or `removed` source whose hash is `null`, such as an ignored `ios` directory. The fingerprint hash leaves such a source out, so the diff now leaves it out too.

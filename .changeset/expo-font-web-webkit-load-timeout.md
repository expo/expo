---
'expo-font': patch
---

On web, loading several fonts no longer fails with a timeout after 12 seconds in WebKit (Safari). Each `@font-face` rule now goes into the same `<style>` element through `insertRule`, so the browser does not parse the style sheet again for every font.

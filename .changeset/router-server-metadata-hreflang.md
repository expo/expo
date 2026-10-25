---
'@expo/router-server': patch
---

Fix the React warning `Invalid DOM property hreflang` for language alternates from `generateMetadata`. The `<link>` tags now use the React `hrefLang` prop.

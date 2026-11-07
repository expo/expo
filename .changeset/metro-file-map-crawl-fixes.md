---
'@expo/metro-file-map': patch
---

Warn again when a directory can't be read during the crawl, such as on `EACCES`, so that files missing for that reason are explained. Directories removed during the crawl are still skipped silently. Also stop crawling files whose extension is an `Object.prototype` name (`x.constructor`), and stop crawling and watching roots twice when `/` or `C:\` is a watch folder.

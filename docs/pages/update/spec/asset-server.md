---
title: Asset Server
sidebar_title: Asset Server
---

The asset server hosts all of the files reference by an update's manifest.

### Compression

Assets should be capable being served with `zip` and `brotli` compression.

### Cacheing

Assets must be served with a `cache-control` header set to an appropriately short period of time.

For example:
```
cache-control: max-age=0, private
```

### Uploads

The server must upload assets to unique urls that can be computed from the asset. For example, the `sha256` hash of an asset. 

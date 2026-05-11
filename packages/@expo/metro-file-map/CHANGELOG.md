# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 56.0.0 — 2026-05-08

### 💡 Others

- Reduce crawl time further by embedding VCS check and reducing redundant checks ([#45550](https://github.com/expo/expo/pull/45550) by [@kitten](https://github.com/kitten))

## 56.0.0-2 — 2026-05-06

### 🎉 New features

- Allow the on-demand filesystem to follow symlinks out of `watchFolders` to their targets ([#45460](https://github.com/expo/expo/pull/45460) by [@kitten](https://github.com/kitten))

### 🐛 Bug fixes

- Fix serialized snapshot not including relative roots ([#45462](https://github.com/expo/expo/pull/45462) by [@kitten](https://github.com/kitten))

## 56.0.0-1 — 2026-05-06

### 💡 Others

- Reapply `ignorePattern` to directories' normal paths to allow excluding project relative folders ([#45418](https://github.com/expo/expo/pull/45418) by [@kitten](https://github.com/kitten))

## 56.0.0-0 — 2026-05-05

### 🛠 Breaking changes

- Convert worker and plugin file processors to be non-blocking ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))
- Disable watchman by default ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))

### 🎉 New features

- Lazily stat files and populate symlinks for Node crawled file trees ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))
- Pre-resolve symlink targets and store normal POSIX paths ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))
- Implement on-demand filesystem access controlled by `enableFallback` and `scopeFallback` ([#45391](https://github.com/expo/expo/pull/45391) by [@kitten](https://github.com/kitten))

### 💡 Others

- Initial fork/implementation ([#45373](https://github.com/expo/expo/pull/45373) by [@kitten](https://github.com/kitten))
- Drop `graceful-fs` ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))
- Drop native `find` binary crawler ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))
- [Performance] Tweak Node crawler hot-path and remove overlapping roots ([#45378](https://github.com/expo/expo/pull/45378) by [@kitten](https://github.com/kitten))

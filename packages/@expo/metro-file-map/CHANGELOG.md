# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

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

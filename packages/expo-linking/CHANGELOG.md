# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

### 💡 Others

## 2.4.2 — 2021-10-15

_This version does not introduce any user-facing changes._

## 2.4.1 — 2021-10-01

_This version does not introduce any user-facing changes._

## 2.4.0 — 2021-09-09

### 🎉 New features

- Update JS code to read manifest2 when manifest is not available. ([#13602](https://github.com/expo/expo/pull/13602) by [@wschurman](https://github.com/wschurman))

## 2.3.0 — 2021-06-16

### 🐛 Bug fixes

- Fix accidental condition that caused AuthSession Google Provider to error when no scheme in Expo Go. ([#12846](https://github.com/expo/expo/pull/12846) by [@brentvatne](https://github.com/brentvatne))
- Add new manifest2 field and make existing field optional. ([#12817](https://github.com/expo/expo/pull/12817) by [@wschurman](https://github.com/wschurman))

## 2.2.3 — 2021-04-13

_This version does not introduce any user-facing changes._

## 2.2.2 — 2021-04-09

### 🎉 New features

- Add internal ability to skip warnings for scheme resolution. ([#12464](https://github.com/expo/expo/pull/12464) by [@EvanBacon](https://github.com/EvanBacon))

## 2.2.1 — 2021-03-30

### 🐛 Bug fixes

- Replace useUrl with useURL and update documentation. ([#12310](https://github.com/expo/expo/pull/12310) by [@brentvatne](https://github.com/brentvatne))

## 2.2.0 — 2021-03-10

### 🐛 Bug fixes

- Remove peerDependencies and unimodulePeerDependencies from Expo modules. ([#11980](https://github.com/expo/expo/pull/11980) by [@brentvatne](https://github.com/brentvatne))

## 2.1.1 — 2021-01-21

### 🎉 New features

- Added bare workflow support. ([#11560](https://github.com/expo/expo/pull/11560) by [@EvanBacon](https://github.com/EvanBacon))
- `Linking.createURL` creates URLs with two slashes in bare workflow. ([#11702](https://github.com/expo/expo/pull/11702) by [@EvanBacon](https://github.com/EvanBacon))

## 2.1.0 — 2021-01-15

### 🐛 Bug fixes

- Removed `fbjs` dependency ([#11396](https://github.com/expo/expo/pull/11396) by [@cruzach](https://github.com/cruzach))

## 2.0.0 — 2020-12-08

_This version does not introduce any user-facing changes._

## 1.0.6 — 2020-11-17

### 🐛 Bug fixes

- Improved mechanism used to determine whether in bare or managed workflow. ([#10993](https://github.com/expo/expo/pull/10993) by [@esamelson](https://github.com/esamelson))

## 1.0.5 — 2020-10-22

### 🐛 Bug fixes

- Prevent crash in bare workflow if `Constants.manifest` isn't defined.

## 1.0.4 — 2020-08-18

_This version does not introduce any user-facing changes._

## 1.0.3 — 2020-05-29

_This version does not introduce any user-facing changes._

## 1.0.2 — 2020-05-27

_This version does not introduce any user-facing changes._

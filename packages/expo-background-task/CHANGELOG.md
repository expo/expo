# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

- [iOS] Rethrow obj-c exception as swift error. ([#38714](https://github.com/expo/expo/pull/38714) by [@jakex7](https://github.com/jakex7))

### 💡 Others

## 0.2.8 - 2025-07-01

### 💡 Others

- Remove "Please" from warnings and errors ([#36862](https://github.com/expo/expo/pull/36862) by [@brentvatne](https://github.com/brentvatne))

## 0.2.7 — 2025-05-08

### 💡 Others

- Exposed testing method for background tasks on both iOS and Android ([#36732](https://github.com/expo/expo/pull/36732) by [@chrfalch](https://github.com/chrfalch))
- Simplified how workers are started and stopped. Removed battery constraint on Android. ([#36705](https://github.com/expo/expo/pull/36705) by [@chrfalch](https://github.com/chrfalch))

## 0.2.6 — 2025-04-30

_This version does not introduce any user-facing changes._

## 0.2.5 — 2025-04-25

### 💡 Others

- Removed throwing an exception if registerTaskAsync/unregisterTaskAsync is called on a task that is already registered/unregistered ([#36393](https://github.com/expo/expo/pull/36393) by [@chrfalch](https://github.com/chrfalch))

## 0.2.4 — 2025-04-14

_This version does not introduce any user-facing changes._

## 0.2.3 — 2025-04-11

### 💡 Others

- Added warning about Background Tasks not being supported in Expo Go ([#36063](https://github.com/expo/expo/pull/36063) by [@chrfalch](https://github.com/chrfalch))

## 0.2.2 — 2025-04-09

_This version does not introduce any user-facing changes._

## 0.2.1 — 2025-04-08

### 🐛 Bug fixes

- [android] added expo-background-task to Expo Go's configuration ([#36000](https://github.com/expo/expo/pull/36000) by [@chrfalch](https://github.com/chrfalch))

## 0.2.0 — 2025-04-04

_This version does not introduce any user-facing changes._

## 0.1.4 - 2025-04-02

### 🐛 Bug fixes

- [Android] added proguard rules for background-task consumer ([#35816](https://github.com/expo/expo/pull/35816) by [@chrfalch](https://github.com/chrfalch))

### 💡 Others

- added error handling when registering/unregistering invalid tasks with the TaskManager. ([#35734](https://github.com/expo/expo/pull/35734) by [@chrfalch](https://github.com/chrfalch))

## 0.1.3 - 2025-03-14

### 💡 Others

- added throwing an exception if registerTask is run on an iOS Simulator or a device without background modes enabled ([#35350](https://github.com/expo/expo/pull/35350) by [@chrfalch](https://github.com/chrfalch))
- [apple] Migrate remaining `expo-module.config.json` to unified platform syntax. ([#34445](https://github.com/expo/expo/pull/34445) by [@reichhartd](https://github.com/reichhartd))

## 0.1.2 - 2025-02-14

_This version does not introduce any user-facing changes._

## 0.1.1 - 2025-01-31

### 💡 Others

- [Android] Started using expo modules gradle plugin. ([#34431](https://github.com/expo/expo/pull/34431) by [@chrfalch](https://github.com/chrfalch))

## 0.0.1 — 2025-01-21

### 💡 Others

- Update README description

## 0.0.0 — 2025-01-21

### 🎉 New features

- Added expo-background-task package ([#33438](https://github.com/expo/expo/pull/33438) by [@chrfalch](https://github.com/chrfalch))

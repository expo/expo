# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 8.3.0 — 2020-07-20

### 🎉 New features

- `createCalendarAsync` now uses default calendar for given `entityType` if `sourceId` parameter (iOS only) is not provided. ([#8570](https://github.com/expo/expo/pull/8570) by [@tsapeta](https://github.com/tsapeta))

### 🐛 Bug fixes

- Fix `Calendar.getEventsAsync` crashing when `recurrenceRules` are incorrect. ([#8760](https://github.com/expo/expo/pull/8760) by [@lukmccall](https://github.com/lukmccall))
- Fixed `Calendar.createEventAsync` crashing when `alarms` were set or `endTimeZone` was null. ([#9269](https://github.com/expo/expo/pull/9269) by [@barthap](https://github.com/barthap))

## 8.2.1 — 2020-05-29

*This version does not introduce any user-facing changes.*

## 8.2.0 — 2020-05-27

### 🐛 Bug fixes

- Fixed `Calendar.getCalendarsAsync` requiring not needed permissions on iOS. ([#7928](https://github.com/expo/expo/pull/7928) by [@lukmccall](https://github.com/lukmccall))
- Fix `recurrence rule` and `event` parsing. ([#7527](https://github.com/expo/expo/pull/7527) by [@lukmccall](https://github.com/lukmccall))

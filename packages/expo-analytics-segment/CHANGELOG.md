# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

## 9.1.0 — 2020-11-17

_This version does not introduce any user-facing changes._

## 9.0.0 — 2020-08-18

### 🛠 Breaking changes

- Upgraded Segment Analytics iOS to 4.0.4. **This removes the IDFA code that was previously included with the Segment library.** If you would like to collect the IDFA, you must be in the bare workflow or use SDK < 39. ([#9606](https://github.com/expo/expo/pull/9606) by [@cruzach](https://github.com/cruzach/)).
- The `options` argument for `Segment.alias` now accepts context configuration as well as integration configuration. Previously, this expected just the `integrations` configuration. ([#9606](https://github.com/expo/expo/pull/9606) by [@cruzach](https://github.com/cruzach/)). The expected format now is:

```js
{
    integrations: {
        [integrationName]: {
            enabled: boolean,
            options: {[key: string]: any}
        }
    },
    context: {
        [key: string]: any
    }
}
```### 🎉 New features

- You can now pass in custom options to `identifyWithTraits`, `groupWithTraits`, `alias`, `trackWithProperties`, and `screenWithProperties`. This allows you to set [these common fields](https://segment.com/docs/connections/spec/common/). ([#9606](https://github.com/expo/expo/pull/9606) by [@cruzach](https://github.com/cruzach/)).

## 8.2.1 — 2020-05-29

_This version does not introduce any user-facing changes._

## 8.2.0 — 2020-05-27

_This version does not introduce any user-facing changes._
```

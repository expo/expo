---
title: Runtime Version
---

Expo Update allows you to publish over the air updates to apps. The update must be for an app running a
[compatible](../workflow/publishing/#what-version-of-the-app-will-my) runtime. You may use a runtime other than an Expo SDK, by specifying a runtime version.

The runtime version should be specified in your `app.json`:

```typescript
{
	expo: {
		...
		runtimeVersion: "2.718",
	}
}
```
## Publishing

[Publishes](../workflow/publishing/#how-to-publish) run with the runtime version set in the `app.json` will be delivered to builds running the same runtime version.

## Builds

Apps running a custom runtime version can be built with [EAS Build](../build/introduction/).

There are two ways to set the runtime version of a build.

1. (Recommended) After setting the runtime version in your `app.json`, run `expo prebuild`.
2. Edit Expo.plist on iOS and AndroidManifest.xml on Android. In Expo.plist, add an entry whose key is `EXUpdatesRuntimeVersion` and value is a string set to the desired runtime version. In AndroidManifest.xml, add a `<meta-data>` element whose `android:name` attribute is `expo.modules.updates.EXPO_RUNTIME_VERSION` and `android:value` attribute is the desired runtime version.

	### iOS

	```diff
	+ <key>EXUpdatesRuntimeVersion</key>
    + <string>2.718</string>
	```
	### Android

	```diff
	+ <meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="2.718"/>
	```

# Permissions

## Setup

```bash
cd apps/bare-expo && npx expo run:ios --port 8081
xcrun simctl openurl booted bareexpo://apis/locationnext
```

A permission change reaches the app only after a restart, so every `settings-permissions reset`
below is followed by relaunching the app and reopening the screen.

## Nothing is granted yet

Reset the permission, restart, tap **permissions.getForeground**.

`granted: false`, `status: "undetermined"`, `accuracy: "notGranted"`, `scope: "notGranted"`.

## Granting the foreground permission

Tap **permissions.requestForeground (full)**, then "Allow While Using App".

`granted: true`, `status: "granted"`, `accuracy: "full"`, `scope: "whenInUse"`.

## Upgrading to background

Tap **permissions.requestBackground**, then "Change to Always Allow".

`granted: true`, `scope: "always"`, `accuracy: "full"`.

## Denying the foreground permission

Reset, restart, tap **permissions.requestForeground (full)**, then "Don't Allow".

`granted: false`, `status: "denied"`, `canAskAgain: false`, both fields `"notGranted"`.

## Background is refused while foreground is held

Reset, restart, grant foreground only, tap **permissions.getBackground**.

`granted: false`, `scope: "notGranted"` - the response answers the permission that was asked
about, not the authorization the app holds.

## Asking again changes nothing

With the permission granted, tap **permissions.requestForeground (full)** again.

No dialog. The response matches the current state.

## Raising a reduced grant to full accuracy

Add to `apps/bare-expo/ios/BareExpo/Info.plist` and rebuild (in a managed app,
`isIosReducedAccuracyByDefault: true` in the config plugin writes the same key):

```xml
<key>NSLocationDefaultAccuracyReduced</key>
<true/>
```

Reset, restart, tap **permissions.requestForeground (full)**, then "Allow While Using App" - the
prompt says *approximate*. A second prompt asks for *precise* location, with the message from
`NSLocationTemporaryUsageDescriptionDictionary`. The request must remain pending while either
prompt is unanswered. Tap "Allow Once".

`accuracy: "full"`.

## The precise-location prompt comes first when a reduced grant is already held

Same Info.plist. Reset, restart, tap **permissions.requestForeground (reduced)** and allow - the
app now holds an approximate grant. Tap **permissions.requestForeground (full)**.

No permission prompt appears; the *precise* location prompt is the first and only prompt shown.
Before answering, verify that the request is still pending. Tap "Allow Once".

`granted: true`, `accuracy: "full"`. Repeat with **permissions.requestBackground** to check the
same for the background request.

## Declining the raise keeps the permission

Same as above, but tap "Don't Allow" on the second prompt.

`granted: true`, `accuracy: "reduced"`.

Repeat after first granting foreground with reduced accuracy. The full-accuracy request must
remain pending until "Don't Allow" is tapped, then resolve with `accuracy: "reduced"`.

## Asking for reduced accuracy skips the raise

Reset, restart, tap **permissions.requestForeground (reduced)** and allow.

`accuracy: "reduced"`, and no precise-location prompt appears.

## Raising accuracy for the background permission

Reset, restart, tap **permissions.requestForeground (reduced)** and allow, then
**permissions.requestBackground** - it asks for `accuracy: "full"` by default. The Always prompt
comes first; after "Change to Always Allow", the *precise* location prompt follows. Tap "Allow Once".

`scope: "always"`, `accuracy: "full"`.

## A purpose key missing from the plist rejects the request

Call `requestForegroundPermissionsAsync({ accuracy: 'full', fullAccuracyPurposeKey: 'NoSuchKey' })`
from the dev console, or add a button for it.

The promise rejects with `ERR_MISSING_PURPOSE_KEY` before any prompt appears. The default key
stays untouched: **permissions.requestForeground (full)** still works afterwards.

Remove `NSLocationDefaultAccuracyReduced` and rebuild before running any other plan - it makes
every fix accurate to kilometers.

## A missing usage description denies instead of crashing

Remove `NSLocationWhenInUseUsageDescription` from the Info.plist, rebuild, tap
**permissions.getForeground**.

`status: "denied"`, and the app does not crash.

## A missing usage description rejects a request

With the same Info.plist, tap **permissions.requestForeground (full)**.

The promise rejects with `ERR_MISSING_PLIST_KEY`.

# The Android fixtures

Two files and a screen, for the one claim `live-local` cannot make: that a gate reads **the platform
the app is on** rather than the platform this host defaults to.

`platform-note.ios.ts` and `platform-note.android.ts` are a platform-resolved pair, and
`platform-note.android.ts.broken` is the Android half with a syntax error in it. Copied over the good
one, it makes the entry bundle compile for iOS and fail for Android — which is the break F53 was found
with [llp/0005 §Android], and the only break that
tells "checked the right platform" apart from "checked something".

`probe.tsx` is what puts the pair in the entry bundle: Expo Router's entry imports every route, so a
route that imports the module is enough for the bundle gate to see the break.

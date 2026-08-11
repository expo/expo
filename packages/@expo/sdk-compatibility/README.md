# `@expo/sdk-compatibility`

Canonical, machine-readable compatibility information for Expo SDK releases.

The registry is intended to be shared by Expo documentation, `expo-doctor`, release tooling, and repository automation. Update `src/sdk-compatibility.json` when an SDK's platform, toolchain, or runtime requirements change; consumers should derive presentation strings such as `26.4+` from the semantic version ranges rather than maintaining their own tables.

`ios.xcodeVersionRange` is the documented Xcode range for an SDK. `ios.xcodeVersionCheckRange` is present only when a known incompatibility is safe for automated tools such as `expo-doctor` to enforce. `isXcodeVersionSupported` evaluates the narrower check range and returns `null` when no automated check is defined.

`node.minimumVersion` is the recommended minimum from the documentation table, not an exact supported-version range. For example, consumers may present `22.13.0` as `22.13.x` or compare it as a minimum, but must not treat it as restricting support to the Node 22.13 patch line.

```ts
import {
  getSdkCompatibility,
  isXcodeVersionSupported,
  sdkCompatibilityData,
} from '@expo/sdk-compatibility';

getSdkCompatibility('57.0.12');
isXcodeVersionSupported('57.0.12', '26.3'); // false
isXcodeVersionSupported('57.0.12', '26.4'); // true
```

The package is private because its first consumers are built from this monorepo. Bundled tools such as `expo-doctor` can embed the registry in their published output so compatibility checks continue to work offline.

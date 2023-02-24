# General meditations on expo-updates

Last updated: 2022-10-13

Some general meditiations / tacit knowledge on expo-updates that has accumulated through the years of working on this library.

There is some additional information in Notion (Updates module -> Past and future issues)

## General principles

Here are some overarching principles and design goals that influenced the design of expo-updates and may be helpful to keep in mind and/or decide to explicitly reject or change:

- An "update" is an atomic unit consisting of a manifest (metadata) and a set of assets that make up the update. Assets can include (but are not limited to) a JS bundle, Hermes bytecode, images, fonts, and other media required for the update. One asset is designated as the "launch asset" (generally the JS bundle / HBC) to be passed to the host (React Native) when launching the app.
- Updates can come from multiple sources. Many updates are downloaded from a remote server. Each application binary (aside from development builds) also has one update embedded in the package - the "embedded update". As much as possible, we try to treat all updates and assets the same once in expo-updates.
  - This means we copy the embedded update into SQLite and expo-updates' asset storage, even though it's already elsewhere on disk.
  - There are several advantages to this; there's generally only one path we need to worry about for launching updates, assets in embedded updates don't need to be re-downloaded if they're used in a remote update, and embedded updates remain available even if the installation is overwritten with a new build that has a new embedded update.
- The client must always be able to determine ordering of updates (given a list) without talking to the server.
  - Here is an example to illustrate this. (It sounds complex but is actually a fairly common situation.) User installs build 1, with update A embedded. Update B is published, user downloads update B. Developer now releases a new build, build 2, with update C embedded. User downloads build 2 through the App Store. Now when they launch the app, expo-updates must immediately compare updates B and C and determine which to launch, without a guaranteed server roundtrip.
  - The `SelectionPolicy` classes provide a pluggable interface for determining ordering of updates on the client.
  - Whatever strategy we use to determine an ordering of updates has some sort of implications/tradeoff. Relying solely on `createdAt`, for example, has implications for server-based rollbacks (they must actually be a new update with a later `createdAt` date in order for the client to run them).
- JS bundles are treated like any other asset. Other than the "launch asset" designation, no special casing is needed for bundles specifically, and the less special casing, the better.
- expo-updates should be written for a general server implementation (using the [Expo Updates specification](https://docs.expo.dev/technical-specs/expo-updates-0/)) and should not make any assumptions or allowances specifically for the EAS Update service. It happens to work with EAS Update, but other services should not be second class citizens.
  - In practice there are a few small places where we do have EAS-specific code, but for larger features, we have deliberately and carefully designed features to be generalizable and usable by any service.
- As much as possible, we try to separate the responsibilities / processes of "loading" an update **into** SQLite and "launching" an update **from** SQLite. The separate `Loader` and `Launcher` classes are a result of this; the processes should be able to happen separately, independently, and simultaneously.
  - The `Loader` classes modify and write to SQLite and the filesystem, while the `Launcher` classes mostly only read from SQLite and ensure integrity with the filesystem (though modify a few columns depending on whether the launch succeeded/failed).
- **It's almost always better to do anything besides crashing.** Developers rely on this module to not break users' trust in their apps. Any unintended behavior on our part can very easily break developers' trust in our tools.
  - An exception is when the crash results from developers' code (as when in error recovery mode) rather than from our code.

## Important assumptions made by expo-updates

- expo-updates uses the manifest `id` (`releaseId` for classic updates) as a unique identifier across all updates. If a server hosts two manifests with the same `id` but differences elsewhere, expo-updates will not compare the manifests and notice the difference.
  - In other words - from the server's point of view, updates are essentially immutable in the expo-updates client.
- expo-updates writes assets to disk with a filename derived from the `key` attribute in the manifest, and it assumes that any two files with the same `key` are the same asset and can be substituted for one another. This holds as long as the updates service ensures `key`s are unique across all assets (as both EAS Update and the classic Expo updates service currently do).

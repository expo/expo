# SwiftUI integration smoke test

Use a disposable Xcode SwiftUI app with a unique bundle identifier. Keep its existing root view so the test covers adding a scene to native UI.

1. Run `npx expo-embedding skill --json` from the app directory. Alternatively, use `bunx expo-embedding skill --json`. Verify the reported project and target and confirm that the command did not change files.
2. Run `npx expo-embedding init` (or `bunx expo-embedding init`). Follow the emitted skill guide to merge the host and delegate into the existing App and insert `ExpoScene(name: "Main").frame(height: 240)` inside the existing view.
3. Record the host `.pbxproj`, generated `.expo-source/ExpoEmbedding.xcodeproj/project.pbxproj`, and dependency lockfile. Run `npx expo-embedding init` again and compare them. Expect no duplicate targets, references, or source wiring.
4. Build with `xcodebuild -project App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/expo-embedding-ios-test CODE_SIGNING_ALLOWED=NO build`, substituting the actual project and scheme.
5. Stop Metro, install the built app on an iOS simulator, and launch it. Confirm that the original native UI remains visible, the Expo scene renders, and Increment changes the count. Navigate away/back and background/foreground the app. Record the simulator/runtime and screenshots.
6. Build Release separately. Validate a signed archive on a physical device and TestFlight before claiming distribution support; the simulator check does not cover signing, distribution, or every native module.

To test unpublished CLI changes, first build and pack this package, then use `npx --package /absolute/path/expo-embedding-VERSION.tgz expo-embedding <command>` for the steps above. For local debugging, `node /path/to/expo/packages/expo-embedding/bin/expo-embedding.js <command>` uses the built checkout directly.

The Jest `cli-test.ts` test builds and packs the CLI, extracts it outside the repository, and invokes its shipped entry point with temporary native projects. It checks the handoff, argument errors, packaged guides, and no-write behavior without mocking the CLI. It does not replace this native build and runtime test.

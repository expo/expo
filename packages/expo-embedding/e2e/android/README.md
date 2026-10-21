# Activity composition device tests

These instrumentation tests exercise the generated delegate against a real React host. They do not mock React Native or compare Kotlin source strings.

1. Create an Android Studio Empty Activity project with namespace `dev.expo.kudo.androidtest`, min SDK 24, and compile SDK 37. Keep the template's AndroidJUnitRunner and AndroidX test dependencies.
2. Run the built CLI's `init --platform android` from the project root. Follow the generated `.expo-source/android/INTEGRATION.md` exactly for `MainApplication`, `MainActivity`, the manifest, and theme. Keep the generated JavaScript counter app; it does not consume back presses. Do not declare CAMERA permission: the permission test uses its automatic denial to check real framework callback delivery without a dialog.
3. Copy `ExpoActivityDelegateTest.kt` into `app/src/androidTest/java/dev/expo/kudo/androidtest/`.
4. Start an emulator and run `./gradlew :app:connectedDebugAndroidTest`. This installs and may uninstall the test application; use a disposable host/application ID.
5. Build and install Debug again, launch without Metro, increment the JS counter, rotate, background/foreground, and press Back. The scene must render after recreation and native navigation must still work. Build `:app:assembleRelease` to check the optimized variant.

For an existing host with another namespace, update the test's package and Application/Activity class names. Run tests in an isolated copy if the host has user data to preserve. No UI change is intended by the delegate migration.

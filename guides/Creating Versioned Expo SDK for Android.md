# Creating Versioned Expo SDK for Android

This document will guide you through the process of creating a versioned snapshot of Expo SDK solely for Expo client's use. Instructions for creating a new version of `expokit` which is used in ejected projects, see `Updating Expokit Package For Ejected Android Projects` doc.

1. **Ensure that `@expo/xdl` dependency is up-to-date**

    **Why:** `@expo/xdl` is used throughout the process to eg. obtain a list of unimodules to version, so it's important to have it updated not to omit any package when versioning.

    **How:** See if there are any [waiting pull requests on the XDL repository](https://github.com/expo/expo-cli/pulls). See if there are any changes to XDL that aren't published to NPM. See if latest version of `@expo/xdl` is required in `tools/package.json`. Ensure that `node_modules` are up-to-date by running `yarn` in `tools`.

2. **Ensure native code for any to-be-deprecated SDKs is removed from Expo client**

    **Why:** Expo client contains native code for multiple SDKs (that's one of its purposes). Often (if not always) when releasing a new version of Expo we drop the last one (smaller maintenance burden).

    **How:** Any directory pointers from now on will assume current working directory is `android`.
        - remove `versioned-abis/expoview-abiXX_X_X` for deprecated SDKs
        - if deprecated SDKs depended on any `expolib_vX` libraries on which no other SDK now depends, remove those dependencies from `verisoned-abis/maven/` (`expolib_vX` libraries are created by us with [JarJar](https://github.com/shevek/jarjar) so we can have multiple versions of dependencies in one application)
        - remove `abiXX_X_X` item from a list of supported SDKs in `settings.gradle` (the list is mapped to include supported `expoview-abiXX_X_X` projects in the `android` project)
        - remove appropriate entry from `allprojects.repositories` block from `build.gradle` (`maven { url { …abiXX_X_X… } }`)
        - search in `.` (`/android`) for `SDK_XX` string — go through every found entry and decide what to do with the appropriate code. At the moment all search results are `BEGIN_SDK_XX` and `END_SDK_XX`, code between which should be just removed
        - (I would suggest _with Android Studio_) look for every usage of `ABIVersion.toNumber(String abiVersion)` method which is used whenever someone wants to create a code path depending on the SDK version in the unversioned code. Try to remove the codepath if possible
        - search in Java and Kotlin files for `/SDK(?!_INT)/`. Look through every entry and see if you can drop any no longer used code path
        - (if dropping some Android version support) look for `SDK_INT` in the codebase and see if you can simplify the logic

3. **`react-native` submodule is set to proper commit for the new SDK**

    **Why:** The submodule is the source of truth for `react-native` version used throughout the repository. We will use it in later steps.
    
    **How:** Coordinate with James (@ide) to create a new branch for new SDK (`sdk-XX.X.X` typically) and point the submodule to latest commit on that branch. Run `git submodule update --init` in the root of the repository.

4. **`android/{ReactAndroid,ReactCommon}` are up-to-date (to `react-native` submodule)**

    **Why:** Those folders hold the code that is used to build the Client, to build packages for ejected projects, to test unimodules and `expoview`. It is a copy of `react-native` code with some Expo-specific modifications to it (eg. to exception handling, to HTTP client fetching). See `android/tools/…/ReactAndroidCodeTransformer.java` for more details.

    **How:** Run `gulp android-update-rn` in `tools`. The gulp task will execute the `CodeTransformer` mentioned, which, in turn, copies files from `react-native` submodule and applies modifications.

5. **Build a custom version of React Native for the new SDK to be included in Expo client**

    **Why:** It's impossible to have multiple versions of same classes in one application, but at the same time we want to have multiple versions of React Native in one application. So we prefix class packages with `abiXX_X_X.` and package standalone libraries.

    **How:** In `tools` run:
      * `gulp android-update-versioned-rn`. The library will be built and assembled in `android/versioned-react-native`, so we need to copy the code there.

      * `gulp android-rename-jni-libs --abi XX.X.X`. It's not possible to have multiple native libraries with the same name in one application, so we change names of some of the native libraries so they include the ABI version name.

      * `gulp android-build-aar --abi XX.X.X`. This gulp task builds an AAR for versioned React Native and integrates it into the Android project. See `tools/android-build-aar.sh` for more information on how it's done.

6. **Copy and version both Expo code and unimodules to a separate `expoview-abiXX_X_X` library**

    **Why:** With each release a snapshot of Expo+Unimodules code is created, transformed and added to the root project. Having a separate copy allows us to always be able to easily inspect and debug any issues we may want to fix in old SDKs. All the transformed classes from `expoview` library start with `versioned.` package, which in the process of versioning gets changed to `abiXX_X_X.`. All unimodules start with either `expo.` or `org.unimodules.`, both of which are just prefixed with `abiXX_X_X.`.

    **How:** In `tools` run:
      * `gulp android-copy-native-modules --abi XX.X.X`. Java and Kotlin code from `/android/expoview` will be copied to `/android/versioned-abis/expoview-abiXX_X_X` and transformed (imports will be changed according to the rules defined in the **why** and `android-packages-to-{keep,rename}.txt` files, which contain lists of packages to, respectively, keep unchanged or rename, i.e. `$package` ➡️ `abiXX_X_X.$package`).
      * `gulp android-copy-universal-modules --abi XX.X.X`. Java and Kotlin code for every versionable package (a list of versionable packages is maintained in `@expo/xdl`) will be copied and prefixed according to `android-packages-to-{keep,rename}.txt` files role of which was explained in the point above).

7. **Ensure the root project compiles and builds the application correctly**

    **Why:** At this point you should be done with all the steps for which you would use automated tools. However, in some places the versioning script isn't perfect and may produce incorrect or incomplete results.

    **How:** Open `/android` project in Android Studio and try to run `app` on a device or in an emulator.
      * One of the known issues is `.R` support. Since when unimodules are versioned, they are being moved from `expo-{unimodule-name}` to `expoview-abiXX_X_X`, package of the autogenerated `.R` class should also be changed from `abiXX_X_X.expo.modules.{fqdn}.R` to `abiXX_X_X.host.exp.expoview.R`. In the future I believe the tooling should be doing this replacement, for now however, go through every incompilable file and replace invalid `.R` reference with reference to the right one.
      * Another one is missing import for `BuildConfig`. (At least) in `expo-payments-stripe` package `BuildConfig` is used which doesn't need to be imported when the code is in the original package, however when the code is in `expoview-abiXX_X_X` we need to
        ```java
        import abiXX_X_X.host.exp.expoview.BuildConfig;
        ```
        Go through every failing file and add the import as suggested by the IDE.
      * Not everywhere `SingletonModules` may be imported properly. It looks like (at least) in `ExponentPackage.java` and in `ExponentPackageDelegate.java` one may need to manually change the import from `abiXX_X_X.org.…….SingletonModule` to `org.….SingletonModule`.
      * In the same `ExponentPackage.java` there should be another compile error about invalid use of `abiXX_X_X.….ReactContext` where `….ReactContext` is expected. Fortunately just above the failing line there is a comment that this line should be removed when in versioned library, so just remove it.
      * The last failing place should be `VersionedUtils.java`. There are two arguments that should be changed to `null`. There should be a comment explaining which ones. We need to change them to `null`s. Those arguments are used in ejected scenario, where a developer is able to customize list of packages to be created and `ModuleRegistry` used. Since this code will never be used in an ejected scenario, we can safely fall back to Expo client behavior.
      * Delete `expoview-abiXX_X_X/…/expo.loaders`. `expo-app-loader-provider`, from which `expo.loaders` are copied isn't a perfectly unimodules-compatible module yet, we need to manually delete it after versioning.
      * Delete `expoview-abiXX_X_X/…/expo.modules.print/PrintDocumentAdapter*Callback.java`. The files tap into `android.print` package to make some package-private classes public. Versioning doesn't change anything in these classes and since we have exactly the same copy in the original `expo-print`, compilation will fail (duplicate `Program type already present`).
      * After deleting `PrintDocumentAdapter*Callback.java` from `expoview-abiXX_X_X` you may need to add proper imports to `PrintPDFRenderTask.java` (the compilation will fail, just follow IDE's suggestions).

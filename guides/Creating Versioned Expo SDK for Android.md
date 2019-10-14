# Creating Versioned Expo SDK for Android

This document will guide you through the process of creating a versioned snapshot of Expo SDK solely for Expo client's use. Instructions for creating a new version of `expokit` which is used in ejected projects, see `Updating Expokit Package For Ejected Android Projects` doc.

1. **Ensure that `@expo/xdl` dependency is up-to-date**

    **Why:** `@expo/xdl` is used throughout the process to eg. obtain a list of unimodules to version, so it's important to have it updated not to omit any package when versioning.

    **How:** See if there are any [waiting pull requests on the XDL repository](https://github.com/expo/expo-cli/pulls). See if there are any changes to XDL that aren't published to NPM. See if latest version of `@expo/xdl` is required in `tools/package.json`. Ensure that `node_modules` are up-to-date by running `yarn` in `tools`.

2. **Ensure native code for any to-be-deprecated SDKs is removed from Expo client**

    **Why:** Expo client contains native code for multiple SDKs (that's one of its purposes). Often (if not always) when releasing a new version of Expo we drop the last one (smaller maintenance burden).

    **How:** Any directory pointers from now on will assume current working directory is `android`.
      - Run `et remove-sdk-version -p android` and choose the SDK to remove from the list. This script removes versioned code for given SDK version and removes almost all references to this version in source files. Any references that the script couldn't remove automatically will be shown at the end of the script - iterate through them and decide what to do with each one, most of them can be just removed if the code is no longer used.
      - Search in Java and Kotlin files for `/SDK(?!_INT)/`. Look through every entry and see if you can drop any no longer used code path.
      - (If dropping some Android version support) Look for `SDK_INT` in the codebase and see if you can simplify the logic.

3. **`react-native` submodule is set to proper commit for the new SDK**

    **Why:** The submodule is the source of truth for `react-native` version used throughout the repository. We will use it in later steps.
    
    **How:** Coordinate with James (@ide) to create a new branch for new SDK (`sdk-XX.X.X` typically) and point the submodule to latest commit on that branch. Run `git submodule update --init` in the root of the repository.

4. **`android/{ReactAndroid,ReactCommon}` are up-to-date (to `react-native` submodule)**

    **Why:** Those folders hold the code that is used to build the Client, to build packages for ejected projects, to test unimodules and `expoview`. It is a copy of `react-native` code with some Expo-specific modifications to it (eg. to exception handling, to HTTP client fetching). See `android/tools/…/ReactAndroidCodeTransformer.java` for more details.

    **How:** Run `gulp android-update-rn` in `tools`. The gulp task will execute the `CodeTransformer` mentioned, which, in turn, copies files from `react-native` submodule and applies modifications.

5. **Build a custom version of React Native for the new SDK to be included in Expo client**

    **Why:** It's impossible to have multiple versions of same classes in one application, but at the same time we want to have multiple versions of React Native in one application. So we prefix class packages with `abiXX_X_X.` and package standalone libraries.

    **How:** Run `et add-sdk --platform android --sdkVersion XX.X.X`.

    This script will run through a number of different steps, including:
      * Updating the code in `android/versioned-react-native`
      * Renaming JNI libraries to include the SDK version name
      * Building the versioned ReactAndroid AAR
      * Creating versioned copies of expoview and unimodules. All the transformed classes from `expoview` library start with `versioned.` package, which in the process of versioning gets changed to `abiXX_X_X.`. All unimodules start with either `expo.` or `org.unimodules.`, both of which are just prefixed with `abiXX_X_X.`. Imports will be changed according to these rules and the `android-packages-to-{keep,rename}.txt` files, which contain lists of packages to, respectively, keep unchanged or rename, i.e. `$package` ➡️ `abiXX_X_X.$package`.
      * Some other miscellaneous tasks (changing/adding/removing code in certain places)

    If the script fails at any point, you may need to check out all changes and rerun the script from the beginning after fixing the cause of the issue.

7. **Ensure the root project compiles and builds the application correctly**

    **Why:** At this point you should be done with all the steps for which you would use automated tools. However, in some places the versioning script isn't perfect and may produce incorrect or incomplete results.

    **How:** Open `/android` project in Android Studio and try to run `app` on a device or in an emulator. Fix any issues that prevent the app from building and running.
      * Keep track of any issues you need to fix, and update the versioning scripts so that you don't have to fix them again in the future!

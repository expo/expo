# Updating Expokit Package For Ejected Android Projects and Turtle

This document will guide you through the process of creating a new version of `expokit` which is used in ejected projects and in Turtle. Instructions for creating a versioned snapshot of Expo SDK solely for Expo client's use, see `Creating Versioned Expo SDK for Android` doc.

1. **Update AARs in `expokit-npm-package`**

    **Why:** AARs are prebuilt versions of Android libraries. Prebuilding them on our side allows developers and Turtle to build their projects faster and without extra setup steps that could be required for some libraries to work (eg. if we would decide to distribute `expoview` as a library to compile yourself).

    Prebuilt AARs for `expoview` and all unimodules are put into `expokit` NPM package which is then published and depended upon by ejected user projects. Configuration in `android/app/build.gradle` is set up so that ejected user projects include unimodules code from `node_modules` (_live code_) and `expoview` from AAR (prebuilt). This allows developers to modify native code if needed and upgrade quicker. Turtle, on the other hand, uses AARs for both `expoview` and unimodules.

    **How:** Run `expotools android-build-packages --sdkVersion XX.X.X`. The script will delete contents of `expokit-npm-package`, clear [local Maven repository](https://www.mkyong.com/maven/where-is-maven-local-repository/), clean `build` folder for every package to prebuild and… prebuild (by running `:{library-name}:uploadArchives` Gradle tasks). Archives are uploaded to local Maven repository from where they are then copied to `expokit-npm-package`.

    If the script fails during the compilation step of any package, it will print out the raw error message from Gradle. You should fix the error in the affected package. You may then either discard all changes made by the script to `expokit-npm-package` (deleted contents in preparation for new archives) and to `android` (some changes should be committed after the script is done, some are temporary) and rerun the script entirely, or just rerun the script for the affected packages only. (Instructions will be printed from the script itself in this case.)

2. **Update Expo ejected project template**

    **Why:** When a developer runs `expo eject`, a template of an Android project is downloaded. For example it contains `android/app` folder (so it contains `build.gradle`, Java files, etc.)

    **How:** If the working directory is clean, run (anywhere in the repository)
    
      ```
      et android-update-expokit --appVersion {appVersion} --sdkVersion {sdkVersion} --expokitVersion {expokitVersion} --expokitTag rc
      ```

      * `{appVersion}` — version of the template, usually one would use the same version that is used in `app/build.gradle` as the version of Expo client
      * `{sdkVersion}` — SDK version for which the template is, (`XX.X.X`)
      * `{expokitVersion}` — version under which `expokit-npm-package` should be published (`XX.X.X-rc.0`)
      * `rc` — tag under which `expokit-npm-package` should be published 

      This command will update the template on staging and publish `expokit` to NPM.

3. **Test Turtle on staging**

    **Why:** Turtle uses projects differently than developers of ejected projects, so we need to test this workflow separately.

    **How:** Given you pushed the changes to `sdk-XX` branch, open (or create if needed) a pull request of `sdk-XX` to `master`, go to _Checks_ tab, open `shell_app` CI workflow results for that branch and approve the `shell_app_android_approve_build` job from `shell_app` workflow. Wait for the `shell_app_android_build` job to finish, then copy the URL printed at the end and follow Turtle instructions of deploying a new version of SDK to staging. When deployed, run `EXPO_STAGING=1 expo build:android` in an upcoming SDK unejected project.

4. **Test `expokit` package and ejected project template**
    
    **Why:** Ejected projects are structured differently than Expo client project so we need to test them separately.
    
    **How:** In an upcoming SDK unejected project (at least `expo init`, upgraded dependencies and `app.json`) run `EXPO_STAGING=1 expo eject`. This should download the archived template and install recently published `expokit`.

5. **Publish `expokit` as latest stable version**

    **Why:** Until now `expokit` should be published as `rc`. We should publish it as `latest`, final version for clearness.

    **How:** Just as in step 2., run `et android-update-expokit` with final `expokitVersion` and `latest` as `expokitTag`.

6. **Publish template to production**

    **Why:** Until now any changes were being made on staging, we now may want to push the changes to production.

    **How:** Run `et promote-versions`, verify that you consent the changes that are to be applied, and accept the diff.

7. **Deploy Turtle to production**

    **Why:** So that people can build Android apps with new SDK.

    **How:** Follow Turtle deployment instructions.

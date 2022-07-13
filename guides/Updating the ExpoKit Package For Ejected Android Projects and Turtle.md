# Updating Prebuilt Android Packages For Turtle

This document will guide you through the process of creating a new version of prebuilt Android packages which are used in Turtle. For instructions for creating a versioned snapshot of Expo SDK solely for Expo Go's use, see `Creating Versioned Expo SDK for Android` doc.

1. **Update AARs in local Maven repo**

    **Why:** AARs are prebuilt versions of Android libraries. Prebuilding them on our side allows developers and Turtle to build their projects faster and without extra setup steps that could be required for some libraries to work (eg. if we would decide to distribute `expoview` as a library to compile yourself).

    Prebuilt AARs for `expoview` and all unimodules are put into local Maven repo. Turtle uses AARs for both `expoview` and unimodules.

    **How:** Run `expotools android-build-packages --sdkVersion XX.X.X`. The script will delete contents of `android/maven`, clear [local Maven repository](https://www.mkyong.com/maven/where-is-maven-local-repository/), clean `build` folder for every package to prebuild and… prebuild (by running `:{library-name}:uploadArchives` Gradle tasks). Archives are uploaded to local user Maven repository from where they are then copied to repository Maven repo.

    If the script fails during the compilation step of any package, it will print out the raw error message from Gradle. You should fix the error in the affected package. You may then either discard all changes made by the script to `android/maven` (deleted contents in preparation for new archives) and to `android` (some changes should be committed after the script is done, some are temporary) and rerun the script entirely, or just rerun the script for the affected packages only. (Instructions will be printed from the script itself in this case.)

2. **Test Turtle on staging**

    **Why:** Turtle uses projects differently than developers of ejected projects, so we need to test this workflow separately.

    **How:** Given you pushed the changes to `sdk-XX` branch, open (or create if needed) a pull request of `sdk-XX` to `main`, go to _Checks_ tab, open `shell_app` CI workflow results for that branch and approve the `shell_app_android_approve_build` job from `shell_app` workflow. Wait for the `shell_app_android_build` job to finish, then copy the URL printed at the end and follow Turtle instructions of deploying a new version of SDK to staging. When deployed, run `EXPO_STAGING=1 expo build:android` in an upcoming SDK unejected project.

3. **Publish template to production**

    **Why:** Until now any changes were being made on staging, we now may want to push the changes to production.

    **How:** Run `et promote-versions`, verify that you consent the changes that are to be applied, and accept the diff.

4. **Deploy Turtle to production**

    **Why:** So that people can build Android apps with new SDK.

    **How:** Follow Turtle deployment instructions.

# Releasing `expo-updates`

Last updated: 2022-10-13

Significant releases of expo-updates usually happen as part of the SDK release process (though sometimes we release patches in between SDK versions). As of October 2022, @brentvatne is in charge of the SDK release process and is a good reference point for the actual process of releasing.

The main consideration when releasing expo-updates is testing. Our automated tests still do not cover the wide variety of scenarios expo-updates will encounter in the wild, so some level of manual testing is almost always a good idea if there are any significant changes being released. (This generally happens outside of the normal release QA process.) Generally, the more changes that have landed, the more manual testing should be done.

Conversely, the more situations that are covered by reliable e2e tests, the less manual testing needs to be done when releasing a new version.

Some scenarios to make sure and test (that, as of October 2022, aren't covered by e2e tests):
- Carefully test everything you can think of around any changes that have been made since the last version. For example, if there was a DB migration, try upgrading from an old version and making sure that all the features affected by the migration work as expected.
- Basic scenarios are now covered in e2e, but it's always good to make sure local assets are working correctly. You can test this by making a build, publishing an update with a new image asset, launching the build and downloading the update, and turning off wifi before launching the new update. The new image asset should load without issue. (Displaying the output of `Image.resolveAssetSource` is also useful; it should be a path on disk including the `.expo-internal` directory.)
- It's always good to test upgrading from the previous version of expo-updates, as this is rarely tested but happens very commonly. Make a build with the previous SDK's expo-updates, publish and download and update, and then overwrite the installation with a new build that has the new version of expo-updates, publish and download an update. Make sure everything works as expected. For good measure, have a shared asset or two in the updates.

### Other release considerations

- When possible, it's a good idea to save database migrations to be released alongside a new SDK version, since this usually means a new runtime version and guaranteed new updates (meaning if something goes wrong, users are less likely to notice an unexpected change).

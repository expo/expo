# Expo CircleCI Configuration

## Android Docker Image

Whenever possible, we prefer to use Circle's [prebuilt images](https://circleci.com/docs/2.0/circleci-images/), but in the case of Android it will be a few more releases before we'll be able to reliably use an off-the-shelf image, due to RN's NDK  and SDK version requirements at the time of writing.

To build changes to the Android docker image, from the repo root run:

```
$ yarn android-image [tag]
```

If you specify a tag, the script will tag the image and also print the command to push it to the appropriate container registry. When you're ready to use the pushed tag in CI, update the tag the `android_job` anchor snippet.

If you need to quickly open a shell in a freshly-built container defined by your local dockerfile, run `yarn android-shell`. This will build the image and tag it as `shell` before providing you with an ephemeral bash session.

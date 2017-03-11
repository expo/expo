# Expo Documentation

Hi! This is what will make Expo actually be useable by people. :)

## How to edit

#### A note about versioning

Expo's SDK is versioned so that apps made on old SDKs are still supported
when new SDKs are relased. The website documents previous SDK versions too.

Version names correspond to directory names under `versions/`.

`unversioned` is a special version for the next SDK release. `devdocs` isn't
actually an SDK version, it's a special version that corresponds to the
"Tool Developer Documentation" website.

Sometimes you want to make an edit in version `X` and have that edit also
be applied in versions `Y, Z, ...` (say, when you're fixing documentation for an
API call that existed in old versions too). You can use the
`./scripts/versionpatch.sh` utility to apply your `git diff` in one version in
other versions. For example, to update the docs in `unversioned` then apply it
on `v8.0.0` and `v7.0.0`, you'd do the following after editing the docs in
`unversioned` such that it shows up in `git diff`:

```./scripts/versionpatch.sh unversioned v8.0.0 v7.0.0```

Any changes in your `git diff` outside the `unversioned` directory are ignored
so don't worry if you have code changes or such elsewhere.

### As a random person

Thanks for helping! :D make your changes on a fork of this repository or
whatever works for you and submit a pull request. We'll take a look and
incorporate them!

### As an Expo developer

- Make your changes in `universe/docs` and commit them. Our `shipit` bot
synchronizes the changes to the public `expo-docs` repository. Changes will
automatically be deployed to https://docs.expo.io on deploy. To change
the default version, update the version key in `docs/package.json` (the
deploy script will respect this value).

### Testing changes locally

Make sure your machine has Docker for Mac. If it doesn't go to https://docs.docker.com/docker-for-mac/ and download and install it.

Be sure you've run all unigulp-y things.

```bash
yarn && yarn start
```

from this directory. The site is viewable at `http://localhost:8000`.

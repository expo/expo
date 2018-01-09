# Expo Documentation

Hi! This is what will make Expo actually be useable by people. :)

## How to edit

Usually you want to edit the docs in the `unversioned` directory. If you want
your changes to appear right away (instead of waiting for the next sdk release),
read on to the next section.

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

Thanks for helping! :D Make your changes on a fork of this repository or
whatever works for you and submit a pull request. We'll take a look and
incorporate them!

### As an Expo developer

- Make your changes in `universe/docs` and commit them. Our `shipit` bot
synchronizes the changes to the public `expo-docs` repository. Changes will
automatically be deployed to https://docs.expo.io on deploy. To change
the default version, update the version key in `docs/package.json` (the
deploy script will respect this value).

### Testing changes locally

Make sure your machine has [Docker installed](https://docs.docker.com/engine/installation/#platform-support-matrix).

Make sure you've run `bootstrap docs/` from the root of Universe.

```bash
yarn && yarn start
```

If you get an error try:

```bash
cd gatsby
rm -rf node_modules
yarn
```

from this directory. The site is viewable at `http://localhost:8000/versions/unversioned/index.html`.

In my case (Brent), I need to go to `http://0.0.0.0:8000/versions/unversioned/index.html` for hot reloading
to work.

If Docker is not available for you, run `yarn run start-no-nginx` -- the site will be available at `http://localhost:8000/versions/<version>/index.html`. However, certain redirects won't work, and you'll have to navigate directly to the documentation you want to view.

To add new documentation files, edit the `yaml` files under `gatsby/src/data`.

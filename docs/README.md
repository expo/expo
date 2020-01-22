# Expo Documentation

This is the public documentation for **Expo**, its SDK, client and services.

You can access this documentation online at https://docs.expo.io/. It's built using next.js on top of the https://github.com/zeit/docs codebase.

> **Contributors:** Please make sure that you edit the docs in the `pages/versions/unversioned` directory if you want your changes to apply to the next SDK version too!

### Running Locally

Download the copy of this repository.

```sh
git clone https://github.com/expo/expo.git
```

Then `cd` into the `docs` directory and install dependencies with:

```sh
yarn
```

Then you can run the app with (make sure you have no server running on port `3000`):

```sh
yarn run dev
```

Now the documentation is running at http://localhost:3000

### Running in production mode

```sh
yarn run export
yarn run export-server
```

### Editing Docs Content

You can find the source of the documentation inside the `pages/versions` directory. Documentation is mostly written in markdown with the help of some React components (for Snack embeds, etc). The routes and navbar are automatically inferred from the directory structure within `versions`.

### Redirects

#### Server-side redirects

These redirects are limited in their expresiveness - you can map a path to another path, but no regular expressions or anything are supported. See client-side redirects for more of that. Server-side redirects are re-created on each run of `deploy.sh`.

We currently do two client-side redirects, using meta tags with `http-equiv="refresh"`:

- `/` -> `/versions/latest/`
- `/versions` -> `/versions/latest`

This method is not great for accessibility and should be avoided where possible.

#### Client-side redirects

Use these for more complex rules than one-to-one path-to-path redirect mapping. For example, we use client-side redirects to strip the `.html` extension off, and to identify if the request is for a version of the documentation that we no longer support.

You can add your own client-side redirect rules in `pages/_error.js`.

### Adding Images and Assets

You can add images and assets to the `static` directory.  They'll be served by the production and staging servers at `/static`.

### New Components

Always try to use the existing components and features in markdown. Create a new component or use a component from NPM, unless there is no other option.

### Quirks

* You can't have curly brace without quotes: \`{}\` -> `{}`
* Make sure to leave a empty newline between a table and following content

## A note about versioning

Expo's SDK is versioned so that apps made on old SDKs are still supported
when new SDKs are relased. The website documents previous SDK versions too.

Version names correspond to directory names under `versions`.

`unversioned` is a special version for the next SDK release. It is not included in production output

`latest` is an untracked folder which duplicates the contents of the folder matching the version number in `package.json`.

Sometimes you want to make an edit in version `X` and have that edit also
be applied in versions `Y, Z, ...` (say, when you're fixing documentation for an
API call that existed in old versions too). You can use the
`./scripts/versionpatch.sh` utility to apply your `git diff` in one version in
other versions. For example, to update the docs in `unversioned` then apply it
on `v8.0.0` and `v7.0.0`, you'd do the following after editing the docs in
`unversioned` such that it shows up in `git diff`:

`./scripts/versionpatch.sh unversioned v8.0.0 v7.0.0`

Any changes in your `git diff` outside the `unversioned` directory are ignored
so don't worry if you have code changes or such elsewhere.

### Updating latest version of docs

When we release a new SDK, we copy the `unversioned` directory, and rename it to the new version. Latest version of docs is read from `package.json` so make sure to update the `version` key there as well. However, if you update the `version` key there, you need to `rm -rf node_modules/.cache/` before the change is picked up (why? [read this](https://github.com/zeit/next.js/blob/4.0.0/examples/with-universal-configuration/README.md#caveats)).

Make sure to also grab the upgrade instructions from the release notes blog post and put them in `upgrading-expo-sdk-walkthrough.md`.

That's all you need to do. The `versions` directory is listed on server start to find all available versions. The routes and navbar contents are automatically inferred from the directory structure within `versions`.

Because the navbar is automatically generated from the directory structure, the default ordering of the links under each section is alphabetical. However, for many sections, this is not ideal UX. So, if you wish to override the alphabetical ordering, manipulate page titles in `navigation.js`.

#### Importing from the React Native docs

You can import the React Native docs in an automated way into these docs.

1. Update the react-native-website submodule here
2. `yarn run import-react-native-docs`

This will write all the relevant RN doc stuff into the unversioned version directory.
You may need to tweak the script as the source docs change; the script hackily translates between the different forms of markdown that have different quirks.

The React Native docs are actually versioned but we currently read off of master.

TODOs:
    - Handle image sizing in imports better
    - Read from the appropriate version (configurable) of the React Native docs, not just master
    - Make Snack embeds work; these are marked in some of the React Native docs but they are just imported as plain JS code blocks

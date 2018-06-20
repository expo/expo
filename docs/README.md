# Expo Documentation

This is the public documentation for **Expo**, its SDK, client and services.

You can access this documentation online at https://docs.expo.io/. It's built using next.js on top of the https://github.com/zeit/docs codebase.

### Running Locally

Download the copy of this repostory.

```sh
git clone https://github.com/expo/expo-docs.git
```

Then `cd` into the downloaded directory and install dependencies with:

```sh
yarn
```

Then you need to install babel-cli

```sh
yarn global add babel-cli
```

Then you can run the app with (make sure you have no server running on port 3000):

```sh
yarn run dev
```

This starts two processes: a `next.js` server, and a compiler/watcher that converts markdown files into javascript pages that `next.js` understands.

Now the documentation is running at http://localhost:3000

### Running in production mode

```sh
yarn run build
yarn run start
```

### Editing Docs Content

You can find the source of the documentation inside the `versions` directory. Documentation is mostly written in markdown with the help of some React components (for Snack embeds, etc). The routes and navbar are automatically inferred from the directory structure within `versions`.

### Adding Images and Assets

You can add images and assets in the same directory as the markdown file, and you just need to reference them correctly.

### New Components

Always try to use the existing components and features in markdown. Create a new component or use a component from NPM, unless there is no other option.

### Quirks

* You can can't have curly brace without quotes: '{}' -> `{}`
* Make sure to leave a empty newline between a table and following content

## Transition from current docs to next.js docs

### Compile process

In both `yarn run start` and `yarn run dev`, we initially compile (see `mdjs` dir) all `.md` files in `versions` to `.js` files under `pages/versions` (which is git-ignored, and never commited). At this point, we also generate the json file `navigation-data.json` for the navbar, and copy images in `versions` to the `static` folder.

In `yarn run dev`, the watcher watches for changes to files in `versions`, and re-compiles as necessary. Note: navigation changes probably won't live-reload so make sure to restart the server.

### Not breaking existing incoming links

`transition/sections.js` is used to figure out which URLs to alias. In order to not break existing URLs such as guides/configuration (the new URL is the more sensible workflow/configuration, automatically inferred from the fact that configuration.md is in the workflow subdir), in next.js, we support both so we need to keep a list of URLs to alias under guides. For future versions, the guides URL for `configuration` won't exist at all so we can slowly phase out this file.

## A note about versioning

Expo's SDK is versioned so that apps made on old SDKs are still supported
when new SDKs are relased. The website documents previous SDK versions too.

Version names correspond to directory names under `versions`.

`unversioned` is a special version for the next SDK release.

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

That's all you need to do. The `versions` directory is listed on server start to find all available versions. The routes and navbar contents are automatically inferred from the directory structure within `versions`. So, `/versions/v24.0.0/guides/development-mode` refers to `pages/versions/guides/development-mode`.

Because the navbar is automatically generated from the directory structure, the default ordering of the links under each section is alphabetical. However, for many sections, this is not ideal UX. So, if you wish to override the alphabetical ordering, manipulate page titles in `sidebar-navigation-order.js`.

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

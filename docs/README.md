# Expo Documentation

This is the public documentation for **Expo**, its SDK, client, and services, like **EAS**.

This documentation is built using Next.js and you can access it online at https://docs.expo.dev/.

> **Note** **Contributors:** Please make sure that you edit the docs in the `pages/versions/unversioned` directory if you want your changes to apply to the next SDK version too!

> **Note**
> If you are looking for Expo Documentation Writing Style guidelines, please refer [Expo Documentation Style Guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

## Running Locally

Download the copy of this repository.

```sh
git clone https://github.com/expo/expo.git
```

Then `cd` into the `docs` directory and install dependencies with:

```sh
yarn
```

Then you can run the app with (make sure you have no server running on port `3002`):

```sh
yarn run dev
```

Now the documentation is running at http://localhost:3002, and any changes you make to markdown or JavaScript files will automatically trigger reloads.

### To run locally in production mode

```sh
yarn run export
yarn run export-server
```

## Editing Docs Content

You can find the content source of the documentation inside the `pages/` directory. Documentation is mostly written in markdown with the help of some React components (for Snack embeds, etc). Our API documentation can all be found under `pages/versions/`; we keep separate versions of the documentation for each SDK version currently supported in Expo Go, see ["A note about versioning"](#a-note-about-versioning) for more info. The routes and navbar are automatically inferred from the directory structure within `versions`.

> **Note**
> We are currently in the process of moving our API documentation to being auto-generated using `expotools`'s `GenerateDocsAPIData` command.

Each markdown page can be provided metadata in the heading, distinguished by:

```
---
metadata: goes here
---
```

These metadata items include:

- `title`: Title of the page shown as the heading and in search results
- `hideFromSearch`: Whether to hide the page from Algolia search results. Defaults to `false`.
- `hideInSidebar`: Whether to hide this page from the sidebar. Defaults to `false`.
- `hideTOC`: Whether to hide the table of contents (appears on the right sidebar). Defaults to `false`.
- `sidebar_title`: The title of the page to display in the sidebar. Defaults to the page title.

### Editing Code

The docs are written with Next.js and TypeScript. If you need to make code changes, follow steps from the [Running locally](#running-locally) section, then open a separate terminal and run the TypeScript compiler in watch mode - it will watch your code changes and notify you about errors.

```sh
yarn watch
```

When you are done, you should run _prettier_ to format your code. Also, don't forget to run tests and linter before committing your changes.

```sh
yarn prettier
yarn test
yarn lint
```

## Redirects

### Server-side redirects

These redirects are limited in their expressiveness - you can map a path to another path, but no regular expressions or anything are supported. See client-side redirects for more of that. Server-side redirects are re-created on each run of **deploy.sh**.

We currently do two client-side redirects, using meta tags with `http-equiv="refresh"`:

- `/` -> `/versions/latest/`
- `/versions` -> `/versions/latest`

This method is not great for accessibility and should be avoided where possible.

### Client-side redirects

Use these for more complex rules than one-to-one path-to-path redirect mapping. For example, we use client-side redirects to strip the `.html` extension off, and to identify if the request is for a version of the documentation that we no longer support.

You can add your own client-side redirect rules in `common/error-utilities.ts`.

## Algolia Docsearch

We use Algolia Docsearch as the search engine for our docs. Right now, it's searching for any keywords with the proper `version` tag based on the current location. This is set in the `components/DocumentationPage` header.

In `components/plugins/AlgoliaSearch`, you can see the `facetFilters` set to `[['version:none', 'version:{currentVersion}']]`. Translated to English, this means "Search on all pages where `version` is `none`, or the currently selected version.".

- All unversioned pages use the version tag `none`.
- All versioned pages use the SDK version (e.g. `v40.0.0` or `v39.0.0`).
- All `hideFromSearch: true` pages don't have the version tag.

## Quirks

- You can't have curly brace without quotes: \`{}\` -> `{}`
- Make sure to leave an empty newline between a table and following content

## A note about versioning

Expo's SDK is versioned so that apps made on old SDKs are still supported
when new SDKs are released. The website documents previous SDK versions too.

Version names correspond to directory names under `versions`.

`unversioned` is a special version for the next SDK release. It is not included in production output. Additionally, any versions greater than the package.json `version` number are not included in production output, so that it's possible to generate, test, and make changes to new SDK version docs during the release process.

`latest` is an untracked folder which duplicates the contents of the folder matching the version number in **package.json**.

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

## Deployment

The docs are deployed automatically via a GitHub Action each time a PR with docs changes is merged to `main`.

## How-tos

## Internal linking

If you need to link from one MDX file to another, please use the path-reference to this file including extension.
This allows us to automatically validate these links and see if the file and/or headers still exists.

- from: `tutorial/button.md`, to: `/workflow/guides/` -> `../workflow/guides.md`
- from: **index.md**, to: `/guides/errors/#tracking-js-errors` -> `./guides/errors.md#tracking-js-errors` (or without `./`)

You can validate all current links by running `yarn lint-links`.

### Updating latest version of docs

When we release a new SDK, we copy the `unversioned` directory, and rename it to the new version. Latest version of docs is read from **package.json** so make sure to update the `version` key there as well.

Make sure to also grab the upgrade instructions from the release notes blog post and put them in `upgrading-expo-sdk-walkthrough.md`.

That's all you need to do. The `versions` directory is listed on server start to find all available versions. The routes and navbar contents are automatically inferred from the directory structure within `versions`.

Because the navbar is automatically generated from the directory structure, the default ordering of the links under each section is alphabetical. However, for many sections, this is not ideal UX.
So, if you wish to override the alphabetical ordering, manipulate page titles in **constants/navigation.js**.

### Syncing app.json / app.config.js with the schema

To render the app.json / app.config.js properties table, we currently store a local copy of the appropriate version of the schema.

If the schema is updated, in order to sync and rewrite our local copy, run `yarn run schema-sync <SDK version integer>` or `yarn run schema-sync unversioned`.

### Importing from the React Native docs

You can import the React Native docs in an automated way into these docs.

1. Update the react-native-website submodule here
2. `yarn run import-react-native-docs`

This will write all the relevant RN doc stuff into the unversioned version directory.
You may need to tweak the script as the source docs change; the script hackily translates between the different forms of markdown that have different quirks.

The React Native docs are actually versioned but we currently read off of main.

### Adding Images and Assets

You can add images and assets to the `public/static` directory. They'll be served by the production and staging servers at `/static`.

#### Adding videos

- Record the video using QuickTime
- Install `ffmpeg` (`brew install ffmpeg`)
- Run `ffmpeg -i your-video-name.mov -vcodec h264 -acodec mp2 your-video-name.mp4` to convert to mp4.
- If the width of the video is larger than ~1200px, then run this to shrink it: `ffmpeg -i your-video.mp4 -filter:v scale="1280:trunc(ow/a/2)*2" your-video-smaller.mp4`
- Put the video in the appropriate location in `public/static/videos` and use it in your docs page MDX like this:

```js
import Video from '~/components/plugins/Video';

// Change the path to point to the relative path to your video from within the `static/videos` directory
<Video file="guides/color-schemes.mp4" />;
```

### Inline Snack examples

Snacks are a great way to add instantly-runnable examples to our docs. The `SnackInline` component can be imported to any markdown file, and used like this:

<!-- prettier-ignore -->
```jsx
import SnackInline from '~/components/plugins/SnackInline';

<SnackInline label='My Example Label' dependencies={['array of', 'packages', 'this Snack relies on']}>

// All your JavaScript code goes in here

// You can use:
/* @info Some text goes here */
  const myVariable = SomeCodeThatDoesStuff();
/* @end */
// to create hoverable-text, which reveals the text inside of `@info` onHover.

// You can use:
/* @hide Content that is still shown, like a preview. */
  Everything in here is hidden in the example Snack until
  you open it in snack.expo.dev
/* @end */
// to shorten the length of the Snack shown in our docs. Common example are hiding useless code in examples, like StyleSheets

</SnackInline>
```

### Embedding multiple options of code

Sometimes it's useful to show multiple ways of doing something, for instance maybe you'd like to have an example using a React class component, and also an example of a functional component.
The `Tabs` plugin is really useful for this, and this is how you'd use it in a markdown file:

<!-- prettier-ignore -->
```jsx
import { Tab, Tabs } from '~/components/plugins/Tabs';

<Tabs>
<Tab label="Add 1 One Way">

    addOne = async x => {
    /* @info This text will be shown onHover */
    return x + 1;
    /* @end */
    };

</Tab>
<Tab label="Add 1 Another Way">

    addOne = async x => {
    /* @info This text will be shown onHover */
    return x++;
    /* @end */
    };

</Tab>
</Tabs>
```

n.b. The components should not be indented or they will not be parsed correctly.

### Excluding pages from DocSearch

To ignore a page from the search result, use `hideFromSearch: true` on that page. This removes the `<meta name="docsearch:version">` tag from that page and filters it from our facet-based search.

Please note that `hideFromSearch` only prevents the page from showing up in the internal docs search (Algolia). The page will still show up in search engine results like Google.
For a page to be hidden even from search engine results, you need to edit the sitemap that is generated via our Next.js config (**next.config.js**).

### Excluding directories from the sidebar

Certain directories are excluded from the sidebar in order to prevent it from getting too long and unnavigable. You can find a list of these directories, and add new ones, in **constants/navigation.js** under `hiddenSections`.

If you just want to hide a single page from the sidebar, set `hideInSidebar: true` in the page metadata.

### Use `Terminal` component for shell commands snippets

Whenever shell commands are used or referred, use `Terminal` component to make the code snippets copy/pasteable. This component can be imported in any markdown file.

```jsx
import { Terminal } from '~/ui/components/Snippet';

// for single command and one prop
<Terminal cmd={["$ npx expo install package"]} />

// for multiple commands

<Terminal cmd={[
  "# Create a new native project",
  "$ npx create-expo-app --template bare-minimum",
  "",
  "# If you don’t have expo-cli yet, get it",
  "$ npm i -g expo-cli",
  "",
]} cmdCopy="npx create-expo-app --template bare-minimum && npm i -g expo-cli" />
```

### Prettier

Please commit any sizeable diffs that are the result of `prettier` separately to make reviews as easy as possible.

If you have a code block using `/* @info */` highlighting, use `{/* prettier-ignore */}` on the block and take care to preview the block in the browser to ensure that the indentation is correct - the highlighting annotation will sometimes swallow newlines.

## TODOs:

- Handle image sizing in imports better
- Make Snack embeds work; these are marked in some of the React Native docs but they are just imported as plain JS code blocks

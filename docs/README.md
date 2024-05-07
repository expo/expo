# Expo Documentation

This is the public documentation for **Expo**, its SDK, client, and services (**EAS**). This documentation is built using Next.js and you can access it online at https://docs.expo.dev/.

> **Note** **Contributors:** Please make sure that you edit the docs in the **pages/versions/unversioned** for SDK reference if you want your changes to apply to the next SDK version too!

> **Note**
> If you are looking for Expo Documentation Writing Style guidelines, please refer [Expo Documentation Style Guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

## To run locally in development mode

1. Download a copy of this repository.

```sh
git clone https://github.com/expo/expo.git
```

2. Then `cd` into the `docs` directory and install dependencies with:

```sh
yarn
```

3. Then you can run the app with (make sure you have no server running on port `3002`):

```sh
yarn run dev
```

4. Now the documentation is running at `http://localhost:3002`, and any changes you make to markdown or JavaScript files will automatically trigger reloads.

### To run locally in production mode

```sh
yarn run export
yarn run export-server
```

## Edit Docs Content

All documentation-related content is inside the **pages** directory. We write docs in markdown with the help of custom React components that provide additional functionality, such as embedding Snack examples, representing commands inside a terminal component and so on.

The documentation is divided into four main sections:

- **Home**: Provides a guided path from starting a project from scratch to deploying it to app stores.
- **Guides**: General purpose and fundamental guides that help you understand how Expo works and how to use it. This section also contains all EAS related documentation.
- **Reference**: Detailed reference documentation for all Expo APIs and modules. All Expo SDK API docs are located under **pages/versions** directory. We keep separate versions of documentation for each SDK version currently supported in Expo Go. See [A note about versioning](#a-note-about-versioning) for more information.
- **Learn**: Tutorials and guides that help you learn how to use Expo and React Native.

> **Note**
> We are currently in the process of moving our API documentation to being auto-generated using `expotools`'s `GenerateDocsAPIData` command for some Expo libraries.

### Metadata of a page

Each markdown page can be provided metadata in the heading, distinguished by:

```
---
metadata: goes here
---
```

These metadata items include:

- `title`: Title of the page shown as the heading and in search results.
- `description`: Description of the page shown in search results and open graph descriptions when the page is shared on social media sites.
- `hideFromSearch`: Whether to hide the page from Algolia search results. Defaults to `false`.
- `hideInSidebar`: Whether to hide this page from the sidebar. Defaults to `false`.
- `hideTOC`: Whether to hide the table of contents (appears on the right sidebar). Defaults to `false`.
- `sidebar_title`: The title of the page to display in the sidebar. Defaults to the page title.
- `maxHeadingDepth`: The max level of headings shown in Table of Content on the right side. Defaults to `3`.

### Edit Code

The docs are written with Next.js and TypeScript. If you need to make code changes, follow steps from the [Running locally](#running-locally) section, then open a separate terminal and run the TypeScript compiler in watch mode - it will watch your code changes and notify you about errors.

```sh
yarn watch
```

When you are done, you should run `prettier` to format your code. Also, don't forget to run tests and linter before committing your changes.

```sh
yarn prettier
yarn test
yarn lint
```

### Prose linter

We use [Vale](https://vale.sh/) to lint our docs for style and grammar based on [Expo's writing style guide](https://github.com/expo/expo/blob/main/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

There are two ways you can use it:

#### Use Vale in VS Code (Recommended)

- [Install Vale on your system](https://vale.sh/docs/vale-cli/installation/)
- [Install Vale's VS Code extension](https://marketplace.visualstudio.com/items?itemName=ChrisChinchilla.vale-vscode)

Open the doc file (`*.mdx`) that you are working on and you'll may see suggested lines (yellow squiggly) in VS Code editor.

#### Run the `lint-prose` script

In a terminal window, run the `yarn run lint-prose` script from **package.json**. This will run Vale for all markdown files in the **pages** directory.

## Redirects

### Server-side redirects

These redirects are limited in their expressiveness - you can map a path to another path, but no regular expressions are supported. See client-side redirects for more of that. Server-side redirects are re-created on each run of **deploy.sh**.

We currently do two client-side redirects, using meta tags with `http-equiv="refresh"`:

- `/` -> `/versions/latest/`
- `/versions` -> `/versions/latest`

This method is not great for accessibility and should be avoided where possible.

### Client-side redirects

Use these for more complex rules than one-to-one path-to-path redirect mapping. For example, we use client-side redirects to strip the `.html` extension off, and to identify if the request is for a version of the documentation that we no longer support.

You can add your own client-side redirect rules in `common/error-utilities.ts`.

## Search

We use Algolia as a main search results provider for our docs. Besides the query, results are also filtered based on the `version` tag which represents the user's current location. The tag is set in the `components/DocumentationPage.tsx` head.

In `ui/components/CommandMenu/utils.ts`, you can see the `facetFilters` set to `[['version:none', 'version:{version}']]`. Translated to English, this means - search on all pages where `version` is `none`, or the currently selected version. Here are the rules we use to set this tag:

- all unversioned pages use the version tag `none`,
- all versioned pages use the SDK version (for example, `v50.0.0` or `v49.0.0`),
- all pages with `hideFromSearch: true` frontmatter entry don't have the version tag.

Currently, the base results for Expo docs are combined with other results from multiple sources, such as:

- manually defined paths for Expo dashboard located in `ui/components/CommandMenu/expoEntries.ts`,
- public Algolia index for React Native website,
- React Native directory public API, see the directory [README.md](https://github.com/react-native-community/directory#i-dont-like-your-website-can-i-hit-an-api-instead-and-build-my-own-better-stuff) for more details.

## Quirks

You can't have curly brace without quotes: \`{}\` -> `{}`.

## Deployment

The docs are deployed automatically via a GitHub Action each time a PR with docs changes is merged to `main`.

## How-tos

### Internal linking

If you need to link from one MDX file to another, please use the static/full path to this file (avoid relative links):

- from: **tutorial/button.mdx**, to: **introduction/expo.mdx** -> `/introduction/expo`
- from: **index.mdx**, to: **guides/errors.mdx#tracking-js-errors** -> `/guides/errors/#tracking-javascript-errors`

Validate all current links by running `yarn lint-links` script.

### Update latest version of docs

When we release a new SDK, we copy the `unversioned` directory, and rename it to the new version. Latest version of docs is read from **package.json** so make sure to update the `version` key there as well.

Make sure to also grab the upgrade instructions from the release notes blog post and put them in **upgrading-expo-sdk-walkthrough.mdx**.

That's all you need to do. The `versions` directory is listed on server start to find all available versions. The routes and navbar contents are automatically inferred from the directory structure within `versions`.

Because the navbar is automatically generated from the directory structure, the default ordering of the links under each section is alphabetical. However, for many sections, this is not ideal UX.
So, if you wish to override the alphabetical ordering, manipulate page titles in **constants/navigation.js**.

### Update API reference docs

The API reference docs are generated from the TypeScript source code.

This section walks through the process of updating documentation for an Expo package. Throughout this document, we will assume we want to update TypeDoc definitions of property inside `expo-constants` as an example.

> For more information on how TypeDoc/JSDoc parses comments, see [**Doc comments in TypeDoc documentation**](https://typedoc.org/guides/doccomments/).

#### Prerequisites

Before proceeding, make sure you:

- have [**expo/**](https://github.com/expo/expo) repo cloned on your machine
  - make sure to [install `direnv`](https://direnv.net/docs/installation.html) and run `direnv allow` at the root of the **expo/** repo.
- have gone through the steps mentioned in [**"Download and Setup" in the contribution guideline**](https://github.com/expo/expo/blob/main/CONTRIBUTING.md#-download-and-setup).
- can run **expo/docs** app **[locally](https://github.com/expo/expo/tree/main/docs#running-locally)**.
- can run [`et` (Expotools)](https://github.com/expo/expo/blob/main/tools/README.md) command locally.

Once you have made sure the development setup is ready, proceed to the next section:

#### Step 1: Update the package’s TypeDoc

- After you have identified which package docs you want to update, open a terminal window and navigate to that package’s directory. For example:

```shell
# Navigate to expo-constants package directory inside expo/ repo
cd expo/packages/expo-constants
```

- Then, open **.ts** file in your code editor/IDE where you want to make changes/updates.
- Start the TypeScript build compilation in watch mode using `yarn build` in the terminal window.
- Make the update. For example, we want to update the TypeDoc description of [`expoConfig` property](https://docs.expo.dev/versions/latest/sdk/constants/#nativeconstants)

  - Inside the **src/** directory, open **Constants.types.ts** file.
  - Search for `expoConfig` property. It has a current description as shown below:

  ```ts
  /**
   * The standard Expo confg object defined in `app.json` and `app.config.js` files. For both
   * classic and modern manifests, whether they are embedded or remote.
   */
  expoConfig: ExpoConfig | null;
  ```

- In the above example, let’s fix the typo by changing `confg` to `config`:

```ts
/**
 * The standard app config object defined in `app.json` and `app.config.js` files. For both
 * classic and modern manifests, whether they are embedded or remote.
 */
expoConfig: ExpoConfig | null;
```

- Before moving to the next step, make sure to exit the "watch mode" by pressing `Ctrl + C` from the keyboard.

#### Step 2: Apply TypeDoc updates to expo/docs repo

In the terminal window and run the following command with to generate the JSON data file for the package (which is stored at the location `expo/docs/public/static/data/[SDK-VERSION]`)

- Read the **NOTE** in the below snippet for updating the docs for `unversioned`:

```shell
et generate-docs-api-data --packageName expo-constants --sdk 50

#### NOTE ####
# To update unversioned docs, run the command without mentioning the SDK version
et gdad -p expo-constants

# For more information about et command, run: et gdad --help
```

**Why update `unversioned` docs?** If these are new changes/updates, apply them to `unversioned` to make sure that those changes are part of the next SDK version.

#### Step 3: See the changes in the docs repo

Now, in the terminal window, navigate to **expo/docs** repo and run the command `yarn run dev` to see the changes applied

- Open [http://localhost:3002/](http://localhost:3002/) in the browser and go to the API doc to see the changes you have made. Make sure to select the right SDK version to see the changes in the left sidebar.

#### Tips

##### Disable changelog

After making changes, when you are opening the PR, consider adding `<!-- disable:changelog-checks -->` in the PR description if the changes you are making are docs-related changes (such as updating the field description or fixing a typo, and so on).

This will make sure that the ExpoBot on GitHub will not complain about updating the package’s changelog (some of these changes, as described above, are not worth mentioning in the changelog).

##### Use the correct package name

Some of the packages have documentation spread over multiple pages. For example, `expo-av` package has a separate base interface, and some of the information is separated into `Audio` and `Video` components. For such packages, always make sure to check the [name of the package](https://github.com/expo/expo/blob/main/tools/src/commands/GenerateDocsAPIData.ts#L24) for `et` command.

### Sync app.json/app.config.js with the schema

To render the app.json / app.config.js properties table, we currently store a local copy of the appropriate version of the schema.

If the schema is updated, to sync and rewrite our local copy, run `yarn run schema-sync <SDK version integer>` or `yarn run schema-sync unversioned`.

### Add images and assets

You can add images and assets to the **public/static** directory. They'll be served by the production and staging servers at **static**.

#### Add videos

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

### Add code block

Code blocks are a great way to add code snippets to our docs. We leverage the usual code block Markdown syntax, but it's expanded to support code block titles and additional params.

<!-- prettier-ignore -->
```mdx
    {/* For plain code block the syntax is unchanged (but we recommend to always add a title to the snippet): */}
    ```js
    // Your code goes in here
    ```

    {/* To add a title, enter it right after the language, in the code block starting line: */}
    ```js myFile.js
    // Your code goes in here
    ```
    ```js Title for a code block
    // Your code goes in here
    ```

    {/* Title and params can be separated by pipe ("|") characters, but they also work for block without a title: */}
    ```js myFile.js|collapseHeight=600
    // Your code goes in here
    ```
    ```js collapseHeight=200
    // Your code goes in here
    ```
```

#### Supported additional params

| Param            | Type   | Description                                                                                                                                                            |
| ---------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collapseHeight` | number | The custom height that the code block uses to collapse automatically. The default value is `408` and is applied unless the `collapseHeight` param has been specified. |

### Add inline Snack examples

Snacks are a great way to add instantly-runnable examples to our docs. The `SnackInline` component can be imported to any markdown file, and used like this:

<!-- prettier-ignore -->
```mdx
import SnackInline from '~/components/plugins/SnackInline';

<SnackInline label='My Example Label' dependencies={['array of', 'packages', 'this Snack relies on']}>
    ```js
    // All your code goes in here

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
    // to shorten the length of code block shown in our docs.
    // Hidden code will still be present when opening in Snack or using "Copy" action.
    ```
</SnackInline>
```

### Add multiple code variants

Sometimes it's useful to show multiple ways of doing something, for instance, maybe you'd like to have an example using a React class component, and also an example of a functional component.
The `Tabs` plugin is really useful for this, and this is how you'd use it in a markdown file:

<!-- prettier-ignore -->
```mdx
import { Tabs, Tab } from '~/ui/components/Tabs';

<Tabs>
<Tab label="Add 1 One Way">
    ```js
    addOne = async x => {
      /* @info This text will be shown onHover */
      return x + 1;
      /* @end */
    };
    ```
</Tab>
<Tab label="Add 1 Another Way">
    ```js
    addOne = async x => {
      /* @info This text will be shown onHover */
      return x++;
      /* @end */
    };
    ```
</Tab>
</Tabs>
```

**Note:** The components should not be indented or they will not be parsed correctly.

### Exclude pages from DocSearch

To ignore a page from the search result, use `hideFromSearch: true` on that page. This removes the `<meta name="docsearch:version">` tag from that page and filters it from our facet-based search.

Please note that `hideFromSearch` only prevents the page from showing up in the internal docs search (Algolia). The page will still show up in search engine results like Google.
For a page to be hidden even from search engine results, you need to edit the sitemap that is generated via our Next.js config (**next.config.js**).

### Exclude directories from the sidebar

Certain directories are excluded from the sidebar to prevent it from getting too long and unnavigable. You can find a list of these directories, and add new ones, in **constants/navigation.js** under `hiddenSections`.

If you just want to hide a single page from the sidebar, set `hideInSidebar: true` in the page metadata.

### Use `Terminal` component for shell commands snippets

Whenever shell commands are used or referred, use `Terminal` component to make the code snippets copy/pasteable. This component can be imported into any markdown file.

```mdx
import { Terminal } from '~/ui/components/Snippet';

{/* for single command and one prop: */}
<Terminal cmd={["$ npx expo install package"]} />

{/* for multiple commands: */}

<Terminal cmd={[
  "# Create a new Expo project",
  "$ npx create-expo-app --template bare-minimum",
  "",
]} cmdCopy="npx create-expo-app --template bare-minimum" />
```

### Use callouts

Four different types of callouts can be used with markdown syntax for `> ...` blockquote. Each callout represents a purpose.

```md
> Normal callout that doesn't demand much attention but is required to add as a note.

> **info** Callout that is informative and demands attention is required to add as a note or a tip.

> **warning** Callout that is used for warnings and deprecation messages.

> **error** Callout that is used for errors and breaking changes or deprecated changes in the archive.
```

### Prettier

Please commit any sizeable diffs that are the result of `prettier` separately to make reviews as easy as possible.

If you have a code block using `/* @info */` highlighting, use `{/* prettier-ignore */}` on the block and take care to preview the block in the browser to ensure that the indentation is correct - the highlighting annotation will sometimes swallow newlines.

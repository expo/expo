# Expo documentation

This is the public documentation for **Expo**, its SDK, client, and services (**EAS**). This documentation is built using Next.js and you can access it online at https://docs.expo.dev/.

> [!NOTE]
> For contributors: Please make sure that you edit the docs in the **pages/versions/unversioned** for SDK reference if you want your changes to apply to the next SDK version too!

> [!TIP]
> If you are looking for Expo Documentation Writing Style guidelines, please refer [Expo Documentation Style Guide](/guides/Expo%20Documentation%20Writing%20Style%20Guide.md).

## To run locally in development mode

1. Download a copy of this repository.

```sh
git clone https://github.com/expo/expo.git
```

2. Then `cd` into the `docs` directory and install dependencies with:

```sh
pnpm install
```

3. Then you can run the app with (make sure you have no server running on port `3002`):

```sh
pnpm dev
```

4. Now the documentation is running at `http://localhost:3002`, and any changes you make to markdown or JavaScript files will automatically trigger reloads.

### To run locally in production mode

```sh
pnpm export
pnpm export-server
```

## Edit Docs Content

All documentation-related content is inside the **pages** directory. We write docs in markdown with the help of custom React components that provide additional functionality, such as embedding Snack examples, representing commands inside a terminal component and so on.

The documentation is divided into the following main sections:

- **Home**: Provides a guided path from starting a project from scratch to deploying it to app stores.
- **Guides**: General purpose and fundamental guides that help you understand how Expo works and how to use it.
- **EAS**: Detailed documentation for all EAS services.
- **Reference**: Detailed reference documentation for all Expo APIs and modules. All Expo SDK API docs are located under **pages/versions** directory. We keep separate versions of documentation for each SDK version currently supported in Expo Go. See [Update latest version of API reference docs](#update-latest-version-of-api-reference-docs) for more information.
- **Learn**: Tutorials and guides that help you learn how to use Expo and React Native.

> [!NOTE]
> The API documentation of most Expo libraries is generated from the TypeScript source with the `et generate-docs-api-data` command. See [Update API reference docs](#update-api-reference-docs).

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
- `hidden`: Whether to hide the page from the sidebar. Defaults to `false`.
- `hideTOC`: Whether to hide the table of contents (appears on the right sidebar). Defaults to `false`.
- `sidebar_title`: The title of the page to display in the sidebar. Defaults to the page title.
- `sidebar_order`: A number that weights the page within its sidebar group. Defaults to `0`. A negative value sorts the page above the alphabetical run, a positive value below it.
- `inExpoGo`: Whether to list an SDK reference page under Third-party libraries instead of Expo SDK in the sidebar. Defaults to `false`.
- `maxHeadingDepth`: The max level of headings shown in Table of Content on the right side. Defaults to `3`.
- `isNew`: Whether to display the new badge for a page. Commonly used with API pages under Reference. Defaults to `false`.
- `isDeprecated`: Whether to display the deprecated badge for a page. Commonly used with API pages under Reference. Defaults to `false`.
- `isAlpha`: Whether to display the alpha badge for a page. Commonly used with API pages under Reference. Defaults to `false`.
- `isBeta`: Whether to display the beta badge for a page. Commonly used with API pages under Reference. Defaults to `false`.
- `isPreview`: Whether to display the preview badge for a page. Commonly used with API pages under Reference. Defaults to `false`.
- `searchRank`: A number between 0 and 100 that represents the relevance of a page. This value is mapped to Algolia's `record.weight.pageRank` property. Higher values indicate higher priority. We set this value to `5` by default, otherwise specified in the frontmatter.
- `searchPosition`: The position of a page in the search results. This value is mapped to Algolia's `record.weight.position` property. Algolia sets this value to `0` by default. Pages with lower values appear higher in the results. We set this value to `50` by default, otherwise specified in the frontmatter.
- `hasVideoLink`: To display a video link icon in the sidebar for the page that has a video tutorial link. Defaults to `false`.
- `cliVersion`: The CLI version to display for pages that include the CLI badge. Currently, this field is used for EAS CLI reference page and is populated automatically by `pnpm eas-cli-sync`.

### Edit Code

The docs are written with Next.js and TypeScript. If you need to make code changes, follow steps from the [To run locally in development mode](#to-run-locally-in-development-mode) section, then open a separate terminal and run the TypeScript compiler in watch mode &mdash; it will watch your code changes and notify you about errors.

```sh
pnpm watch
```

Don't forget to run tests and linter before committing your changes.

```sh
pnpm test
pnpm lint
```

### Prose linter

When you are done writing or editing docs, run the following script to lint your docs for style and grammar based on [Expo's writing style guide](/guides/Expo%20Documentation%20Writing%20Style%20Guide.md):

```sh
pnpm lint-prose
```

We use [Vale](https://vale.sh/) to lint our docs. The Vale binary is auto-installed during `pnpm install` via the `postinstall` script. To install or update it manually, run `pnpm install-vale`.

#### Switch off Prose linter

For exceptional cases, you can switch off the prose linter for a specific line or block of text by adding by using a [comment delimiter](https://vale.sh/docs/keys/commentdelimiters):

```mdx
{/* vale off */}

This is some text that will be ignored by Vale.

{/* vale on */}
```

> [!NOTE]
> Ideally, to add new services or features, the Vale lint rules should upgrade accordingly when there's a pattern. If you want to update a rule, see the [**.vale**](/docs/.vale/writing-styles/expo-docs) directory for already established rules.

<details>

<summary>Alternative: Use Vale with VS Code</summary>

Alternatively, you can use Vale with VS Code. You need to:

- [Install Vale on your system](https://vale.sh/docs/vale-cli/installation/)
- [Install Vale's VS Code extension](https://marketplace.visualstudio.com/items?itemName=ChrisChinchilla.vale-vscode)

Open the doc file (`*.mdx`) that you are working on and you'll may see suggested lines (yellow squiggly) in VS Code editor.

</details>

## Redirects

We use two layers of redirects:

- **Server-side redirects** defined in `public/_redirects` using the Cloudflare Pages redirect format (`source_path destination_path status_code`, one rule per line). These are 301 permanent redirects for simple 1:1 path mappings and SEO-friendly behavior.
- **Client-side redirects** in `common/client-redirects.ts` that run on the 404 page for more complex rules (for example, stripping `.html`, version fallbacks) and to catch cases where server-side redirects do not apply (local/dev/preview or missed mappings).

Some index pages also redirect on the client with a `http-equiv="refresh"` meta tag. These pages call `redirect()` from `common/redirect.tsx`. For example:

- `/versions` -> `/versions/latest/`
- `/tutorial` -> `/tutorial/overview/`

This works by loading a page and then immediately navigating, which can confuse assistive tech (announced content disappears, focus resets) and gives developers less control. Treat this as a fallback and prefer server-side redirects or the 404-based client rules when possible.

## Serving Markdown to AI Agents

Every published page is served in two formats: HTML for browsers, and markdown for AI agents and command-line tools. There are four layers to this:

### 1. Build-time generation

- `pnpm export` runs `scripts/generate-markdown-pages.ts` after `next build`. It walks every page in `out/`, converts the rendered HTML to markdown with cheerio + turndown (parallelized via worker threads), and writes the result next to the HTML at `out/<slug>/index.md`. Custom MDX components (`APISection`, `Terminal`, `Tabs`, and so on) are already rendered into HTML by Next.js, so the converter does not need to know about them.

- `scripts/check-markdown-pages.ts` then runs as a CI gate. It fails the build if any markdown file is empty, is missing headings, contains leaked HTML or CSS class names, has unbalanced code fences, or if the markdown count diverges from the HTML count.

### 2. Content negotiation

`public/_worker.js` inspects every request. If the `Accept` header includes `text/markdown`, the worker rewrites the path to `<pathname>/index.md` and returns that asset with `Content-Type: text/markdown; charset=utf-8`. The worker also handles a path that ends in `.md` as a markdown request. All other requests fall through to the normal asset pipeline.

```sh
curl -H "Accept: text/markdown" https://docs.expo.dev/get-started/set-up-your-environment/
```

### 3. Sibling `.md` URLs via `_redirects`

Some agents prefer to append `.md` to a URL rather than negotiate via headers. Three rules in `public/_redirects` handle that:

```
/index.md /index.md 200
/*/index.md /:splat/index.md 200
/*.md /:splat/index.md 200
```

The first two rules preserve the canonical `index.md` paths for each page. The third rule rewrites `/<slug>.md` to the file the build actually wrote at `/<slug>/index.md`. This allows agents to fetch markdown content with a `.md` suffix, which is a common convention for markdown files.

### 4. Discovery hint in HTML

Every page renders a discovery link in `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/get-started/set-up-your-environment.md" />
```

`getMarkdownPath` in `common/routes.ts` builds this href, and `DocumentationHead.tsx` renders it. Crawlers that already have the HTML can follow this to fetch the markdown variant.

### Summary

A single page (for example, `/get-started/set-up-your-environment/`) is reachable as markdown four ways:

| Request                                          | Served by                     |
| ------------------------------------------------ | ----------------------------- |
| `Accept: text/markdown` on the canonical URL     | `_worker.js`                  |
| `/get-started/set-up-your-environment.md`        | `_redirects` sibling rule     |
| `/get-started/set-up-your-environment/index.md`  | static asset (canonical path) |
| Following `<link rel="alternate">` from the HTML | discovery hint                |

## Search

We use Algolia as the main search results provider for our docs. This is set up in the `@expo/styleguide` library, which provides a universal search component that is used in the docs, expo.dev, and EAS dashboard.

Besides the query, the results are also filtered based on the `version` tag. This tag represents the user's current location. The tag is set in the `components/DocumentationPage.tsx` head.

Inside `@expo/styleguide` library, you can see the `facetFilters` set to `[['version:none', 'version:{version}']]` in `packages/search-ui/src/components/CommandMenu.tsx`. Translated to English, this means - search on all pages where `version` is `none`, or the currently selected version.

- All unversioned pages use the version tag `none`
- All versioned pages use the SDK version (for example, `v58.0.0` or `v57.0.0`)
- All pages with `hideFromSearch: true` frontmatter entry don't have the version tag

Currently, the base results for Expo docs are combined with other results from multiple sources, such as:

- Manually defined paths for EAS dashboard located in `ui/components/Search/expoEntries.ts`
- Public Algolia index for React Native website
- React Native directory public API, see the directory [README.md](https://github.com/react-native-community/directory#i-dont-like-your-website-can-i-hit-an-api-instead-and-build-my-own-better-stuff) for more details
- Expo Blog public API

## Quirks

You can't have curly brace without quotes: \`{}\` -> `{}`.

## Deployment

The docs are deployed automatically via a GitHub Action each time a PR with docs changes is merged to `main`.

## How-tos

### Internal linking

If you need to link from one MDX file to another, use the static/full path to this file (avoid relative links):

- From: **tutorial/add-navigation.mdx**, to: **get-started/create-a-project.mdx** -> `/get-started/create-a-project/`
- From: **guides/environment-variables.mdx**, to the "System requirements" heading in **get-started/create-a-project.mdx** -> `/get-started/create-a-project/#system-requirements`

Validate all current links by running the `pnpm check-internal-links` script after a build (it scans the exported site in **out**).

### Update latest version of API reference docs

Two scripts update the docs for a new SDK version. Each script has a GitHub workflow that runs it and opens a PR:

- `pnpm sdk-beta --sdk <major>` (**scripts/sdk-release/beta.ts**) cuts the beta docs. It regenerates the `unversioned` API data, generates the **pages/versions/vNN.0.0** reference docs, and sets `betaVersion` in **package.json**.
- `pnpm sdk-promote --sdk <major>` (**scripts/sdk-release/promote.ts**) makes the version the latest. It sets the `version` key in **package.json**, removes `betaVersion`, and updates the SDK version in **pages/workflow/upgrading-expo-sdk-walkthrough.mdx**.

The latest version of the docs is read from the `version` key in **package.json**.

Make sure to also grab the upgrade instructions from the release notes blog post and put them in **upgrading-expo-sdk-walkthrough.mdx**.

The `versions` directory is listed to find all available versions. The routes and navbar contents are automatically inferred from the directory structure within `versions`.

Since the navbar is automatically generated from the directory structure, the default ordering of the links under each section is alphabetical. To override the alphabetical ordering, set `sidebar_order` in the frontmatter of a page.

### Update API reference docs

The API reference docs are generated from the TypeScript source code.

This section walks through the process of updating documentation for an Expo package. Throughout this document, we will assume we want to update TypeDoc definitions of property inside `expo-constants` as an example.

> For more information on how TypeDoc/JSDoc parses comments, see [**Doc comments in TypeDoc documentation**](https://typedoc.org/documents/Doc_Comments.html).

#### Which data to update and when

The `et generate-docs-api-data` command (alias `et gdad`) reads the **src** directory of a package from the branch that you have checked out. It writes one JSON file for each package to **public/static/data**.

| Reference                          | Data directory                     | How the data updates                                                                                                                       |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Next SDK (`unversioned`)           | **public/static/data/unversioned** | The deploy workflow regenerates this data when it deploys from `main`. It does not commit the result. PR previews use the committed files. |
| Released SDK (for example, SDK 58) | **public/static/data/v58.0.0**     | No workflow regenerates this data. It changes only when a PR commits a new JSON file.                                                      |

Keep these rules in mind:

- If your PR changes the TSDoc comments or the public types of a package, run `et gdad` and commit the JSON file in the same PR. The docs team regenerates the data for all packages only during an SDK release.
- The docs site deploys only from the `main` branch. A JSON file that you commit only to an `sdk-NN` branch does not appear on the site.
- The `--sdk` option selects the output directory. It does not select the source. The source is always the branch that you have checked out.
- The same split applies to MDX pages. Edit **pages/versions/unversioned** for the next SDK and **pages/versions/vNN.0.0** for a released SDK.

#### Prerequisites

Before proceeding, make sure you:

- Have [**expo/**](https://github.com/expo/expo) repo cloned on your machine
- Make sure to [install `direnv`](https://direnv.net/docs/installation.html) and run `direnv allow` at the root of the **expo/** repo.
- Have gone through the steps mentioned in [**"Download and Setup" in the contribution guideline**](https://github.com/expo/expo/blob/main/CONTRIBUTING.md#-download-and-setup).
- Can run **expo/docs** app **[locally](https://github.com/expo/expo/tree/main/docs#to-run-locally-in-development-mode)**.
- Can run [`et` (Expotools)](https://github.com/expo/expo/blob/main/tools/README.md) command locally.

Once you have made sure the development setup is ready, proceed to the next section:

#### Step 1: Update the package's TypeDoc

- After you have identified which package docs you want to update, open a terminal window and navigate to that packages directory. For example:

```shell
# Navigate to expo-constants package directory inside expo/ repo
cd expo/packages/expo-constants
```

- Then, open **.ts** file in your code editor/IDE where you want to make changes/updates.
- Make the update. For example, to update the TypeDoc description of the [`expoConfig` property](https://docs.expo.dev/versions/latest/sdk/constants/#nativeconstants):
  - Inside the **src/** directory, open **Constants.types.ts** file.
  - Search for the `expoConfig` property.
  - Edit the TSDoc comment above the property. The API reference shows the text of this comment:

  ```ts
  /**
   * The description of the property.
   */
  expoConfig: ...
  ```

- You do not have to build the package. The `et generate-docs-api-data` command reads the **src** directory.

#### Step 2: Apply TypeDoc updates to expo/docs repo

In the terminal window, run the following command to generate the JSON data file for the package:

```shell
# Next SDK: writes docs/public/static/data/unversioned/expo-constants.json
et generate-docs-api-data --packageName expo-constants

# Released SDK: writes docs/public/static/data/v58.0.0/expo-constants.json
et gdad -p expo-constants --sdk 58

# For more information about et command, run: et gdad --help
```

If the change is new, update only `unversioned`. The change then ships with the next SDK version. To update the reference of a released SDK, see [Update the reference of a released SDK](#update-the-reference-of-a-released-sdk).

#### Step 3: See the changes in the docs repo

Now, in the terminal window, navigate to **expo/docs** repo and run the command `pnpm dev` to see the changes applied

- Open [http://localhost:3002/](http://localhost:3002/) in the browser and go to the API doc to see the changes you have made. Make sure to select the right SDK version to see the changes in the left sidebar.

#### Update the reference of a released SDK

Use these steps when a change is cherry-picked to an `sdk-NN` branch after the release, and the `vNN.0.0` reference must show it. The SDK team decides which changes to cherry-pick.

1. Make sure that the code change is on the `main` branch and on the `sdk-NN` branch.
2. Check out the `sdk-NN` branch and run `et gdad -p expo-library --sdk NN`. For example, run `et gdad -p expo-font --sdk 58` on the `sdk-58` branch.
3. Store the generated **docs/public/static/data/vNN.0.0/expo-library.json** file with `git stash`.
4. Create a branch from `main` and apply the stored file with `git stash pop`.
5. If the `unversioned` reference is also out of date, run `et gdad -p expo-library` on this branch.
6. Open the pull request against `main`, not against the `sdk-NN` branch.

#### Tips

##### Changesets

If your PR only updates TSDoc comments and the generated JSON data, it does not need a changeset. Changes that only affect documentation do not need one. See [Recording Package Changes](https://github.com/expo/expo/blob/main/CONTRIBUTING.md#-recording-package-changes).

##### Use the correct package name

Some of the packages have documentation spread over multiple pages. For example, `expo-sensors` package has a separate overview page in Expo Sensors reference, and rest of the information is separated into components such as, `Accelerometer`, `Gyroscope`, `Magnetometer`, and more. For such packages, always make sure to check the name of the package in [`PACKAGES_MAPPING`](https://github.com/expo/expo/blob/main/tools/src/commands/GenerateDocsAPIData.ts) for the `et` command.

### Sync app config with the schema

To render the [app config](https://docs.expo.dev/versions/latest/config/app/) properties table, we currently store a local copy of the appropriate version of the schema.

If the schema is updated, to sync and rewrite our local copy, run `pnpm schema-sync <SDK version integer>` or `pnpm schema-sync unversioned`.

### Add images and assets

You can add images and assets to the **public/static** directory. They'll be served by the production and staging servers at **static**.

### Add videos

- Record the video using QuickTime
- Install `ffmpeg` (`brew install ffmpeg`)
- Run `ffmpeg -i your-video-name.mov -vcodec h264 -acodec mp2 your-video-name.mp4` to convert to mp4.
- If the width of the video is larger than ~1200px, then run this to shrink it: `ffmpeg -i your-video.mp4 -filter:v scale="1280:trunc(ow/a/2)*2" your-video-smaller.mp4`
- Put the video in the appropriate location in `public/static/videos` and use it in your docs page MDX like this:

```tsx
import { ContentSpotlight } from '~/ui/components/ContentSpotlight';

// Change the path to point to the relative path to your video from within the `static/videos` directory
<ContentSpotlight file="guides/color-schemes.mp4" />;
```

### Add Expo UI component previews

For documenting `@expo/ui` components (Jetpack Compose and SwiftUI) with a fixed-size, theme-aware preview frame, use the `component` variant of `ContentSpotlight`. It renders a bordered dot-grid card and swaps between light and dark sources based on the active theme.

```tsx
import { ContentSpotlight } from '~/ui/components/ContentSpotlight';

<ContentSpotlight
  variant="component"
  aspect="landscape"
  src="/static/images/expo-ui/badgedbox/android-light.webp"
  darkSrc="/static/images/expo-ui/badgedbox/android-dark.webp"
  alt="Mail icon with a count badge of 5 and a wifi icon with a small dot badge"
/>;
```

| Param     | Description                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant` | Set to `"component"` to render the SDK UI preview chrome. Defaults to `"screenshot"`, which keeps the original lightbox-on-click behavior used elsewhere.  |
| `aspect`  | **Required** when `variant="component"`. Use `"landscape"` (3:2, 540px wide) for wide previews or `"portrait"` (9:16, 220px wide) for phone-shaped mocks.  |
| `src`     | **Required**. Path to the light-theme image. Place assets under `/public/static/images/expo-ui/<component>/` and reference them from `/static/images/...`. |
| `darkSrc` | Optional. Path to the dark-theme image. Rendered via `<picture>` and shown when the user has the dark theme active.                                        |
| `alt`     | **Required**. Alt text describing the component preview for screen readers.                                                                                |

To show the code of an example with its preview for each platform, use the `ComponentExample` component. Put the fenced code block of the example inside the component:

```mdx
import { ComponentExample } from '~/ui/components/ComponentExample';

<ComponentExample
  title="SwitchExample.tsx"
  android={{
    src: '/static/images/expo-ui/examples/universal-switch-basic-android-light.webp',
    darkSrc: '/static/images/expo-ui/examples/universal-switch-basic-android-dark.webp',
    alt: 'A switch in the off position',
  }}
  ios={{
    src: '/static/images/expo-ui/examples/universal-switch-basic-ios-light.webp',
    darkSrc: '/static/images/expo-ui/examples/universal-switch-basic-ios-dark.webp',
    alt: 'A switch in the off position',
  }}>

{/* Add the fenced code block of the example here */}

</ComponentExample>
```

### Add video links from Expo's YouTube channel

To reference a video from Expo's YouTube channel, use the `VideoBoxLink` component. This component is imported from `~/ui/components/VideoBoxLink`.

```tsx
import { VideoBoxLink } from '~/ui/components/VideoBoxLink';

<VideoBoxLink videoId="Gk7RHDWsLsQ" title="Required title" description="Required description" />;
```

| Param         | Description                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `videoId`     | **Required**. The ID of the video from YouTube. You can find this in the URL of the video. For example, in `https://www.youtube.com/watch?v=Gk7RHDWsLsQ`, the ID is `Gk7RHDWsLsQ`. |
| `title`       | **Required**. The title of the video.                                                                                                                                              |
| `description` | **Required**. The description of the video.                                                                                                                                        |
| `time`        | **Optional**. The start time in seconds. The link opens the video at this time.                                                                                                    |
| `uploadDate`  | **Optional**. The upload date of the video in `YYYY-MM-DD` format. Without it, the component looks up the date from the `videoId`.                                                 |

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

| Param            | Type   | Description                                                                                                                                                           |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `collapseHeight` | number | The custom height that the code block uses to collapse automatically. The default value is `408` and is applied unless the `collapseHeight` param has been specified. |

### Code block variables

Fenced code blocks support dynamic variable substitution using `{{variableName}}` syntax. Variables are replaced with values from the shared SDK compatibility registry at render time, before syntax highlighting runs. This keeps version numbers in code examples accurate without manual updates each SDK release.

**Available variables:**

| Variable                  | Example value | Description                   |
| ------------------------- | ------------- | ----------------------------- |
| `{{iosDeploymentTarget}}` | `16.4`        | Minimum iOS deployment target |
| `{{androidVersion}}`      | `7`           | Minimum Android version       |
| `{{compileSdkVersion}}`   | `37`          | Android compileSdkVersion     |
| `{{targetSdkVersion}}`    | `36`          | Android targetSdkVersion      |
| `{{buildToolsVersion}}`   | `37.0.0`      | Android buildToolsVersion     |
| `{{reactNativeVersion}}`  | `0.88`        | React Native version          |
| `{{reactVersion}}`        | `19.3.0`      | React version                 |
| `{{xcodeVersion}}`        | `26.4`        | Minimum Xcode version         |
| `{{nodeVersion}}`         | `22.13.x`     | Minimum Node.js version       |
| `{{expoSdkVersion}}`      | `58.0.0`      | Expo SDK version              |
| `{{expoSdkMajorVersion}}` | `58`          | Expo SDK major version number |

**Usage in a fenced code block:**

<!-- prettier-ignore -->
```mdx
    ```json package.json
    {
      "dependencies": {
        "expo": "~{{expoSdkVersion}}",
        "react-native": "{{reactNativeVersion}}"
      }
    }
    ```
```

The rendered output will show the resolved values (for example, `"expo": "~58.0.0"`). The copy button also copies the resolved values.

All variables are defined in `common/code-utilities.ts` and sourced from `sdkVersionValues` in `ui/components/SDKTables/utils.ts`, which reads `@expo/sdk-compatibility/data`. To add a new variable, add a new key to the object returned by `buildVariablesForSdk` in `common/code-utilities.ts`.

> [!NOTE]
> These variables only work inside fenced code blocks. For dynamic values in prose text, import `latestSdkVersionValues` from `~/ui/components/SDKTables` and use JSX expressions directly.

### Add inline Snack examples

Snacks are a great way to add instantly-runnable examples to our docs. The [`SnackInline`](/docs/ui/components/Snippet/blocks/SnackInline.tsx) component can be imported to any markdown file, and used like this:

<!-- prettier-ignore -->
```mdx
import { SnackInline } from '~/ui/components/Snippet';

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

Sometimes it's useful to show multiple ways of doing something, for instance, maybe you'd like to have an example using a React class component, and also an example of a functional component. The `Tabs` plugin is useful for this, and this is how you'd use it in a markdown file:

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

> [!NOTE]
> The components should not be indented or they will not be parsed correctly.

### Exclude pages from DocSearch

To ignore a page from the search result, use `hideFromSearch: true` on that page. This removes the `<meta name="docsearch:version">` tag from that page and filters it from our facet-based search.

Please note that `hideFromSearch` only prevents the page from showing up in the internal docs search (Algolia). The page will still show up in search engine results like Google. To hide a page from search engine results, you need to edit the sitemap that is generated via our Next.js config (**next.config.ts**), which calls **scripts/create-sitemap.js**.

### Exclude pages from the sidebar

The sidebar sections are defined in **constants/navigation.js**. A new page does not appear in the sidebar until you register it in that file.

If you just want to hide a single page from the sidebar, set `hidden: true` in the page metadata.

### Use `Terminal` component for shell commands snippets

Whenever shell commands are used or referred, use `Terminal` component to make the code snippets copy/pasteable. This component can be imported into any markdown file.

#### Supported props

| Option          | Type                              | Description                                                                                                                                                                    |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cmd`           | `string[]` or an object           | **Required**. Lines to render. Use `$` to mark commands, `#` for comments, and empty strings for spacing.                                                                      |
| `cmdCopy`       | `string`                          | **Optional**. Overrides the auto-generated copy text. Helpful when multiple commands should be chained (for example with `&&`) or when you want to control the copied content. |
| `title`         | `string`                          | **Optional**. Overrides the default header label of "Terminal".                                                                                                                |
| `browserAction` | `{ href: string; label: string }` | **Optional**. Adds a launch button in the header that opens the link in a new tab—ideal for flows that continue in a web UI.                                                   |
| `hideOverflow`  | `boolean`                         | **Optional**. Prevents horizontal scrollbars when you prefer the content to clip instead of scroll.                                                                            |
| `className`     | `string`                          | **Optional**. Additional utility classes for adjusting layout or spacing around the snippet.                                                                                   |

To show a command for each package manager, pass an object to `cmd` with `npm`, `yarn`, `pnpm`, and `bun` keys. Each key takes an array of lines.

```mdx
import { Terminal } from '~/ui/components/Snippet';

{/* For single command and one prop */}

<Terminal cmd={['$ npx expo install package']} />

{/* For multiple commands */}

<Terminal
  cmd={['# Create a new Expo project', '$ npx create-expo-app --template bare-minimum', '']}
  cmdCopy="npx create-expo-app --template bare-minimum"
/>

{/* Clamp long outputs and tweak spacing */}

<Terminal
  className="mt-6"
  hideOverflow
  cmd={[
    '$ npx expo config --json',
    '# Output is trimmed visually because hideOverflow is enabled.',
  ]}
/>

{/* Surface a button that opens related browser flows */}

<Terminal
  title="Deploy website with EAS"
  cmd={['$ npx eas-cli deploy']}
  browserAction={{ href: 'https://expo.dev/eas', label: 'Open in expo.dev' }}
/>
```

### Use `Prerequisites` for setup checklists

When a guide depends on the reader having a specific environment or prior step in place, wrap the requirements in a `Prerequisites` component. It renders as a collapsible block and threads each requirement's title through the page heading manager so it can be linked.

```mdx
import { Prerequisites, Requirement } from '~/ui/components/Prerequisites';

<Prerequisites>
  <Requirement title="Set up your development environment">
    Make sure your computer is [set up for running an Expo app](/get-started/create-a-project/).
  </Requirement>
  <Requirement title="Install EAS CLI">Run `npm install -g eas-cli` and log in.</Requirement>
</Prerequisites>
```

Pass `open` to render the block expanded by default:

```mdx
<Prerequisites open>...</Prerequisites>
```

### Use callouts

Five different types of callouts can be used with markdown syntax for `> ...` blockquote. Each callout represents a purpose.

```md
> Normal callout that doesn't demand much attention but is required to add as a note.

> **info** Callout that is informative and demands attention is required to add as a note or a tip.

> **warning** Callout that is used for warnings and deprecation messages.

> **error** Callout that is used for errors and breaking changes or deprecated changes in the archive.

> **important** Callout that is used for presenting important information about state of package, service or tool.
```

### Add last update date manually

All docs pages are automatically updated with the last update date of the file based on their Git commit history. This information is reflected in the footer of a docs page with **Last updated on ...**.

If you need to add the date manually, add `modificationDate` to the frontmatter of the **.mdx** file. For example:

```mdx
---
modificationDate: April 8th, 2024
{/* Other frontmatter fields */}
---
```

This pattern is used for some of the pages where we manually update the modification date, such as [Build server infrastructure](/docs/pages/build-reference/infrastructure.mdx). When updating build image details on that page, update its `modificationDate` in the same change.

> Docs areas that are excluded or do not include an updated date are SDK API references and Tutorials sections under Learn.

### Lint pipeline

The lint pipeline runs four tools via **scripts/lint.js** (`pnpm lint`) script:

- `oxfmt` for code formatting
- `oxlint` for code linting
- `tsc` for type checking
- `eslint` for Tailwind CSS classes, MDX linting, and ES Lint only rules

#### Formatting via oxfmt

If you have a code block using an inline annotation such as `/* @info Some text goes here */` or `/* @hide ... */`, make sure to add `/* prettier-ignore */` and `/* oxfmt-ignore */` comments right before the code block to prevent `oxfmt` from reformatting the code block and breaking the annotations.

### Use Step for procedural guides

For procedural guides, use [`Step`](/docs/ui/components/Step/Step.tsx) component:

```mdx
import { Step } from '~/ui/components/Step';

<Step label="1">

This is some text.

</Step>
```

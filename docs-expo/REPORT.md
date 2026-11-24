# Report: the documentation website on Expo Router

This report gives the results of the experiment in this directory. It has one section for each phase. Each statement comes from a build, a test run, or source code that was read during the work. A statement that is an inference says so.

## Summary

| Item                                              | Next.js 16.4.6 (`../docs`) | Expo SDK 58 (`docs-expo`)        |
| ------------------------------------------------- | -------------------------- | -------------------------------- |
| Build result                                      | Pass                       | Pass                             |
| HTML pages                                        | 2,038                      | 2,038                            |
| Build time, empty cache                           | 1 min 14 s (`next build`)  | 2 min 16 s (export and sitemap)  |
| Build time, warm cache                            | Not measured               | 1 min 32 s to 1 min 36 s         |
| First-load JavaScript, `/get-started/create-a-project/` | 2.41 MB (637 KB gzip), 12 files | 7.04 MB (1.76 MB gzip), 5 files |
| CSS on each page                                  | 179 KB, 1 file             | 199 KB, 6 files                  |
| All HTML files                                    | 752 MB                     | 801 MB                           |
| Page data files                                   | 48 MB                      | 100 MB                           |
| Changes to `../docs`                              | Not applicable             | None                             |

- **Phase 1 (build):** complete. `expo export --platform web` builds all pages.
- **Phase 2 (parity):** complete for layout and behavior. The static HTML is the same on 2,037 of 2,037 pages. After the page settles, the screenshots are the same on all pages that the tool can measure, but not on three pages that have a video. Performance is not at parity: the Expo build loads 2.9 times more JavaScript.

The versions are `expo` 58.0.26 and `expo-router` 58.0.32 from npm. The checks ran in Chromium (headless shell, build 1234) on macOS.

## How the port is built

`docs-expo` is an overlay. The website source stays in `../docs`, and the Next.js build continues to work. The hand-written build code in `docs-expo` is approximately 1,550 lines. The test tools in `parity` are approximately 500 lines. `README.md` lists each file.

| Next.js feature                              | Replacement in `docs-expo`                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `pages/**/*.mdx` as routes                   | `scripts/generate-routes.mjs` writes one route file for each page          |
| `@mdx-js/loader` in webpack                  | `metro/mdx-transformer.js`, with the remark plugins of `../docs`           |
| `getStaticProps`                             | A route `loader` and `useLoaderData`                                       |
| `pages/_app.tsx`, `_document.tsx`, `_error.tsx` | `src/app/_layout.tsx`, `+html.tsx`, `+not-found.tsx`                    |
| `next/router`, `next/link`, `next/head`, `next/dynamic` | `src/next-compat`, resolved in `metro.config.js`                |
| `next/font/google`                           | Fontsource files, `src/fonts.tsx`                                          |
| `trailingSlash: true`                        | Route files named `<route>/index.tsx`, URL rules in `src/next-compat/url.ts` |
| `exportPathMap` sitemap code                 | `scripts/post-export.mjs`                                                  |
| `reactRemoveProperties`, `removeConsole`     | Two Babel plugins in `babel.config.js`                                     |

## Phase 1: convert the build

### Result

The full export passes: 2,037 static routes, 1,272 loaders, and 2,072 JavaScript bundles.

### What worked well

- **Metro bundled the site with few source changes.** Only two files in `../docs` need a patch at bundle time (`metro/source-patches.js`).
- **A custom Metro transformer for MDX was small.** It is approximately 130 lines and uses the same remark plugins as the Next.js build.
- **Tailwind CSS 4 worked through PostCSS.** The `global.css` file of `../docs` and its `@config` line needed no change.
- **Global CSS imports from `node_modules` worked.**
- **Async routes are on by default for web.** Each page has its own JavaScript file.
- **Data loaders replaced `getStaticProps`.** The static export writes the loader data into the HTML and into one file for each route. This removed 7.4 MB of API data from the shared JavaScript.
- **The streaming static renderer and React 19 work together for head tags.** A `<title>`, `<meta>`, or `<link>` element in a component goes to the document head. No route-level metadata code was necessary.
- **`+html.tsx` gets a `pathname` property.** The port uses it for the `lang` attribute.
- **Static export speed is acceptable.** The export of 2,037 pages takes approximately two times as long as the Next.js build.
- **A `metro.config.js` resolver was sufficient** to keep the source in a different directory and to replace `next/*` modules, also for `@expo/styleguide`, which calls `require('next/link')`.

### What did not work well

Each item gives the observed problem and the workaround.

1. **An MDX file cannot be a route.** Expo Router finds route files with a pattern for `.js`, `.jsx`, `.ts`, and `.tsx` only. Workaround: 2,036 generated route files.
2. **A route group exports each page two times.** With the routes in `src/app/(docs)`, the export wrote `/page` and `/(docs)/page`. Workaround: no group.
3. **There is no `trailingSlash` option.** The export writes `page.html`, and the browser URL loses its slash after a client navigation. Workaround: `page/index.tsx` route files, and a patch on `history.pushState` and `history.replaceState`.
4. **`expo-router/head` tags are not in the static HTML in SDK 58.** The documentation states this. `generateMetadata()` is the replacement, but it is a route export. The website sets head tags in components at different levels (`DocumentationHead`, `StructuredData`, `HreflangAlternates`, and redirect pages). Workaround: a `next/head` replacement that renders the tags directly.
5. **An inline `<script>` in a component cannot go to the head.** React does not move a JSON-LD script. In its position it changed a CSS sibling selector result. Workaround: a context collects these elements, and `+html.tsx` renders them after the app.
6. **A custom `+html.tsx` in the old form gives a broken page with no error.** In SDK 58 the file must render `headNodes` and `bodyNodes` from `useServerDocumentContext()`. Without them, the export passed, and the HTML had no CSS and no scripts.
7. **Metro has no top-level `await`.** The error was a minifier error: `Unexpected token: name (initPrismAsync)`. It did not name the cause.
8. **A `require` call with a template string is only a warning.** Webpack makes a context module. Metro prints a warning during the build. Workaround: `require.context`.
9. **Render errors in the export are hard to read.** The first render error was `Element type is invalid ... got: object`, with a minified stack and no component name. `--no-minify` was necessary to find it.
10. **Metro puts all shared modules in one `__common` file.** That file is 5.5 MB and each page loads it. It contains modules that only lazy imports use, for example `hls.js` (598 KB) and the Kapa SDK (348 KB). Before the loader change, it also contained all API data and was 13 MB.
11. **All CSS is global.** The CSS of `@xyflow/react` and of the lightbox is on each page. Next.js loads those two files with their components.
12. **CSS cannot refer to a local file with `url()`.** Metro prints "Importing local resources in CSS is not supported yet". This prevents a normal `@font-face` rule with a bundled font file.
13. **`expo-font` cannot set a `unicode-range`.** It also has no fallback font metrics. `next/font` gives both. Workaround: `src/fonts.tsx` writes the `@font-face` rules, and `src/compat.css` has the fallback faces.
14. **The `public` directory cannot be a symbolic link to a path outside the project.** Expo CLI stops with an error. Links inside `public` are accepted, but the export copies them as links. Workaround: `post-export.mjs` replaces them with the files.
15. **The export writes `+not-found.html`, not `404.html`,** and it writes a `/_sitemap` page unless `sitemap: false` is set.
16. **Each loader is one Metro bundle.** The build log has 1,272 `λ Bundled` lines for loaders, and Node.js prints `MaxListenersExceededWarning: 1001 change listeners added to [FileMap]`.
17. **Loader data files are formatted JSON.** The file for the camera page is 269 KB. The Next.js data file for the same page is 113 KB.
18. **The development server stops with an out-of-memory error** at the default 4 GB Node.js heap, after the first page. It works with a 12 GB heap. The first page took 12.8 s.
19. **`expo export --dev` did not give a usable static site.** The page stopped with `Requiring unknown module "3142"`.
20. **A web-only site must install `react-native`, `react-native-web`, `react-native-screens`, and `react-native-safe-area-context`.**
21. **The transformer cache does not know about related files.** The MDX transformer needed its own `getCacheKey`. The Tailwind CSS output depends on the class names in other files, so a CSS change needed `--clear`.

### Improvements for Expo Router and Expo CLI from phase 1

- Let a project add route file extensions, with a transformer, so that an MDX file can be a route.
- Add a `trailingSlash` option that controls the export path, the browser URL, and `Link`.
- Make `expo-router/head` render its tags in the static HTML again, or give a component-level API for head tags and for non-hoistable elements such as JSON-LD.
- Make the export fail, or print a warning, when a custom `+html.tsx` does not render `headNodes` and `bodyNodes`.
- Split shared modules into more than one file, and keep a module that only lazy imports use out of the files that each page loads.
- Split CSS by route or by lazy import.
- Support `url()` for local files in CSS.
- Give render errors in `expo export` a source-mapped stack and the route file name.
- Give a clear error for top-level `await`.
- Write `404.html`, minify loader data, and bundle loaders in groups.
- Lower the memory use of the development server for a site with many routes.

## Phase 2: pixel parity

### Result

| Check                                                              | Result                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| Static HTML, element tree in the page root, all pages              | 2,037 of 2,037 the same                              |
| Static HTML, head tags, all pages                                  | 2,037 of 2,037 the same                              |
| Tailwind CSS class names in the CSS output                         | The same set                                         |
| Screenshots, 1440 x 2000, light, all pages                         | 2,012 the same, 1 different, 24 not measured         |
| Screenshots, 390 x 2400, light, all pages                          | 2,010 the same, 2 different, 25 not measured         |
| Screenshots, 1440 x 1200, dark, all pages                          | 2,010 the same, 2 different, 25 not measured         |
| Interaction test, 13 steps                                         | 13 of 13 the same, 0 different pixels                |
| First result, before corrections, 31 pages                         | 1 of 31 the same                                     |

The screenshot runs wait 3.5 s after the load event and use the default `pixelmatch` threshold of 0.1. Each page that is different has a video: `/build/orbit/`, `/develop/user-interface/color-themes/`, and `/router/web/async-routes/`. A video page is also different between two loads of the same build.

The 25 pages that the tool did not measure are redirect pages. They go to a different page while the tool waits. The interaction test includes one of them.

The interaction test does these steps in each build: load a page, go to a different page from the sidebar, go to a different section, go back, load a URL with a hash, select a table of contents entry, open the search dialog, load a redirect page, load a URL with a query, select a form option, go back, load a page that sets its query, and load a page that has a heading with `id="expo"`. For each step it compares the URL, the title, the canonical link, the scroll positions, and a screenshot.

### Differences that remain

- **Load performance.** The Expo build loads 7.04 MB of JavaScript on a page, and Next.js loads 2.41 MB. One visible effect: the sidebar smooth-scroll to the active entry starts later. At 1.2 s after load, 21 pages were different under parallel test load. At 3.5 s they were the same.
- **Link prefetch.** After the load of one page, Next.js made 57 requests for the route files and data of linked pages. The Expo build made none, and `router.prefetch()` on hover made no request. The route file loads when the user selects the link.
- **JSON-LD scripts** are at the end of `<body>` in the static HTML. In Next.js they are in `<head>`. After hydration they are in `<head>` in the two builds (checked on `/mcp/`).
- **Vendor prefixes.** The Next.js CSS has `-webkit-backdrop-filter` in transition lists. The Expo CSS does not. No rendering difference was found in Chromium. Other browsers were not tested.
- **Font files.** The Fontsource files and the `next/font` files are different files (48,256 bytes and 48,432 bytes for Inter Latin). The screenshots are the same.
- **Exact comparison noise.** With a threshold of zero, a video page shows a different frame in each run, in the two builds. The Expo build also showed 4 to 12 pixels with a color difference of 1 in 255 on two pages, between two loads of the same build.

### Causes of the differences, in the order of their discovery

| Cause                                                                                                   | Correction                                                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| The React Native Web root `View` sets `list-style: none`, which page content inherits. It is also a flex container. | `src/compat.css`: `display: contents` and a `list-style` reset |
| The CSS import order was not the order in the Next.js CSS file.                                         | Import order in `_layout.tsx`                                 |
| A new lockfile gave 186 packages a different version. `tailwind-merge` then gave different class names. | The lockfile starts as a copy of `../docs/pnpm-lock.yaml`     |
| A JSON-LD script between two elements changed a `+` selector result.                                    | The head replacement moves such elements                      |
| The table of contents had duplicate entries after hydration (325 links, not 212).                       | The router replacement renders the page from the top on a router change |
| `next/link` changes an `href`: it adds a trailing slash, resolves `..`, and resolves a relative URL from the page path. | `src/next-compat/url.ts`                          |
| Next.js removes `data-test*` properties and adds default `charset` and `viewport` tags.                 | Babel plugin, and a route helper                              |
| The remark plugins resolve links from the virtual file `cwd`.                                           | The transformer sets `cwd` to `../docs`                       |
| A URL with a hash gave two active table of contents entries.                                            | No second render after hydration                              |
| A URL with a query gave React error 418 and two `<title>` elements.                                     | The router state changes in a route effect, not a layout effect |
| `router.push({ query })` went to the home page.                                                         | Same-page navigation with the History API                     |
| Six pages stopped with `Class extends value undefined`.                                                 | `<script>var expo;</script>` in `+html.tsx`                   |
| A Greek letter used a fallback font.                                                                    | Font faces with `unicode-range` for all subsets               |
| Tailwind CSS 4 finds class names from the current directory. Some classes were not in the CSS.          | `base` option in `postcss.config.mjs`                         |

### What worked well

- **Parity was possible with no change to the website source.** All corrections are in `docs-expo`.
- **The static HTML of the two renderers is the same.** After the corrections, the only differences are React-generated IDs and attribute order.
- **Client navigation, back, and hash links work** with `router.push` and `router.replace`.
- **A comparison of static HTML found problems that screenshots did not find,** for example wrong link URLs. It runs on all pages in 54 s.

### What did not work well

1. **`expo-modules-core` stops on a page that has an element with `id="expo"`.** The browser makes that element available as `window.expo`. `installExpoGlobalPolyfill()` returns when `globalThis.expo` has a value, so `NativeModule` is `undefined` and `expo-font` stops with `Class extends value undefined`. The same check is in `packages/expo-modules-core/src/polyfill/dangerous-internal.ts` on `main`. This is a defect for each static-rendered site, not only for this port.
2. **Hydration is not one step.** The static HTML has Suspense boundaries around the root layout and the route. When the router replacement changed its state in a layout effect, the route hydrated with different data and React reported error 418. With the change in a route effect, there is no error. The inference is that the layout effects run before the route hydrates. Next.js Pages Router has no such boundaries, and the website code depends on that.
3. **Expo Router has no route change events.** NProgress, analytics, and the sidebar scroll position use `routeChangeStart` and `routeChangeComplete`.
4. **The Expo Router `Link` does not render a plain anchor.** It renders a React Native `Text` component, or it passes `onPress` to a child. The port uses its own anchor component.
5. **The root `View` changes page CSS.** It adds a flex container, a stacking context, and an inherited `list-style`.
6. **The app root element is `#root`.** The website and `@expo/styleguide-search-ui` CSS use `#__next`.
7. **Next.js behavior that is not in its documentation was necessary for parity:** the `href` rules of `Link`, the `isReady` and `query` values during hydration, and the use of `replaceState` when the new URL is the current URL.
8. **Dependency versions must be the same** for a comparison. This is not an Expo problem, but each migration will have it.

### Improvements for Expo Router from phase 2

- Correct the `globalThis.expo` check in `expo-modules-core` for web, so that a DOM element with that `id` is not accepted.
- Give a web `Link` that renders a plain `<a>` element with no React Native Web styles.
- Make `router.prefetch()` and `Link` load the route file and the loader data on web.
- Add route change events, or a hook for navigation state (pending, complete).
- Document the hydration order of the root layout and the route, and how to update an external store safely. Consider an option to hydrate the page in one step for static output.
- Let `+html.tsx` control the root element (its `id`, and no wrapper `View`).
- Supply a compatibility package for `next/router`, `next/link`, `next/head`, and `next/dynamic`. The one in this directory is 480 lines and was sufficient for this site.
- Supply a font API for web that has `unicode-range`, subsets, and fallback metrics.

## Granular chunking

The results in the other sections use the default chunking mode, `legacy`. A later run used `experiments.chunking.mode: "granular"` in `app.json`. That setting is now in `app.json`.

### Result

| Item, for `/get-started/create-a-project/`       | Next.js          | Expo, `legacy`   | Expo, `granular`  |
| ------------------------------------------------ | ---------------- | ---------------- | ----------------- |
| Script files on the page                         | 12               | 5                | 88                |
| First-load JavaScript, not compressed            | 2.41 MB          | 7.04 MB          | 11.98 MB          |
| First-load JavaScript, gzip                      | 637 KB           | 1,765 KB         | 1,251 KB          |
| The same, without the `entry` file               | Not applicable   | Not measured     | 3.01 MB (759 KB gzip) |
| `entry` file                                     | Not applicable   | 1.49 MB          | 8.97 MB (491 KB gzip) |
| HTML file                                        | 160 KB           | 181 KB           | 201 KB            |
| `hls.js` on the page                             | No               | Yes              | No                |
| `@xyflow/react` on the page                      | No               | Yes              | No                |
| Kapa SDK on the page                             | No               | Yes              | Yes               |
| All JavaScript files                             | 42 MB            | 35 MB            | 43 MB             |
| Build time, warm cache                           | Not measured     | 1 min 32 s to 1 min 36 s | 1 min 48 s |

Parity is the same as with `legacy`:

- Static HTML: 2,037 of 2,037 pages the same, for the element tree and for the head tags.
- Interaction test: 13 of 13 steps the same.
- Screenshots, 1440 x 2000, all pages: 2,011 the same, 3 different, 23 not measured. The three pages that are different each have a video.

### What worked well

- **The one `__common` file is gone.** There are 166 `__shared` files. A page loads only the files that its route needs.
- **Modules that only some routes use are no longer on each page.** `hls.js` and `@xyflow/react` are examples.
- **The compressed download is 29% smaller** than with `legacy`.
- **No change was necessary for parity.** The build passed all the checks on the first run.

### What did not work well

- **The `entry` file is 8.97 MB.** The module that lists the routes holds, for each of the 2,038 routes, the URL of each file that the route needs. That is 2,038 lists with a mean of 44 URLs, 7.61 MB of text, made from 2,198 different URLs. The file compresses to 491 KB, but the browser must parse all of it on each page.
- **A page loads 88 script files, and 66 of them are smaller than 10 KB.** The median size of a `__shared` file is 2.4 KB. The script and preload tags add 20 KB to each HTML file.
- **The Kapa SDK is still on each page.** Next.js does not load it on this page.
- **Time to hydration did not get better in a local test.** On `/versions/latest/sdk/video/`, the first sidebar scroll was at 397 ms and 413 ms (Next.js), 479 ms and 527 ms (`legacy`), and 511 ms and 543 ms (`granular`). Each value is the median of seven loads. The test has no network delay, so it shows parse and run time only. It does not show the effect of the smaller download.
- **The JavaScript is still two times the Next.js size** after compression.

### Improvements for granular chunking

- Store each file URL one time in the route list, and refer to it by index. A table of 2,198 URLs and lists of numbers would replace 7.61 MB of repeated text.
- Set a minimum size for a `__shared` file, and merge the files that are smaller.
- Keep a module that only a lazy import uses out of the files that a route loads at the start.

## Priority list

The order is by effect on a migration of a large site.

1. JavaScript chunk splitting and CSS splitting. Granular chunking removes `__common`, but its route list makes the `entry` file 8.97 MB on this site.
2. `expo-router/head` in static HTML, and a path for JSON-LD.
3. `trailingSlash`.
4. Routes from MDX files (or other extensions).
5. The `globalThis.expo` defect.
6. A plain-anchor `Link`, link prefetch, and route change events.
7. A failure or warning for an old `+html.tsx`.
8. Error messages: top-level `await`, render errors in the export.
9. Development server memory.
10. Web fonts.

## Work that was not done

- The scripts that run after `next build` (`generate-markdown-pages`, `check-markdown-pages`, `generate-docs-bundle`, `generate-llms`, `generate-agent-skills-index`) were not run on the Expo output.
- The Jest tests, lint, Vale, and the Cloudflare worker tests of `../docs` were not run for `docs-expo`.
- Sentry source map upload was not set up.
- Tree shaking (`EXPO_UNSTABLE_TREE_SHAKING`) was not tested.
- The mobile-width and dark screenshot runs were not done again for granular chunking.
- Only Chromium was tested. Firefox and Safari were not tested.
- Hot reload in the development server was not tested. Three pages were loaded in the development server with a 12 GB heap.
- No deployment was done.

## How to do the checks again

Build the two sites, then serve each output directory:

```sh
(cd ../docs && pnpm exec next build --webpack)
pnpm export
node parity/serve.mjs ../docs/out 8101 &
node parity/serve.mjs dist 8102 &
```

Then run the checks. Playwright must have a Chromium browser, or `CHROMIUM_PATH` must give the path of one.

```sh
# Static HTML of all pages.
node parity/html-diff.mjs ../docs/out dist

# Screenshots of the paths in a text file, one path on each line.
node parity/screenshots.mjs /tmp/screenshots paths.txt --viewport 1440x2000 --settle 3500

# The 13 interaction steps.
node parity/interactions.mjs /tmp/interactions
```

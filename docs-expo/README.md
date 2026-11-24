# Expo documentation on Expo Router

This directory is an experiment. It builds the documentation website in `../docs` with Expo for web and Expo Router. The Next.js build in `../docs` stays unchanged.

## How it works

The website source stays in `../docs`. This directory holds only the files that the Expo build adds:

| Path                          | Purpose                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `metro.config.js`             | Resolves `~/` to `../docs`, replaces `next/*` modules, and enables the `.mdx` type.       |
| `metro/mdx-transformer.js`    | Compiles MDX with the remark plugins from `../docs/mdx-plugins`.                          |
| `metro/source-patches.js`     | Changes source that Metro cannot bundle. Each patch states its reason.                    |
| `babel.config.js`             | Removes `data-test*` properties and `console` calls, as the Next.js compiler options do.  |
| `src/next-compat`             | Replacements for `next/router`, `next/link`, `next/head`, and `next/dynamic`.             |
| `src/routes.tsx`              | Makes route components from pages. The generated route files call it.                     |
| `src/fonts.tsx`               | The web font rules, made from the font files that `scripts/generate-fonts.mjs` lists.     |
| `src/compat.css`              | The CSS that Next.js adds through `next/font` and styled-jsx, and layout corrections.     |
| `src/app/_layout.tsx`         | The Expo Router version of `../docs/pages/_app.tsx`.                                      |
| `src/app/+html.tsx`           | The Expo Router version of `../docs/pages/_document.tsx`.                                 |
| `src/app/+not-found.tsx`      | The Expo Router version of `../docs/pages/_error.tsx`.                                    |
| `scripts/generate-routes.mjs` | Writes one route file in `src/app` for each page in `../docs/pages`.                      |
| `scripts/post-export.mjs`     | Adds `404.html`, `sitemap.xml`, and `_url-recovery.json` to the export.                   |
| `public`                      | Symbolic links to the entries of `../docs/public`.                                        |
| `pnpm-lock.yaml`              | Started as a copy of `../docs/pnpm-lock.yaml`, so that shared packages have one version.  |
| `parity`                      | Tools that compare the output with the Next.js output. `REPORT.md` shows how to use them. |

## Build

Install `../docs` first. Its `postinstall` script writes `public/static/constants` and `pages/versions/latest`, and the MDX plugins load their packages from `../docs/node_modules`.

```sh
cd ../docs && pnpm install
cd ../docs-expo && pnpm install
pnpm export
```

The output is in `dist`. `app.json` sets `experiments.chunking.mode` to `granular`. `REPORT.md` compares it with the default mode. To build only some pages, give route prefixes to the generator:

```sh
node scripts/generate-routes.mjs --only / --only /get-started/
node scripts/generate-fonts.mjs
pnpm exec expo export --platform web --output-dir dist
node scripts/post-export.mjs
```

## Develop

```sh
pnpm dev
```

The script sets a 12 GB Node.js heap. With the default heap, the development server stops with an out-of-memory error after the first page.

See [REPORT.md](./REPORT.md) for the results of the experiment.

## Limits

- The scripts that run after `next build` in `../docs/package.json` (`generate-markdown-pages`, `check-markdown-pages`, `generate-docs-bundle`, `generate-llms`, and `generate-agent-skills-index`) read the `out` directory. They do not run on `dist`.
- The Jest tests, the lint configuration, and the Sentry source map upload of `../docs` have no equivalent here.

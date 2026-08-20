# Agent instructions for docs

These instructions apply to changes inside `docs/`.

## Check what CI checks before pushing

The `docs-pr` workflow (`.github/workflows/docs-pr.yml`) runs these from the `docs/` directory. Run them locally on every docs change:

```sh
pnpm test                     # docs unit tests
pnpm test:worker              # Cloudflare worker and route tests
NODE_ENV=production pnpm lint --max-warnings 0
pnpm lint-prose               # Vale prose lint (same rules as CI)
```

All four must pass. CI fails the PR on any Vale error in added lines.

## Vale prose rules to know

- Config: `docs/.vale.ini`; rules: `docs/.vale/writing-styles/expo-docs/`.
- Headings must be sentence case (`HeadingCase.yml`). Product and proper nouns are allowed only if listed in that file's exceptions. When a heading names a new product (for example "Grok Build"), add a `- '.*Product Name.*'` entry to the alphabetized exception list in `HeadingCase.yml` in the same PR.

## Other conventions

- New pages must be registered in `docs/constants/navigation.js` or they will not appear in the sidebar.
- There is no Prettier config in this repo. Do not run `npx prettier` on docs files — it rewrites quote style across whole files. Match the existing formatting of the file you are editing (single quotes in JS and MDX imports).
- Follow the structure of an existing sibling page when adding a page (for example, a new page in `pages/agents/` should mirror `pages/agents/codex.mdx`).

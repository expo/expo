# Updating Changelogs

Package changelogs are generated from [Changesets](https://github.com/changesets/changesets). Add a changeset instead of editing a package's `CHANGELOG.md`.

Run `pnpm changeset`, select every affected public package, and choose the semantic change:

- `patch` for compatible fixes and maintenance;
- `minor` for backwards-compatible features;
- `major` for breaking changes. Do not use `major` on an `sdk-*` release branch.

The generated Markdown file has YAML frontmatter followed by the user-facing summary:

```md
---
"expo-asset": patch
---

Fix asset URLs when the development server uses a custom origin.
```

Write the summary for package users without assuming they have read the pull request. Prefix internal work with `[Internal]`. Multiple paragraphs and fenced code blocks are supported.

## Reference overrides

The changelog normally links to the pull request automatically. To link somewhere else, add a standalone `See:` line:

```md
Support the new configuration option.

See: [migration guide](https://docs.expo.dev/example)
```

Use an HTTPS URL, an HTTPS Markdown link, or a GitHub reference such as `#123`.

The first valid standalone `See:` line replaces the automatically added pull request or commit
link. The author is still added automatically. Invalid or additional `See:` lines are ignored.
`See:` text in a paragraph or code block is left unchanged.

## Check the changeset

Run `pnpm changeset status` to check the package names and version bumps. Documentation, tests, apps, CI, and private tooling do not need a changeset.

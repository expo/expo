# Changesets

Changesets record the user-visible effect of a pull request on published Expo packages. Add one with:

```sh
pnpm changeset
```

Select every affected public package and choose its semantic bump:

- `patch` for bug fixes and backwards-compatible maintenance;
- `minor` for backwards-compatible features;
- `major` for breaking changes. Do not use `major` on an `sdk-*` release branch.

Write the summary for package users. Multiple paragraphs and fenced code blocks are supported. Prefix internal work with `[Internal]`.

If a PR was merged without a changeset, a `See:` line can be added in a follow-up PR to override the automatically generated pull request link, to reference the original PR:

```md
Fix asset URLs when the development server uses a custom origin.

See: [#123](https://github.com/expo/expo/pull/123)
```

Documentation, tests, apps, CI, and private tooling do not need a changeset. Do not add entries directly to package `CHANGELOG.md` files.

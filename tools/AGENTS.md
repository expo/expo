# Agent instructions — expotools (`et`)

Internal CLI for the Expo repository. Source in `src/`, compiled to `build/`
by the launcher at `bin/expotools.js`, which rebuilds on every invocation.

## Check exactly what CI checks

CI (`.github/workflows/expotools.yml`) runs these from this directory, in
this order. Run all three before pushing a change here — each has caught a
real regression that a partial check missed:

```sh
pnpm build                     # expo-build cjs:src=build — the compile that ships
pnpm tsc --noEmit              # typecheck under THIS tsconfig (noUnusedLocals is on)
pnpm lint --max-warnings 0     # eslint; warnings fail CI (import/order, etc.)
```

Pitfalls that produced failed pushes:

- `npx tsc` from outside this directory resolves a different `tsc` and
  checks nothing useful. Always run via `pnpm` here, or invoke
  `./node_modules/.bin/tsc --noEmit -p .` explicitly.
- `noUnusedLocals` means deleting a call site without deleting the callee
  fails the build. When bypassing or removing a feature, remove everything it
  made unreachable — the compiler lists them; iterate until silent.
- `import/order` requires a blank line between import groups (`node:` builtins
  vs local `../` imports).

## Running a command against the working tree

`./bin/expotools <command>` (or `node bin/expotools.js <command>`) uses the
real launcher, including the rebuild. `node build/expotools.js` is NOT an
entry point — it exists, exits 0, and runs nothing, which makes a smoke test
look green while doing nothing.

## `et verify`

Dispatch, dashboard, and `ls` delegate to the `@expo/verify` engine
(`npx @expo/verify@<pin>` with this repo's `.verify/` profile); see the
header of `src/commands/VerifyCommand.ts`. Bump the pin there when the
engine releases; keep it in step with the repo variable `VERIFY_VERSION`
that `.github/workflows/verify.yml` reads. `roundup` is still native.

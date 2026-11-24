---
name: bump-rn
description: Upgrade React Native in expo/expo to a new patch or RC version end to end - rebase the expo/react-native fork (react-native-lab submodule) onto the upstream release tag, bump react-native and @react-native/* with `et bump-rn`, regenerate the committed Podfile.locks, verify, and make the two conventional commits. Use when the user says "bump-rn", "bump react-native", "upgrade React Native to 0.xx", or a new React Native RC/patch is out. Usage - /bump-rn -v 0.89.0-rc.3
allowed-tools: "Read,Edit,Bash"
---

# Bump React Native in expo/expo

Arguments: `-v <version>` (or a bare version). Rules:

- Do not `git push` unless the user asks. Never run `git submodule update` (it resets the fork checkout to the old pointer).
- `et` and the pinned CocoaPods resolve only through direnv: `direnv exec "$REPO" et …`,
  `direnv exec "$REPO" pod …`.
- Commit only if the user asked for commits; otherwise stop before each commit and print the message.
- Use absolute paths or `git -C`; do not rely on `cd` persisting between commands.

```sh
REPO=$(git rev-parse --show-toplevel)
LAB=$REPO/react-native-lab/react-native
NEW=<version>                                                                    # e.g. 0.89.0-rc.3
OLD=$(sed -nE 's/^  react-native: //p' "$REPO/pnpm-workspace.yaml")             # e.g. 0.89.0-rc.2
SDK=$(git -C "$LAB" branch -r --points-at "$(git -C "$REPO" rev-parse HEAD:react-native-lab/react-native)" \
  --format='%(refname:lstrip=3)' | sed -nE "s/^(sdk-[0-9]+)-$OLD\$/\1/p")      # e.g. sdk-59; run after `git -C "$LAB" fetch origin`
PNPM_VERSION=$(node -p "require('$REPO/package.json').devEngines.packageManager.version")  # pinned pnpm; a pnpm on PATH can be newer
```

The fork keeps one branch per React Native version: `$SDK-<version>` on `origin`
(expo/react-native). The submodule in `main` points at the tip of `$SDK-$OLD`, so the
checkout is usually a detached HEAD. The plain `$SDK` branch is not updated per bump.

## 0. Preflight

- `git -C "$REPO" status --porcelain` and `git -C "$LAB" status --porcelain` are empty
  (untracked files you will not commit are fine; section 6 stages only tracked files).
- The fork has the upstream remote:
  `git -C "$LAB" remote get-url fb || git -C "$LAB" remote add fb git@github.com:facebook/react-native.git`.
- `git -C "$LAB" fetch origin && git -C "$LAB" fetch fb --tags`.
- `git -C "$LAB" rev-parse HEAD "origin/$SDK-$OLD"` prints the same hash twice (else ask).
- `git -C "$LAB" rev-parse "v$NEW"` resolves, and `npm view "react-native@$NEW" version` prints `$NEW`.
- New minor (`$NEW` and `$OLD` differ in `0.xx`)? Do section 9 first.
- `git -C "$REPO" fetch origin main && git -C "$REPO" checkout -b "<user>/bump-react-native-$NEW" origin/main`
  (ignore the post-checkout warning about pods).

## 1. Fork: rebase onto the upstream release tag

```sh
git -C "$LAB" checkout -b "$SDK-$NEW" "origin/$SDK-$OLD"
git -C "$LAB" cherry "v$NEW" "$SDK-$NEW"      # '-' lines are already upstream; the rebase drops them
git -C "$LAB" rebase "v$NEW"
```

Rebase onto the tag, not onto `fb/0.XX-stable`: the stable branch moves past the release
(backports, `[LOCAL] Bump Podfile.lock`) before Expo bumps.

Checks:

- `git -C "$LAB" log --oneline "v$NEW..HEAD"` lists only Expo's commits, the same ones as
  `git -C "$LAB" log --oneline "v$OLD..origin/$SDK-$OLD"`. sdk-59 carries 4: Hermes debugger on
  release builds, appearance night mode scoped to the activity, dev settings activity guarded,
  explicit Kotlin Gradle plugin.
- `node -p "require('$LAB/packages/react-native/package.json').version"` = `$NEW`.
- `git -C "$LAB" status --porcelain` empty.
- `HERMES=$(sed -n 's/^HERMES_VERSION_NAME=//p' "$LAB/packages/react-native/sdks/hermes-engine/version.properties")`.

Conflicts: commit already upstream (a `-` in `git cherry`, or Meta's `[LOCAL] Bump Podfile.lock`) ->
`git rebase --skip`. Expo commit -> keep the upstream code, re-apply Expo's change,
`git add -A && git rebase --continue`. Anything odd -> `git rebase --abort` (`origin/$SDK-$OLD`
keeps the old tip).

## 2. Push the fork branch (ask first)

```sh
git -C "$LAB" push origin "$SDK-$NEW"
```

CI and the EAS Expo Go build fetch the submodule and fail until this is pushed. Keep going locally.

## 3. Commit 1

```sh
git -C "$REPO" add react-native-lab/react-native
git -C "$REPO" commit -m "[react-native-lab] Update to $NEW"
git -C "$REPO" show --stat --format= HEAD     # only react-native-lab/react-native
```

## 4. Packages and pods

```sh
cd "$REPO" && direnv exec "$REPO" et bump-rn -v "$NEW" > "$TMPDIR/bump-rn.log" 2>&1
```

Budget 20+ minutes: run it in the background and poll the log (or `--no-pods`, then per app
`direnv exec "$REPO" pod install` in `<app>/ios`; expo-go: `pnpm run install:react-native-lab`
in `$REPO` then `pod update hermes-engine --no-repo-update`). Without a TTY it installs pods
without asking. It bumps every package.json (apps, packages incl. e2e fixtures, templates), the
pnpm-workspace.yaml override and bundledNativeModules.json, runs `pnpm install`, then `pod install`
sequentially in the 5 apps with a committed Podfile.lock (bare-expo, brownfield-tester/integrated,
minimal-tester, native-tests, expo-go last). expo-go needs the lab codegen built and
`pod update hermes-engine` because hermes-engine is an external podspec at a fixed lab path that a
plain `pod install` never re-reads.

If one app fails: fix the cause, then re-run `pod install` in that app's `ios` dir only
(expo-go: `pod update hermes-engine --no-repo-update`). Corrupted Pods dir ->
`rm -rf <app>/ios/Pods` and re-run.

Then, always, dedupe with the repo-pinned pnpm (`et bump-rn` used whatever `pnpm` is on PATH):

```sh
cd "$REPO" && npx -y pnpm@$PNPM_VERSION dedupe 2>&1 | tail -3     # ~30 s; rewrites pnpm-lock.yaml and node_modules only
```

Run it before the section 5 checks so commit 2 carries the deduped lock. If the dedupe diff changes the
version of a package that also appears in a Podfile.lock, re-run `pod install` in those apps.

## 5. Checks (all greps)

```sh
cd "$REPO"
grep -rn --include=package.json "$OLD" apps packages templates | grep -v node_modules      # empty
grep -n 'react-native: ' pnpm-workspace.yaml; grep -n '"react-native":' packages/expo/bundledNativeModules.json   # $NEW
grep -oE '^  react-native@[0-9][^(:]*' pnpm-lock.yaml | sort -u                            # react-native@$NEW only
grep -c "$OLD" pnpm-lock.yaml                                                             # 0
for app in apps/bare-expo apps/brownfield-tester/integrated apps/expo-go apps/minimal-tester apps/native-tests; do
  echo "== $app"
  grep -m1 -E '^  - React-Core \(' "$app/ios/Podfile.lock"        # React-Core ($NEW)
  grep -m1 -E '^  - hermes-engine \(' "$app/ios/Podfile.lock"     # hermes-engine ($HERMES)
  grep -c "$OLD" "$app/ios/Podfile.lock"                          # 0
done
git ls-files 'apps/*project.pbxproj' | xargs grep -l "react-native@$OLD"                  # none (apps/sandbox is gitignored, skip it)
git status --porcelain --untracked-files=no | grep -vE 'package.json$|Podfile.lock$|project.pbxproj$|pnpm-lock.yaml|pnpm-workspace.yaml|bundledNativeModules.json|PrivacyInfo.xcprivacy'   # empty
git diff -U0 pnpm-lock.yaml | grep -E '^[-+][^-+]' | grep -vE "$OLD|$NEW|integrity:|\([0-9a-f]{20,}\)"   # empty, or only lines listed in section 8
```

Expected noise in `git diff pnpm-lock.yaml`: new `integrity` lines of the `$NEW` entries and hashed peer
suffixes such as `@shopify/react-native-skia` `2.11.2(<hash>)`, which encode the react-native version.

The expo-go lock keeps `:tag: hermes-v…` under `CHECKOUT OPTIONS` at the value of
`packages/react-native/sdks/.hermesv1version`; only the PODS line and the checksum change.

## 6. Commit 2

```sh
git -C "$REPO" add -u && git -C "$REPO" commit -m "update react-native $NEW in packages"
```

`add -u` stages only tracked files, so local untracked files stay out of the commit.
No changeset for RC/patch bumps.

## 7. Hand-off

Print the push list (section 2 plus `git push -u origin <branch>`) and the PR text. Open the PR
only if the user asks; open it as a draft until the apps were run locally.

Title: `Upgrade React Native to $NEW`

```
# Why

Follow up of https://github.com/expo/expo/pull/<previous bump PR>

# How

- update the `react-native-lab` fork to $NEW (`$SDK-$NEW`)
- update package versions
  - `react-native $OLD -> $NEW`
  - `@react-native/<name> $OLD -> $NEW`

# Test Plan

<what you ran and the result, e.g. `pod install` in the 5 apps; bare-expo and minimal-tester
on iOS / Android; or "not run yet">

# Checklist

(copy from .github/PULL_REQUEST_TEMPLATE, unchecked)
```

- Previous bump PR: `gh pr list -R expo/expo --state merged --search "Upgrade React Native to in:title" --limit 1`.
- One `@react-native/<name>` bullet per package:
  `git -C "$REPO" show HEAD -U0 -- '*package.json' | grep -oE '"@react-native/[a-z-]+"' | sort -u`.
- Optional local builds: `cd apps/bare-expo && npx expo run:ios` / `npx expo run:android`
  (no `--port`: `pnpm ios` pins 8081 and fails when another Metro owns it).

## 8. Known failures

| Symptom | Fix |
|---|---|
| expo-go pod install: `Cannot find module '@react-native/codegen/lib/cli/combine/combine-js-to-schema.js'` | `pnpm run install:react-native-lab` in `$REPO`, re-run |
| expo-go lock still has the old `hermes-engine (…)`; EAS says "could not find compatible versions for pod hermes-engine" | `pod update hermes-engine --no-repo-update` in `apps/expo-go/ios` |
| CocoaPods: "run `pod update X --no-repo-update` to apply changes" | `et` retries it; by hand, run that command in the app |
| the pnpm-lock grep shows two `react-native@` variants | the optional `@types/react` peer split: keep the root `@types/react` devDependency, run plain `pnpm install` |
| `ERR_PNPM_NO_MATCHING_VERSION` | not on npm yet; wait |
| `git rev-parse "v$NEW"` fails | `git -C "$LAB" fetch fb --tags`; if the tag is still missing, the release is not cut yet |
| pod install codegen `RangeError: Maximum call stack size exceeded` on a fresh rc.0 | compare with the previous RC before debugging; bare-expo keeps `codegenConfig.type: "modules"` |
| CLI e2e offline install timeout on a <24h-old RC | fixed in `createFromFixtureAsync` (minimumReleaseAgeExclude); if it recurs, extend that list |
| lock has `(@expo/config-plugins@packages+@expo+config-plugins)` suffixes and `optionalDependencies` links on `@react-native-vector-icons/*` | written by a pnpm newer than `$PNPM_VERSION`; the dedupe at the end of section 4 removes them, also when `main` already has them |
| lock moves `semver ^7.x` from 7.8.5 to 7.7.4 in re-resolved importers and snapshots | the pinned pnpm resolves the same way and `pnpm dedupe` consolidates onto 7.7.4; leave it |

## 9. New minor version (first RC of 0.xx)

- Fork: create `$SDK-$NEW` on the tag `v$NEW` and cherry-pick Expo's commits from
  `origin/$SDK-$OLD` oldest first (`git log --reverse --format=%H "v$OLD..origin/$SDK-$OLD"`).
  Skip Meta's `[LOCAL] Bump Podfile.lock`. `install:react-native-lab` builds codegen, so do not
  commit prebuilt codegen output. Expect conflicts in the Expo Go Android Gradle setup on an AGP
  major bump.
- Sections 2-7 as usual, then: add a changeset for each published package whose package.json
  changed (see "Recording Package Changes" in CONTRIBUTING.md); set `"reactNative"` in
  `packages/@expo/sdk-compatibility/src/sdk-compatibility.json` to the new minor; API-change code
  fixes in separate commits.

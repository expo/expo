# Expo Swift Style Guide

We format Swift sources with [swift-format](https://github.com/swiftlang/swift-format) using the configuration at the repo root (`.swift-format`). swift-format is opinionated; rather than maintain a long list of in-house conventions, we accept its defaults with a few narrow overrides and rely on the formatter to keep the codebase consistent.

## Scope

> [!NOTE]
> Adoption is experimental. We're piloting swift-format on a small set of packages before expanding. The configuration and rollout details below may change as we learn from the pilot, and the supported package list will grow over time.

Formatting is opt-in per package and rolled out gradually. Packages currently formatted with swift-format:

- `expo-modules-jsi`

Other packages are not yet formatted. To opt a package in, add the `swift:format` and `swift:lint` scripts (see below) and update the path filters in `.github/workflows/swift-format.yml`.

## Installing swift-format locally

### macOS (Xcode 26.2 or newer)

swift-format is bundled with the Swift toolchain. Run it via `xcrun`:

```sh
xcrun swift-format --version
# 603.0.0
```

No extra install needed. The pnpm scripts pick this up automatically.

### Linux (or non-Xcode macOS)

Build from source at the version CI uses:

```sh
git clone --depth 1 --branch 603.0.0-prerelease-2026-02-09 https://github.com/swiftlang/swift-format.git /tmp/swift-format
(cd /tmp/swift-format && swift build -c release)
mkdir -p ~/.local/bin
cp /tmp/swift-format/.build/release/swift-format ~/.local/bin/
```

Make sure `~/.local/bin` is on your `PATH`.

The version must match the pin in `scripts/swift-format.sh` (`EXPECTED_VERSION` / `EXPECTED_XCODE_VERSION`) and `SWIFT_FORMAT_VERSION` in `.github/workflows/swift-format.yml`. CI runs the version pinned there; mismatches can produce different output. Note: the swift-format Git tag is currently a 603 prerelease (no final `603.0.0` exists yet); the same binary reports `6.3.0` when bundled with Xcode — both refer to the same series.

## Running the formatter

From inside a formatted package:

```sh
# Rewrite files in place
pnpm swift:format

# Check without modifying (matches what CI runs)
pnpm swift:lint
```

The script only touches tracked `.swift` files, so Pods, `.build`, `DerivedData`, and untracked content are skipped automatically. If you need to format files outside a package, invoke the shared script directly:

```sh
./scripts/swift-format.sh path/to/dir
./scripts/swift-format.sh --lint path/to/dir
```

## Configuration

The repo-root `.swift-format` is intentionally minimal:

```json
{
  "indentation": { "spaces": 2 },
  "indentConditionalCompilationBlocks": false,
  "lineLength": 120,
  "version": 1
}
```

Everything else uses swift-format's defaults. If you have a strong opinion about a rule, raise it with the team before changing the config — the goal of using a formatter is to stop relitigating style on a per-PR basis.

## Conventions not enforced by the formatter

A formatter handles whitespace, line breaks, and a handful of stylistic rewrites — it can't reason about meaning. The following are reviewer expectations:

- Naming: prefer full words over abbreviations (`Prototype`, not `Proto`).
- Use explicit `return` keywords in closures rather than relying on implicit returns.
- Place private helper methods at the end of the type, after public and internal API.

## Opting a new package in

1. Add the scripts to the package's `package.json`:
   ```json
   {
     "scripts": {
       "swift:format": "../../scripts/swift-format.sh",
       "swift:lint": "../../scripts/swift-format.sh --lint"
     }
   }
   ```
2. Run `pnpm swift:format` once to bring existing files into shape. Land that as its own commit so it can be added to `.git-blame-ignore-revs` later.
3. Update the path filters and lint steps in `.github/workflows/swift-format.yml` so CI starts enforcing the rule for that package.
4. Add the package to the **Scope** section of this document.

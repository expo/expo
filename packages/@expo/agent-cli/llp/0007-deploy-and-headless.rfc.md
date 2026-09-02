# 0007: Deploy and headless project creation

**Type:** RFC
**Status:** Active
**Systems:** EAS Hosting; launch.expo.dev; EAS auth; `create-expo`; `src/deploy/`; `src/new/`
**Author:** Kudo (drafted with Tuft agent)
**Date:** 2026-08-20
**Revised:** 2026-08-30
**Related:** [[0001-agentic-cli-on-expo-cli]], [[0006-agent-native-cli-surface]], [[0010-agent-conventions]]

## Summary

`deploy` ships a web or native app. `new` creates a project with no TTY. Cloudflare Workers tools, chat-driven development, and device-code auth are not in v1. See [[0017-deferred-commands]].

## deploy

One command, two rails: web via EAS Hosting, native via launch.expo.dev. The orchestration is deterministic (export, upload, URLs back). It pairs with smart `dev` ([[0004-smart-start-and-project-state]]): one command to run, one to ship.

### Native rail

launch.expo.dev consumes project source as one gzip tarball. It generates and runs the EAS workflow itself. `@expo/agent-cli deploy --native` delegates to `create-launch` as a subprocess. [confirmed, Kudo, 2026-08-22] The tarball, the auth, and the upload stay on the other side of the process boundary.

- Resolution order: the project bin, then PATH, then `npx create-launch@latest`. Always `--json`.
- `--upload-root <dir>` runs the subprocess from that directory with `--project <app>`.
- Auth failure maps to `Try: npx expo login`. A machine-readable error object from `create-launch --json` is a recorded upstream ask. Today the auth case is scraped from stderr.
- The browser handoff is a required UX step. App Store setup needs a browser Apple login. Launch sessions expire after 8 hours. The expiry is hardcoded because the service returns no `expiresAt`.
- `--platform` and `--profile` are typed errors. A launch covers both platforms.

### Web rail

`deploy --web` is two subprocesses: `expo export --platform web`, then `eas deploy`. A successful run prints the project, the targets, the export directory, and the web URL. Follow-ups name the URL and `npx eas deploy --prod`. A preview deployment is what `eas deploy` makes without `--prod`.

A bundler that cannot export is a project defect. `deploy` reports it, names `Try: npx expo export --platform web`, and exits 1. Exit 7 is a step only a person can complete ([[0010-agent-conventions]]).

### An unlinked project

The diagnosis is the EAS CLI's own `EAS project not configured` sentence. That sentence decides the `Why:` and the `How:`.

1. The fix is the non-interactive form: `eas init --account <name> --non-interactive` to create, `eas init --id <project-id> --non-interactive` to link. Both are in the `How:`. The account is read from `Accounts you can create projects in:`. When it names exactly one, the command is filled in.
2. A generic needs-human row must not overwrite a fix the site already knows. `handoffOr` prefers the diagnosis's own command when there is one.

## new

`@expo/agent-cli new <dir> [--name] [--no-install] [--no-git] [--json]` runs `create-expo --yes` as a subprocess, does a git init when appropriate, and offers follow-ups into the new project. Zero-TTY is asserted in e2e.

EAS init, a first-boot check, and the one-line-description form are not in v1. See [[0017-deferred-commands]].

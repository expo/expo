// @ref llp/0002-testing-and-evals.plan.md §A flag is not shipped until it has run against the
// published binary
// The inventory of every option this CLI writes onto a command line, and the extractor that builds
// it. The inventory is the point: it is the list a reviewer has to have run against the published
// binary, and a snapshot is what makes adding to it deliberate.

import path from "path";

import { extractForeignFlags } from "../foreignFlags";
import { sweepSuggestedCommands, type Sweep } from "../sweep";

jest.unmock("fs");
jest.unmock("node:fs");

const at = (source: string) => extractForeignFlags("src/example.ts", source);

describe(extractForeignFlags, () => {
  it(`reads an array literal passed straight to a spawn helper`, () => {
    expect(
      at(
        `await spawnExpoAsync(projectRoot, ['export', '--platform', 'web'], { output });`
      )
    ).toEqual([{ file: "src/example.ts", line: 1, flag: "--platform" }]);
  });

  it(`reads an argv assembled before its spawn`, () => {
    expect(
      at(`const DOCTOR_ARGS = ['--verbose'];`).map((use) => use.flag)
    ).toEqual(["--verbose"]);
  });

  it(`reads a flag pushed onto an argv, which is the conditional shape the rule is about`, () => {
    expect(
      at(
        [
          `function buildGenerateArgs(root, { preset }) {`,
          `  const args = ['fingerprint:generate', root];`,
          `  if (preset) { args.push('--preset', preset); }`,
          `  return args;`,
          `}`,
        ].join("\n")
      ).map((use) => use.flag)
    ).toEqual(["--preset"]);
  });

  it(`ignores an option in an object, which is a schema and not a command line`, () => {
    expect(at(`const WAIT_ARGS = { '--timeout': String };`)).toEqual([]);
  });

  it(`ignores a bare dash, which is a filename convention`, () => {
    expect(at(`await spawnCaptureAsync('cat', ['-']);`)).toEqual([]);
  });
});

describe("the flags this CLI writes onto a command line", () => {
  let sweep: Sweep;
  beforeAll(() => {
    sweep = sweepSuggestedCommands(path.resolve(__dirname, "../.."));
  });

  it(`is this list, and every foreign one has been run against the published binary`, () => {
    // **Adding a row is a decision, not an edit.** The monorepo holds the source of the CLIs this
    // one drives, so a flag read from `cli/src/commands/*.ts` is a claim about an unreleased
    // version: `--preset` existed here and not in `@expo/fingerprint` 0.20.9, and sending it
    // unasked would have broken `impact` against every real project [observed — live, 2026-08-24].
    // Before a row lands here, run the command once against `npx <package>@latest` in a project
    // outside this repository (llp/0002 §A flag is not shipped until it has run against the
    // published binary).
    //
    // Two rows are this CLI re-invoking itself and need no such run: the `--help` `cli.ts`
    // normalizes onto a command's own argv, and the three flags `smoke` gives `@expo/agent-cli
    // dev`. They are here because leaving them out would mean keeping an exclusion list, which is
    // a place for a real one to hide.
    //
    // `--yes  src/utils/easCli.ts` is the one row whose command line belongs to **npm's exec**
    // rather than to a member of the Expo family: it is what keeps the EAS CLI's runner from
    // stopping on `Ok to proceed?` (llp/0015 §Resolving the EAS CLI). Run as the rule requires
    // [observed — live, 2026-08-27: `npx --yes eas-cli@latest --version` answered
    // `eas-cli/22.6.0 darwin-arm64 node-v26.5.0` and exited 0].
    //
    // The list got *shorter* in the same wave: `eas --version` was the probe that asked a binary on
    // `PATH` to prove it was the EAS CLI, and the single rung deleted both the candidate and the
    // question (llp/0015 §Resolving the EAS CLI).
    //
    // The two `src/device/bootDevice.ts` rows are the platform device tools rather than a member of
    // the Expo family, and they were run as the rule requires [observed — live, 2026-08-30, macOS
    // 26 with Xcode: `xcrun simctl list devices -j` printed the runtime table and exited 0, and
    // `~/Library/Android/sdk/emulator/emulator -list-avds` printed `tuft-pixel` and exited 0].
    expect(
      sweep.foreignFlags.map(({ flag, file }) => `${flag}  ${file}`).sort()
    ).toMatchInlineSnapshot(`
      [
        "--detach  src/smoke/smokeAsync.ts",
        "--help  src/cli.ts",
        "--is-inside-work-tree  src/new/git.ts",
        "--json  src/config/introspectAsync.ts",
        "--json  src/deploy/launchCli.ts",
        "--json  src/impact/runtimeVersion.ts",
        "--json  src/install/resolveOptions.ts",
        "--no-install  src/new/createExpo.ts",
        "--noEmit  src/typecheck/checkAsync.ts",
        "--non-interactive  src/deploy/deployAsync.ts",
        "--platform  src/deploy/deployAsync.ts",
        "--platform  src/project/fingerprint.ts",
        "--port  src/dev/devAsync.ts",
        "--preset  src/project/fingerprint.ts",
        "--pretty  src/typecheck/checkAsync.ts",
        "--project  src/deploy/launchCli.ts",
        "--type  src/config/introspectAsync.ts",
        "--type  src/impact/runtimeVersion.ts",
        "--verbose  src/doctor/checkAsync.ts",
        "--wait-ready  src/smoke/smokeAsync.ts",
        "--yes  src/new/createExpo.ts",
        "--yes  src/smoke/smokeAsync.ts",
        "--yes  src/utils/easCli.ts",
        "-Fpc  src/dev/portListener.ts",
        "-ano  src/dev/portListener.ts",
        "-j  src/device/bootDevice.ts",
        "-j  src/navigate/device.ts",
        "-j  src/runtime/targetPlatform.ts",
        "-list-avds  src/device/bootDevice.ts",
        "-nP  src/dev/portListener.ts",
        "-p  src/device/screenshot.ts",
        "-p  src/toolchain/detect.ts",
        "-s  src/device/screenshot.ts",
        "-s  src/navigate/adbReverse.ts",
        "-s  src/runtime/appProcess.ts",
        "-sTCP:LISTEN  src/dev/portListener.ts",
        "-version  src/toolchain/detect.ts",
        "-version  src/toolchain/detect.ts",
      ]
    `);
  });

  it(`never puts a fingerprint option on the command line unasked`, () => {
    // The `--preset` incident in its narrowest form, pinned where the sweep can see it: the
    // default `fingerprint:generate` carries no option at all, so a published CLI too old for
    // either of them still answers. `buildGenerateArgs` has the per-option tests.
    const fingerprint = sweep.foreignFlags.filter(
      (use) => use.file === path.join("src", "project", "fingerprint.ts")
    );
    expect(fingerprint.map((use) => use.flag).sort()).toEqual([
      "--platform",
      "--preset",
    ]);
  });
});

// @ref llp/0002-testing-and-evals.plan.md §A flag is not shipped until it has run against the published binary
// @ref llp/0011-impact-and-freshness.rfc.md §Precision limits — the `--preset` incident.
// Every option this CLI puts on another CLI's command line.
//
// The hazard is the process boundary of llp/0001 read the wrong way round. This repository holds
// the *source* of `@expo/cli`, `@expo/fingerprint` and the rest, so a flag looked up in
// `cli/src/commands/*.ts` is a claim about an unreleased version — and the binary a user's project
// runs came from the registry. `--preset` existed here and not there: a real SDK 57 project on
// `@expo/fingerprint` 0.20.9 answered `unknown or unexpected option: --preset` and exited non-zero
// [observed — live, 2026-08-24], which would have broken `impact` against essentially every
// project that exists.
//
// Nothing in a unit test can run the published binary, so what this does instead is make the
// surface **countable**: the flags below are pinned by a snapshot, so adding one to another CLI's
// command line is a visible diff rather than a line in a builder. That diff is the moment the rule
// applies.
//
// What is collected is every option this CLI *writes onto a command line*, which is a superset of
// the foreign ones by exactly the two places it re-invokes itself (`cli.ts` normalizing `--help`
// onto a command's own argv, and the flags `smoke` gives `@expo/agent-cli dev` when it starts one). Those two are left in
// rather than excluded: an exclusion list is a place for a real one to hide, and the snapshot names
// the file of every row anyway.

import ts from 'typescript';

/** One option this CLI hands to another CLI's binary. */
export interface ForeignFlagUse {
  file: string;
  line: number;
  /** The option, e.g. `--non-interactive`. */
  flag: string;
}

/**
 * Helpers that run another CLI's binary.
 *
 * `spawnCaptureAsync` is here for the device tools (`xcrun`, `adb`) as well as the Expo family: a
 * flag `simctl` dropped is the same class of failure as one `fingerprint` never had.
 */
const SPAWN_HELPERS = new Set([
  'spawnExpoAsync',
  'runExpoAsync',
  'spawnEasAsync',
  'runEasAsync',
  'spawnSubprocessAsync',
  'spawnCaptureAsync',
  'spawnFingerprintAsync',
]);

/**
 * What a variable holding another CLI's command line is called.
 *
 * A name rather than a list of builders, because an argv assembled ten lines above its spawn is
 * still an argv, and every one of them in this package is called some kind of `args`. Nothing in
 * this CLI builds its own argv — it parses one — so the pattern never claims a local option.
 */
const ARGV_NAME = /(args|argv)$/i;

/**
 * Every option handed to another CLI in one source file.
 *
 * Three shapes, which is all of them here: an array literal passed straight to a spawn helper, an
 * array literal assigned to something called `args`, and a `push` onto one. Anything computed is
 * out of reach and stays a matter for review — which is what the rule this serves is for.
 */
export function extractForeignFlags(file: string, source: string): ForeignFlagUse[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const uses: ForeignFlagUse[] = [];
  const at = (node: ts.Node) =>
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  const take = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) && node.text.startsWith('-') && node.text !== '-') {
      uses.push({ file, line: at(node), flag: node.text });
    }
  };

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      // `spawnExpoAsync(root, ['export', '--platform', 'web'], …)` — every array-literal argument,
      // because which position carries the argv differs per helper.
      if (ts.isIdentifier(callee) && SPAWN_HELPERS.has(callee.text)) {
        for (const argument of node.arguments) {
          if (ts.isArrayLiteralExpression(argument)) {
            argument.elements.forEach(take);
          }
        }
      }
      // `expoArgs.push('--json')`, `args.push('--preset', preset)`.
      if (
        ts.isPropertyAccessExpression(callee) &&
        callee.name.text === 'push' &&
        ts.isIdentifier(callee.expression) &&
        ARGV_NAME.test(callee.expression.text)
      ) {
        node.arguments.forEach(take);
      }
    }
    // `const args = ['fingerprint:generate', projectRoot];`, `const DOCTOR_ARGS = ['--verbose'];`
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      ARGV_NAME.test(node.name.text) &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      node.initializer.elements.forEach(take);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return uses;
}

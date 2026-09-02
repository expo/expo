// @ref llp/0010-agent-conventions.rfc.md §Registry rules an argument a command has no place
// for is an error, and so is an option it has no place for.
// Which options each command accepts, read out of the calls that parse them.
//
// The command name in a suggestion is only half of what can go stale. `npx @expo/agent-cli dev:stop
// --force` is a command that resolves and an option that exists; `npx @expo/agent-cli dev:stop
// --tail` is a command that resolves and an option that was moved to `dev:logs`, and the reader
// finds that out by running it. Both `parseArgsOrThrow` and `assertWithOptionsArgs` take the
// command's own `arg` schema and the command's own name in one call, so the pairing is in the
// source and nothing has to be transcribed to a second list.
//
// What this deliberately does *not* do is guess. A call site whose schema or name is computed is
// reported as uncovered rather than approximated, and {@link uncoveredCommands} is pinned by a test
// — so the hole is a number that has to be changed on purpose, not a silence.

import ts from 'typescript';

import { commandGroups } from '../commandRegistry';
import { DEV_OWN_FLAGS, EXPO_START_FLAGS } from '../dev/knownFlags';

/**
 * What a command does with the arguments that are not options.
 *
 * `'unknown'` is this scan's answer, not the command's: a strict `parseArgsOrThrow` site states no
 * policy, because the policy is stated once at the entry parse.
 *
 * @see import('../utils/args').PositionalArgPolicy
 */
export type ScannedPositionalPolicy = 'none' | 'own' | 'unknown';

/** The options one command accepts, and whether that list is the whole of them. */
export interface CommandFlagSpec {
  /** The command as a caller types it, e.g. `dev:stop`. */
  command: string;
  /** Every option key of its `arg` schemas, long forms and aliases together. */
  flags: string[];
  /**
   * The options that consume the next argument, i.e. everything but the `Boolean` ones.
   *
   * Needed to tell an argument from a value: in `dev:stop --timeout 90s` the `90s` is not a
   * positional argument, and in `typecheck src/app.tsx` the path is.
   */
  valueFlags: string[];
  /**
   * Whether an option outside {@link flags} is still accepted.
   *
   * True for the commands that forward what they do not own to another CLI (`start`, `install`),
   * where the option list of this CLI is not the option list of the command.
   */
  forwardsUnknownFlags: boolean;
  /** What the command does with an argument that is not an option. */
  positionalArgs: ScannedPositionalPolicy;
}

/** The two helpers every command's argument parse goes through (`src/utils/args.ts`). */
const PARSE_HELPERS = new Set(['parseArgsOrThrow', 'assertWithOptionsArgs']);

/**
 * One parse call whose command name could not be read.
 *
 * Kept rather than dropped: a command whose options are unreadable must be *known* to be
 * unreadable, or the flag check silently passes everything it names.
 */
export interface UnreadableParseCall {
  file: string;
  line: number;
  /** The source of the argument that names the command, e.g. `` `runtime:${windowAction}` ``. */
  nameExpression: string;
}

export interface FlagSpecScan {
  specs: CommandFlagSpec[];
  unreadable: UnreadableParseCall[];
}

/**
 * The option schemas of one TypeScript source, by the command each one parses for.
 *
 * @param file the path to report.
 * @param source the file's text.
 */
export function extractFlagSpecs(file: string, source: string): FlagSpecScan {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const specs: CommandFlagSpec[] = [];
  const unreadable: UnreadableParseCall[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const helper = node.expression.text;
      if (PARSE_HELPERS.has(helper)) {
        const read = readParseCall(helper, node, sourceFile);
        if (read.spec) {
          specs.push(read.spec);
        } else {
          unreadable.push({
            file,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
            nameExpression: read.nameExpression,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return { specs, unreadable };
}

/** One `parseArgsOrThrow(schema, argv, name)` or `assertWithOptionsArgs(schema, options)` call. */
function readParseCall(
  helper: string,
  call: ts.CallExpression,
  sourceFile: ts.SourceFile
): { spec: CommandFlagSpec | null; nameExpression: string } {
  const schema = call.arguments[0];
  const options = call.arguments[1];
  const nameArgument =
    helper === 'parseArgsOrThrow' ? call.arguments[2] : propertyOf(options, 'command');
  const nameExpression = nameArgument ? nameArgument.getText(sourceFile) : '<missing>';

  if (!schema || !nameArgument || !ts.isStringLiteral(nameArgument)) {
    return { spec: null, nameExpression };
  }
  const read = readSchemaFlags(schema, sourceFile);
  if (read == null) {
    return { spec: null, nameExpression };
  }

  const permissive = propertyOf(options, 'permissive');
  const positional = propertyOf(options, 'positionalArgs');
  return {
    spec: {
      command: nameArgument.text,
      flags: read.flags,
      valueFlags: read.valueFlags,
      forwardsUnknownFlags: permissive?.kind === ts.SyntaxKind.TrueKeyword,
      positionalArgs:
        positional && ts.isStringLiteral(positional) && positional.text === 'none'
          ? 'none'
          : positional && ts.isStringLiteral(positional)
            ? 'own'
            : 'unknown',
    },
    nameExpression,
  };
}

/** The value of one property of an object-literal argument, or undefined. */
function propertyOf(node: ts.Node | undefined, name: string): ts.Expression | undefined {
  if (!node || !ts.isObjectLiteralExpression(node)) {
    return undefined;
  }
  for (const property of node.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    ) {
      return property.initializer;
    }
  }
  return undefined;
}

/** An option list, split by whether the option carries a value. */
interface SchemaFlags {
  flags: string[];
  valueFlags: string[];
}

/**
 * The options of an `arg` schema expression, or null when it cannot be read here.
 *
 * Three shapes, because three shapes are what the commands use: the object literal itself, a `const`
 * in the same file, and a conditional between two of those — a resolver shared by two commands picks
 * its schema with a ternary, and the union of the two branches is the honest answer for either. The
 * case that forced it was `runtime:errors` and `runtime:network`, which shared one resolver until
 * the v1 narrowing deferred the second (llp/0016); the shape is still one the commands reach for,
 * so the branch stays.
 */
function readSchemaFlags(node: ts.Expression, sourceFile: ts.SourceFile): SchemaFlags | null {
  if (ts.isObjectLiteralExpression(node)) {
    return objectFlags(node, sourceFile);
  }
  if (ts.isIdentifier(node)) {
    const declared = findConstObject(sourceFile, node.text);
    return declared ? objectFlags(declared, sourceFile) : null;
  }
  if (ts.isConditionalExpression(node)) {
    const whenTrue = readSchemaFlags(node.whenTrue, sourceFile);
    const whenFalse = readSchemaFlags(node.whenFalse, sourceFile);
    return whenTrue && whenFalse ? unionFlags(whenTrue, whenFalse) : null;
  }
  return null;
}

function unionFlags(...parts: SchemaFlags[]): SchemaFlags {
  return {
    flags: [...new Set(parts.flatMap((part) => part.flags))],
    valueFlags: [...new Set(parts.flatMap((part) => part.valueFlags))],
  };
}

/**
 * The options of an object literal, following a `...SPREAD` of another one in the same file.
 *
 * An option carries a value unless its handler is `Boolean`; an alias (`'-h': '--help'`) carries
 * whatever its target does, which is settled by the union at the end because both keys are in the
 * same object.
 */
function objectFlags(
  node: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile
): SchemaFlags | null {
  const flags: string[] = [];
  const valueFlags: string[] = [];
  const aliases: [alias: string, target: string][] = [];

  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property)) {
      const name = property.name;
      if (!ts.isStringLiteral(name) || !name.text.startsWith('-')) {
        continue;
      }
      flags.push(name.text);
      const handler = property.initializer;
      if (ts.isStringLiteral(handler)) {
        aliases.push([name.text, handler.text]);
      } else if (!(ts.isIdentifier(handler) && handler.text === 'Boolean')) {
        valueFlags.push(name.text);
      }
      continue;
    }
    if (ts.isSpreadAssignment(property)) {
      const spread = readSchemaFlags(property.expression, sourceFile);
      if (spread == null) {
        // A schema built from something this file does not declare is a schema this scan does not
        // know, and a partial answer would reject options that are really accepted.
        return null;
      }
      flags.push(...spread.flags);
      valueFlags.push(...spread.valueFlags);
    }
  }

  const carriesValue = new Set(valueFlags);
  for (const [alias, target] of aliases) {
    if (carriesValue.has(target)) {
      valueFlags.push(alias);
    }
  }
  return { flags: [...new Set(flags)], valueFlags: [...new Set(valueFlags)] };
}

/** A `const NAME = { … }` in this file, or null. */
function findConstObject(
  sourceFile: ts.SourceFile,
  name: string
): ts.ObjectLiteralExpression | null {
  let found: ts.ObjectLiteralExpression | null = null;
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer
    ) {
      // `{ … } as const` and `{ … } satisfies X` wrap the literal without changing it.
      let initializer: ts.Expression = node.initializer;
      while (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer)) {
        initializer = initializer.expression;
      }
      if (ts.isObjectLiteralExpression(initializer)) {
        found = initializer;
      }
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  };
  visit(sourceFile);
  return found;
}

/**
 * Every command's option list, merged across the call sites that parse for it.
 *
 * A command is parsed twice: the entry module takes `--help` permissively and hands the rest to a
 * `resolve*Options` that takes the real schema strictly. The union is what the command accepts, and
 * it is strict unless *every* site was permissive — which is the case for the commands that forward
 * to another CLI, and only for those.
 */
export function mergeFlagSpecs(specs: readonly CommandFlagSpec[]): Map<string, CommandFlagSpec> {
  const merged = new Map<string, CommandFlagSpec>();
  for (const spec of specs) {
    const existing = merged.get(spec.command);
    merged.set(spec.command, {
      command: spec.command,
      flags: [...new Set([...(existing?.flags ?? []), ...spec.flags])],
      valueFlags: [...new Set([...(existing?.valueFlags ?? []), ...spec.valueFlags])],
      forwardsUnknownFlags:
        existing == null
          ? spec.forwardsUnknownFlags
          : existing.forwardsUnknownFlags && spec.forwardsUnknownFlags,
      // One site saying `'none'` settles it: that site is the entry parse, and it rejects the
      // argument before any resolver sees it.
      positionalArgs:
        existing?.positionalArgs === 'none' || spec.positionalArgs === 'none'
          ? 'none'
          : existing?.positionalArgs === 'own' || spec.positionalArgs === 'own'
            ? 'own'
            : 'unknown',
    });
  }

  // `dev` is the one command whose real option list is not in an `arg` schema. It parses
  // permissively because most of what it takes belongs to the `expo start` its plan ends with, and
  // then refuses anything outside two explicit lists (`src/dev/knownFlags.ts`, friction run 5,
  // F48-3). Those lists are imported rather than transcribed, so this cannot drift from them.
  merged.set('dev', {
    command: 'dev',
    flags: [...new Set([...DEV_OWN_FLAGS, ...EXPO_START_FLAGS])],
    // Every `expo start` option that carries one, plus `dev`'s own `--port`. Transcribed from the
    // same schema `EXPO_START_FLAGS` is, and only used to tell a value from a positional argument.
    valueFlags: ['--port', '-p', '--max-workers', '-m', '--private-key-path', '--scheme', '--host'],
    forwardsUnknownFlags: false,
    // `dev` forwards its arguments to the Expo CLI, which reports its own (llp/0010 §Registry
    // rules (d)), so a positional here is not this CLI's to refuse.
    positionalArgs: 'own',
  });
  merged.set('dev:run', { ...merged.get('dev')!, command: 'dev:run' });

  // A group whose actions are one module parses them all under the bare group name (`skills`,
  // `runtime` — the `withAction` shape of llp/0006), so the schema found for the group is the
  // schema of each of its actions. Only where the action has none of its own: `dev` is a group too,
  // and its `run` action's options are not `dev:stop`'s.
  for (const [group, entry] of Object.entries(commandGroups)) {
    const groupSpec = merged.get(group);
    if (!groupSpec) {
      continue;
    }
    for (const action of Object.keys(entry.actions)) {
      const name = `${group}:${action}`;
      if (!merged.has(name)) {
        merged.set(name, { ...groupSpec, command: name });
      }
    }
  }

  return merged;
}

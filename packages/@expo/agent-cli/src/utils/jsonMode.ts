// @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
// Whether this run was asked for machine-readable output, as one process-wide fact.
//
// Every command parses `--json` for itself, because the flag means slightly different things to
// each of them (which payload, which subprocess output mode). The *error* path cannot: it is one
// function that every command funnels into, and it runs after the command module has already
// thrown — often before the command ever parsed its arguments. So the launcher answers the
// question once, from the raw argv, and `logCmdError` reads the answer here.
//
// A flag, not a parameter threaded through every call site: the alternative is an argument on
// `logCmdError` and on every `.catch(logCmdError)` in the CLI, which is thirty edits to carry one
// boolean that never changes during a run.

/** Set by the launcher, read by the error path. `false` until something says otherwise. */
let jsonRequested = false;

/**
 * Whether `--json` was on the command line, wherever the argument parsing got to.
 *
 * Read by {@link import('./errors').logCmdError} to decide whether the failure also travels as a
 * JSON object on stdout.
 */
export function isJsonRequested(): boolean {
  return jsonRequested;
}

/** Record what the launcher read off the command line. Also the reset for tests. */
export function setJsonRequested(value: boolean): void {
  jsonRequested = value;
}

/**
 * Whether an argument list asks for JSON output.
 *
 * Only before a `--` separator. `install` and `start` forward everything after it to another tool
 * verbatim, so `@expo/agent-cli install -- --json` is a flag for npm and says nothing about what this CLI
 * prints.
 */
export function argvRequestsJson(argv: string[]): boolean {
  const separator = argv.indexOf('--');
  const own = separator >= 0 ? argv.slice(0, separator) : argv;
  return own.includes('--json');
}

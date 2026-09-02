// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// `--json` must print exactly one JSON object on stdout. `setup` composes commands that print
// their own text summary, so that text is moved out of the way instead of being thrown away.

/**
 * Run `work` with `console.log` redirected to stderr.
 *
 * Only stdout carries the output contract, so the composed text summary stays readable on stderr
 * and a `--json` run remains debuggable.
 */
export async function withStdoutRedirectedAsync<T>(work: () => Promise<T>): Promise<T> {
  const original = console.log;
  console.log = (...message: unknown[]) => {
    process.stderr.write(message.map(String).join(' ') + '\n');
  };
  try {
    return await work();
  } finally {
    console.log = original;
  }
}

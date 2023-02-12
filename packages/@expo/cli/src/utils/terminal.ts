/** @returns the environment variable indicating the default terminal program to use. */
export function getUserTerminal(): string | undefined {
  return (
    process.env.REACT_TERMINAL ||
    (process.platform === 'darwin' ? process.env.TERM_PROGRAM : process.env.TERM)
  );
}

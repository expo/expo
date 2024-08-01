// Based on: https://github.com/ccheever/exec-async/blob/31dce16793b59a387deab8fad87390fe1bbfbe08/index.js

declare module 'exec-async' {
  namespace execAsync {
    type ExecAsyncOptions = import('child_process').ExecFileOptions;
    type ExecResult = string | Buffer; // See: https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback

    function argsListFromObject(key: string, value: unknown, options?: ExecAsyncOptions): string[];

    function argsFromKeyVal(
      arguments?: string[] | Record<string, string>,
      options?: ExecAsyncOptions
    ): string[];

    function escapeArg(value: string): string;
  }

  function execAsync(
    command: string,
    arguments: string[],
    options?: import('child_process').ExecFileOptions
  ): Promise<string | Buffer>;

  export = execAsync;
}

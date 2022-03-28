declare module 'better-opn' {
  function open(
    target: string,
    options?: any
  ): Promise<import('child_process').ChildProcess | false>;
  export = open;
}

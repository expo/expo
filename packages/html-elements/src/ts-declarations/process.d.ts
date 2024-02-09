interface Process {
  env: {
    [key: string]: string | undefined;
  };
}

declare const process: Process;

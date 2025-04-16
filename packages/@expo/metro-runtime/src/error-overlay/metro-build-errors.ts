type MetroFormattedError = {
  description: string;
  filename?: string;
  lineNumber?: number;
};

export class MetroBuildError extends Error {
  public ansiError: string;

  constructor(
    message: string,
    public errors?: MetroFormattedError[]
  ) {
    super(message);
    this.ansiError = message;
    // Strip the ansi so it shows as a normalized error in the console log.
    this.message = stripAnsi(message);
  }
}

export class MetroPackageResolutionError extends MetroBuildError {
  constructor(
    message: string,
    public errors: MetroFormattedError[] | undefined,
    /** "/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/index.tsx" */
    public originModulePath: string,
    /** "foobar" */

    public targetModuleName: string,
    public cause: // node module
    | {
          /** ["/Users/evanbacon/Documents/GitHub/expo/apps/router-e2e/__e2e__/05-errors/app/node_modules",] */
          dirPaths: string[];
          /** [] */
          extraPaths: string[];
        }
      // file
      | {
          candidates: {
            file: {
              type: 'sourceFile';
              /** "__e2e__/05-errors/app/foobar" */
              filePathPrefix: string;
              /** ["",".web.ts",".ts"] */
              candidateExts: string[];
            };
            dir: {
              type: 'sourceFile';
              filePathPrefix: string;
              candidateExts: string[];
            };
          };
          name: 'Error';
          message: string;
          stack: string;
        }
  ) {
    super(message);
  }
}

export function stripAnsi(str: string) {
  if (!str) {
    return str;
  }
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  ].join('|');

  return str.replace(new RegExp(pattern, 'g'), '');
}

/**
 * Type representing options for `check-packages` command.
 */
export type ActionOptions = {
  since: string;
  all: boolean;
  build: boolean;
  test: boolean;
  lint: boolean;
  fixLint: boolean;
  uniformityCheck: boolean;
  packageNames: string[];
};

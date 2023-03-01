import ora from 'ora';
export type StepOptions = ora.Options;
export declare function newStep<Result>(title: string, action: (step: ora.Ora) => Promise<Result> | Result, options?: StepOptions): Promise<Result>;
/**
 * Finds user's name by reading it from the git config.
 */
export declare function findMyName(): Promise<string>;
/**
 * Finds user's email by reading it from the git config.
 */
export declare function findGitHubEmail(): Promise<string>;
/**
 * Get the GitHub username from an email address if the email can be found in any commits on GitHub.
 */
export declare function findGitHubProfileUrl(email: string): Promise<string>;
/**
 * Guesses the repository URL based on the author profile URL and the package slug.
 */
export declare function guessRepoUrl(authorUrl: string, slug: string): Promise<string>;
export declare function findPackageJson(startDir: any): string | null;

/** Guesses the repository URL based on the author profile URL and the package slug. */
export declare function guessRepoUrl(authorUrl: string, slug: string): Promise<string>;
/** Search GitHub to resolve an email to a GitHub account */
export declare function findGitHubUserFromEmail(email: string): Promise<string | null>;
/** Search GitHub to resolve an email to a GitHub account, by searching commits instead of users */
export declare function findGitHubUserFromEmailByCommits(email: string): Promise<string | null>;

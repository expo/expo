"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGitHubUserFromEmailByCommits = exports.findGitHubUserFromEmail = exports.guessRepoUrl = void 0;
const fetch_1 = require("./fetch");
/** Guesses the repository URL based on the author profile URL and the package slug. */
async function guessRepoUrl(authorUrl, slug) {
    if (/^https?:\/\/github.com\/[^/]+/.test(authorUrl)) {
        const normalizedSlug = slug.replace(/^@/, '').replace(/\//g, '-');
        return `${authorUrl}/${normalizedSlug}`;
    }
    return '';
}
exports.guessRepoUrl = guessRepoUrl;
/** Search GitHub to resolve an email to a GitHub account */
async function findGitHubUserFromEmail(email) {
    const params = new URLSearchParams({ q: `${email} in:email` });
    const response = await (0, fetch_1.fetch)(`https://api.github.com/search/users?${params}`, {
        headers: {
            'User-Agent': 'create-expo-module',
        },
    });
    const json = (await response.json());
    const data = json.data ?? json;
    if (data?.total_count > 0) {
        if (data.items?.[0]?.login) {
            return data.items[0].login;
        }
    }
    return await findGitHubUserFromEmailByCommits(email);
}
exports.findGitHubUserFromEmail = findGitHubUserFromEmail;
/** Search GitHub to resolve an email to a GitHub account, by searching commits instead of users */
async function findGitHubUserFromEmailByCommits(email) {
    const params = new URLSearchParams({
        q: `author-email:${email}`,
        sort: 'author-date',
        per_page: '1',
    });
    const response = await (0, fetch_1.fetch)(`https://api.github.com/search/commits?${params}`, {
        headers: {
            'User-Agent': 'create-expo-module',
        },
    });
    const json = (await response.json());
    const data = json.data ?? json;
    if (data?.total_count > 0) {
        return data.items[0].author?.html_url ?? null;
    }
    return null;
}
exports.findGitHubUserFromEmailByCommits = findGitHubUserFromEmailByCommits;
//# sourceMappingURL=github.js.map
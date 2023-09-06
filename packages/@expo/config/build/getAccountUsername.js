"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountUsername = void 0;
const getUserState_1 = require("./getUserState");
const ANONYMOUS_USERNAME = 'anonymous';
/**
 * Get the owner of the project from the manifest if specified, falling back to a bunch of different things
 * which may or may not be the owner of the project.
 *
 * @deprecated This may not actually be the owner of the project. Prefer to fetch the project owner using
 * the EAS project ID, falling back to the `owner` field.
 */
function getAccountUsername(manifest = {}) {
    // TODO: Must match what's generated in Expo Go.
    const username = manifest.owner || process.env.EXPO_CLI_USERNAME || process.env.EAS_BUILD_USERNAME;
    if (username) {
        return username;
    }
    // Statically get the username from the global user state.
    return (0, getUserState_1.getUserState)().read().auth?.username || ANONYMOUS_USERNAME;
}
exports.getAccountUsername = getAccountUsername;

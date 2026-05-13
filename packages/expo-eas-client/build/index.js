import EASClient from './EASClient';
export const clientID = EASClient.clientID;
/**
 * A deterministic uniform value in [0, 1] derived from clientId.
 * Stable across app launches for the same installation,
 * but unique per app instance.
 */
export const deterministicUniformValue = EASClient.deterministicUniformValue;
//# sourceMappingURL=index.js.map
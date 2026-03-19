import EASClient from './EASClient';
export const clientID = EASClient.clientID;
/**
 * A deterministic random value in [0, 1] derived from the persisted client UUID.
 * Stable across app launches for the same installation, but unique per app instance.
 */
export const clientInterval = EASClient.clientInterval;
//# sourceMappingURL=index.js.map
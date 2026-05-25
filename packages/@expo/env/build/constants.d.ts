export declare function isUnsafeAllowedEnvKey(name: string): boolean;
export declare function isIgnoredEnvKey(name: string): boolean;
/**
 * Whether a dotenv key represents per-developer/per-machine configuration that
 * should only be loaded from `.local` env files (e.g. `.env.local`,
 * `.env.development.local`). Committed `.env*` files cannot set these — that
 * prevents a malicious project from redirecting developer-tool roots (e.g.
 * `ANDROID_HOME`) via a supply-chain attack, while still letting developers
 * pin them in their gitignored `.local` overrides.
 *
 * Honors `EXPO_UNSAFE_DOTENV_KEYS`: opt-in keys are allowed in any env file.
 */
export declare function isLocalEnvKey(name: string): boolean;

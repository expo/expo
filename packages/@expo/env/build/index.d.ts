import { type EnvOutput } from './parse';
/** Determine if the `.env` files are enabled or not, through `EXPO_NO_DOTENV` */
export declare function isEnabled(): boolean;
/** All conventional modes that should not cause warnings */
export declare const KNOWN_MODES: string[];
/** The environment variable name to use when marking the environment as loaded */
export declare const LOADED_ENV_NAME = "__EXPO_ENV_LOADED";
/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
export declare function getEnvFiles({ mode, silent, }?: {
    /** The mode to use when creating the list of `.env*` files, defaults to `NODE_ENV` */
    mode?: string;
    /** If possible misconfiguration warnings should be logged, or only logged as debug log */
    silent?: boolean;
}): string[];
/**
 * Parse all environment variables using the list of `.env*` files, in order of higest priority to lowest priority.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
export declare function parseEnvFiles(envFiles: string[], { systemEnv, }?: {
    /** The system environment to use when expanding environment variables, defaults to `process.env` */
    systemEnv?: EnvOutput;
}): {
    env: EnvOutput;
    files: string[];
    sensitiveLoadedKeys: string[];
};
/**
 * Parse all environment variables using the list of `.env*` files, and mutate the system environment with these variables.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
export declare function loadEnvFiles(envFiles: string[], { force, silent, systemEnv, }?: Parameters<typeof parseEnvFiles>[1] & {
    /** If the environment variables should be applied to the system environment, regardless of previous mutations */
    force?: boolean;
    /** If possible misconfiguration warnings should be logged, or only logged as debug log */
    silent?: boolean;
}): {
    result: "skipped";
    loaded: any;
} | {
    loaded: string[];
    env: EnvOutput;
    files: string[];
    sensitiveLoadedKeys: string[];
    result: "loaded";
};
/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This does not check for collisions of existing system environment variables, or mutates the system environment variables.
 */
export declare function parseProjectEnv(projectRoot: string, options?: Parameters<typeof getEnvFiles>[0] & Parameters<typeof parseEnvFiles>[1]): {
    env: EnvOutput;
    files: string[];
    sensitiveLoadedKeys: string[];
};
/**
 * Parse all environment variables using the detected list of `.env*` files from a project.
 * This won't override existing environment variables defined in the system environment.
 * Once the mutations are done, this will also set a propert `__EXPO_ENV=true` on the system env to avoid multiple mutations.
 * This check can be disabled through `{ force: true }`.
 */
export declare function loadProjectEnv(projectRoot: string, options?: Parameters<typeof getEnvFiles>[0] & Parameters<typeof loadEnvFiles>[1]): {
    result: "skipped";
    loaded: any;
} | {
    loaded: string[];
    env: EnvOutput;
    files: string[];
    sensitiveLoadedKeys: string[];
    result: "loaded";
};
/**
 * Get a fresh clone of the system environment with all `@expo/env`-applied
 * mutations reverted to their pre-load values. The result is intended to be
 * passed as the `env` option of `child_process.spawn` / `@expo/spawn-async`
 * when a subprocess should observe the environment as it was before any
 * `.env*` files were loaded — for example, when resolving SDK tooling paths
 * that should not be influenced by project-controlled `.env` values.
 *
 * Allocates lazily: nothing is held until this function is called, and each
 * call returns a new object so callers may mutate it freely.
 *
 * @param systemEnv The env to revert against; defaults to `process.env`.
 */
export declare function getOriginalEnv(systemEnv?: EnvOutput): EnvOutput;
/**
 * Get the pre-load value of a single environment variable as recorded by
 * `@expo/env`. Falls through to the value in `systemEnv` for keys that
 * `@expo/env` never touched. O(1) and allocation-free, intended for read-sites
 * that resolve filesystem paths or executables from a single env var.
 *
 * Honors `EXPO_UNSAFE_DOTENV_KEYS`: keys the caller has explicitly opted into
 * via the escape hatch return their currently loaded value, not the original.
 *
 * @param key The environment variable to read.
 * @param systemEnv The env to read against; defaults to `process.env`.
 */
export declare function getOriginalEnvValue(key: string, systemEnv?: EnvOutput): string | undefined;
/** Log the loaded environment info from the loaded results */
export declare function logLoadedEnv(envInfo: ReturnType<typeof loadEnvFiles>, options?: Parameters<typeof loadEnvFiles>[1]): {
    result: "skipped";
    loaded: any;
} | {
    loaded: string[];
    env: EnvOutput;
    files: string[];
    sensitiveLoadedKeys: string[];
    result: "loaded";
};
/**
 * Get the environment variables without mutating the environment.
 * This returns memoized values unless the `force` property is provided.
 *
 * @deprecated use {@link parseProjectEnv} instead
 */
export declare function get(projectRoot: string, { force, silent, }?: {
    force?: boolean;
    silent?: boolean;
}): {
    env: EnvOutput;
    files: string[];
    sensitiveLoadedKeys: string[];
};
/**
 * Load environment variables from .env files and mutate the current `process.env` with the results.
 *
 * @deprecated use {@link loadProjectEnv} instead
 */
export declare function load(projectRoot: string, options?: {
    force?: boolean;
    silent?: boolean;
}): NodeJS.ProcessEnv;
/**
 * Get a list of all `.env*` files based on the `NODE_ENV` mode.
 * This returns a list of files, in order of highest priority to lowest priority.
 *
 * @deprecated use {@link getEnvFiles} instead
 * @see https://github.com/bkeepers/dotenv/tree/v3.1.4#customizing-rails
 */
export declare function getFiles(mode: string | undefined, { silent }?: {
    silent?: boolean;
}): string[];
/**
 * Parses the contents of a single `.env` file, optionally expanding it immediately.
 */
export declare function parseEnv(contents: string, sourceEnv?: EnvOutput): EnvOutput;

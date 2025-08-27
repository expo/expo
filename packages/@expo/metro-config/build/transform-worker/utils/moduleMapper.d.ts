declare module 'module' {
    namespace Module {
        function _resolveFilename(request: string, parent: {
            id: string;
            filename: string;
            paths: string[];
        } | string | null, isMain?: boolean, options?: {
            paths?: string[];
        }): string;
    }
}
/** Returns a resolver function that given a request to a module returns that module's remapped path. */
export declare const createModuleMapper: () => (request: string) => string | null;
/** Patches `Module._resolveFilename` (usually just does Node resolution) to override some requires and imports
 * @remarks
 * The user's transform worker (or their babel transformer, which is called inside the transform-worker) can
 * import/require any version of metro, metro-*, or @expo/metro-config in theory. But Expo CLI uses a specific
 * version of Metro.
 * It's unsupported to use one version of Metro in Expo CLI but another in the transform worker or babel transformer,
 * and while this *can work* sometimes, it's never correct.
 *
 * When called, this function modifies this Node.js thread's module resolution to redirect all imports for Metro
 * packages or @expo/metro-config to the version that we know is correct.
 *
 * We know the versions we have are correct since we're inside @expo/metro-config in this file.
 *
 * NOTE: Bun also supports overriding `Module._resolveFilename`
 */
export declare const patchNodeModuleResolver: () => void;

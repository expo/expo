interface AndroidMavenRepository {
    url: string;
}
interface IosPod {
    name: string;
    version?: string;
    configurations?: string[];
    modular_headers?: boolean;
    source?: string;
    path?: string;
    podspec?: string;
    testspecs?: string[];
    git?: string;
    branch?: string;
    tag?: string;
    commit?: string;
}
interface ExtraDependencies {
    androidMavenRepos: AndroidMavenRepository[];
    iosPods?: IosPod[];
}
/**
 * Gets the `expo-build-properties` settings from the app config.
 */
export declare function getBuildPropertiesAsync(): Promise<Record<string, any>>;
/**
 * Resolves the extra dependencies from `expo-build-properties` settings.
 */
export declare function resolveExtraDependenciesAsync(): Promise<Partial<ExtraDependencies>>;
export {};

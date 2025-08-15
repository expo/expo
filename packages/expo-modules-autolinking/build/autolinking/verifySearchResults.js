"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySearchResults = verifySearchResults;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Verifies the search results by checking whether there are no duplicates.
 */
async function verifySearchResults(results, options) {
    const { projectRoot } = options;
    async function getHumanReadableDependency(dependency) {
        let version = dependency.version || null;
        if (!version) {
            try {
                const pkgContents = await fs_1.default.promises.readFile(path_1.default.join(dependency.path, 'package.json'), 'utf8');
                const pkg = JSON.parse(pkgContents);
                if (pkg && typeof pkg === 'object' && 'version' in pkg && typeof pkg.version === 'string') {
                    version = pkg.version;
                }
            }
            catch (error) {
                version = null;
            }
        }
        const relative = path_1.default.relative(projectRoot, dependency.originPath);
        return version
            ? `${dependency.name}@${version} (at: ${relative})`
            : `${dependency.name} at: ${relative}`;
    }
    const groups = {
        reactNativeProjectConfig: [],
        searchPaths: [],
        dependencies: [],
        duplicates: [],
    };
    for (const moduleName in results) {
        const revision = results[moduleName];
        if (!revision) {
            continue;
        }
        else if (revision.duplicates?.length) {
            groups.duplicates.push(revision);
        }
        else {
            switch (revision.source) {
                case 2 /* DependencyResolutionSource.RN_CLI_LOCAL */:
                    groups.reactNativeProjectConfig.push(revision);
                    break;
                case 1 /* DependencyResolutionSource.SEARCH_PATH */:
                    groups.searchPaths.push(revision);
                    break;
                case 0 /* DependencyResolutionSource.RECURSIVE_RESOLUTION */:
                    groups.dependencies.push(revision);
                    break;
            }
        }
    }
    if (options.json) {
        console.log(JSON.stringify(groups));
        return;
    }
    if (options.verbose) {
        if (groups.reactNativeProjectConfig.length) {
            console.log(`🔎  Found ${groups.reactNativeProjectConfig.length} modules from React Native project config`);
            for (const revision of groups.reactNativeProjectConfig) {
                console.log(` - ${await getHumanReadableDependency(revision)}`);
            }
        }
        if (groups.searchPaths.length) {
            console.log(`🔎  Found ${groups.searchPaths.length} modules in search paths`);
            for (const revision of groups.searchPaths) {
                console.log(` - ${await getHumanReadableDependency(revision)}`);
            }
        }
        console.log(`🔎  Found ${groups.dependencies.length} modules in dependencies`);
        for (const revision of groups.dependencies) {
            console.log(` - ${await getHumanReadableDependency(revision)}`);
        }
    }
    if (groups.duplicates.length) {
        for (const revision of groups.duplicates) {
            console.warn(`⚠️  Found duplicate installations for ${chalk_1.default.green(revision.name)}`);
            const revisions = [revision, ...(revision.duplicates ?? [])];
            for (let idx = 0; idx < revisions.length; idx++) {
                const prefix = idx !== revisions.length - 1 ? '├─' : '└─';
                const duplicate = revisions[idx];
                console.log(`  ${prefix} ${await getHumanReadableDependency(duplicate)}`);
            }
        }
        console.warn('⚠️  Multiple versions of the same module may introduce some side effects or compatibility issues.\n' +
            `Resolve your dependency issues and deduplicate your dependencies. Learn more: https://expo.fyi/resolving-dependency-issues`);
    }
    else {
        console.log('✅ Everything is fine!');
    }
}
//# sourceMappingURL=verifySearchResults.js.map
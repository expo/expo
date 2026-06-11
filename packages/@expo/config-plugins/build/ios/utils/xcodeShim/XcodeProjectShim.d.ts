/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { XcodeProject as BaconsXcodeProject } from '@bacons/xcode';
import { legacyComment } from './proxies';
type LegacySectionEntry = Record<string, any>;
/**
 * Backwards-compatibility wrapper that exposes the legacy `xcode` package's
 * API surface on top of a `@bacons/xcode` `XcodeProject`. Plugins written
 * against the legacy modResults shape (dict-section accessors, `_comment`
 * siblings, `addToPbx*` helpers, `pbxFile` constructor) continue to work
 * unchanged.
 *
 * @deprecated The shim is a deprecation bridge for the legacy `xcode` package
 * API and will be removed in a future major version of `@expo/config-plugins`.
 * Use `unstable_project` from `@expo/config-plugins` to open a typed
 * `XcodeProject` instead.
 * @internal
 */
export declare class XcodeProjectShim {
    /** Path to the on-disk `project.pbxproj` (legacy field name). */
    filepath: string;
    /** Reference to the underlying `@bacons/xcode` project. */
    readonly bacons: BaconsXcodeProject;
    constructor(filePath: string);
    /** Legacy two-phase init parity. The new library parses in `open()`, so
     *  this is a no-op that returns the shim. */
    parseSync(): this;
    /** Serialize the project back to a pbxproj string. */
    writeSync(): string;
    /**
     * Legacy direct-access namespace: `project.hash.project.objects[ISA][uuid]`.
     * Plugins use this to look up objects without going through the typed
     * accessors. We synthesize an ISA-keyed dict that resolves on access.
     */
    get hash(): {
        project: {
            objects: Record<string, Record<string, any>>;
        };
    };
    pbxProjectSection(): LegacySectionEntry;
    pbxNativeTargetSection(): LegacySectionEntry;
    pbxXCBuildConfigurationSection(): LegacySectionEntry;
    pbxXCConfigurationList(): LegacySectionEntry;
    pbxFileReferenceSection(): LegacySectionEntry;
    pbxBuildFileSection(): LegacySectionEntry;
    pbxGroupByName(name: string): any | undefined;
    /** Returns the single resources build phase object, or undefined. */
    pbxResourcesBuildPhaseObj(): any | undefined;
    pbxSourcesBuildPhaseObj(): any | undefined;
    pbxFrameworksBuildPhaseObj(): any | undefined;
    /** Legacy returns `{ uuid, firstProject }` where `firstProject` is the
     *  PBXProject's data. We mirror the shape — most callers destructure
     *  `{ firstProject }` and read `.mainGroup`. */
    getFirstProject(): {
        uuid: string;
        firstProject: any;
    };
    /** Legacy returns `{ uuid, firstTarget }`. */
    getFirstTarget(): {
        uuid: string;
        firstTarget: any;
    } | null;
    /** Find the native target with the given product type (e.g.
     *  `'com.apple.product-type.application'`). Legacy returns
     *  `{ uuid, target }` or null. */
    getTarget(productType: string): {
        uuid: string;
        target: any;
    } | null;
    /** Returns the props view for a PBXGroup with the given UUID, or undefined. */
    getPBXGroupByKey(uuid: string): any | undefined;
    /** Returns the props view for any object with the given UUID *and* ISA. */
    getPBXGroupByKeyAndType(uuid: string, type: string): any | undefined;
    /** True if the given file path is registered as a PBXFileReference. */
    hasFile(filepath: string): any | false;
    get productName(): string;
    /** Generate a fresh UUID. Mirrors the legacy upper-case 24-char hex shape. */
    generateUuid(): string;
    /** Create a new empty PBXGroup and return its UUID. */
    pbxCreateGroup(name: string, _comment: string): string;
    /** Add a build setting to all configurations, or to a single named
     *  configuration if `configName` is provided. */
    addBuildProperty(name: string, value: any, configName?: string): void;
    /**
     * Register a `PBXFileReference` for a legacy-shape `pbxFile` object. The
     * legacy library stores certain fields (`name`, `path`, `sourceTree`) wrapped
     * in literal double-quotes; the new library normalizes them. The shim accepts
     * either form and stores unquoted internally.
     */
    addToPbxFileReferenceSection(file: any): void;
    /**
     * Register a `PBXBuildFile` for a legacy-shape `pbxFile` object. The
     * resulting build file references the previously-added `PBXFileReference`
     * via `file.fileRef`.
     */
    addToPbxBuildFileSection(file: any): void;
    /** Append the just-added build file to the target's resources phase. */
    addToPbxResourcesBuildPhase(file: any): void;
    /** Append the just-added build file to the target's sources phase. */
    addToPbxSourcesBuildPhase(file: any): void;
    private appendToBuildPhase;
    /**
     * Convenience: link a framework (e.g. `'StoreKit.framework'`) to the target
     * whose UUID is `opts.target`. Mirrors the legacy library's `addFramework`
     * just enough to satisfy our callers — option flags like `customFramework`,
     * `weak`, and `embed` are NOT supported by this shim.
     */
    addFramework(framework: string, opts?: {
        target?: string;
    }): void;
}
/** Legacy comment helper re-export so callers that import from the shim
 *  module path can get to it. */
export { legacyComment };

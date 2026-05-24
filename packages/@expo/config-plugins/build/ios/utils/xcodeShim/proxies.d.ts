/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { AbstractObject, XcodeProject as BaconsXcodeProject } from '@bacons/xcode';
/**
 * Wraps a `@bacons/xcode` `BuildSettings` map.
 *
 * The new library stores build setting values *unquoted* and applies any
 * needed wrap at serialization. The legacy library let callers store
 * already-quoted strings verbatim — if we let those quoted strings flow
 * through, the new serializer would re-escape them (`"\"X\""`), so we strip
 * the outer quotes on write. Reads pass through unchanged; plugins that
 * compare against `'"X"'` literals will need to use `trimQuotes` after the
 * migration.
 */
export declare function buildSettingsProxy(target: Record<string, any>): Record<string, any>;
/**
 * Wraps a typed `@bacons/xcode` object so its `props` look like the legacy
 * library's section value:
 *   - `isa` is a string (matches old library's behavior).
 *   - `buildSettings` is wrapped with quote translation (when present).
 *   - Reference fields (`buildConfigurationList`, `mainGroup`, etc.) are
 *     unwrapped to UUID strings when the underlying value is an inflated
 *     `AbstractObject` instance.
 *   - Array reference fields (`children`, `files`, `dependencies`,
 *     `buildConfigurations`) are exposed as `[{value, comment}, ...]` arrays
 *     with mutating semantics (push/splice/etc.) that write back through to
 *     the typed UUID array on the underlying object.
 */
export declare function wrappedProps(abstractObject: AbstractObject<any>, baconsProject: BaconsXcodeProject): Record<string, any>;
/**
 * Wraps an array of typed `AbstractObject` references (e.g.
 * `XCConfigurationList.props.buildConfigurations`) so it looks like the legacy
 * library's `[{value: uuid, comment: name}, ...]` shape. Mutating methods
 * (push/splice) accept either the legacy `{value, comment}` shape or a UUID
 * string and write back to the underlying typed array.
 */
export declare function referenceListProxy(underlying: AbstractObject<any>[], baconsProject: BaconsXcodeProject): {
    value: string;
    comment?: string;
}[];
/** Best-effort legacy `comment` for a typed object — used for the
 *  `{value, comment}` array shape and for `_comment` sibling keys in section
 *  dicts. */
export declare function legacyComment(obj: AbstractObject<any>): string | undefined;
/**
 * Builds a dict-section view over a `@bacons/xcode` project for a given ISA
 * filter. Result has the legacy shape `{uuid: props, uuid_comment: name, ...}`.
 * Mutations to a section value's `props` (via the wrapper) write through.
 * Adding new entries via direct assignment is intentionally NOT supported —
 * plugins should use the `addTo*` helpers on the shim instead.
 *
 * An optional `compare` function controls iteration order. We use this for
 * `XCBuildConfiguration` / `XCConfigurationList` so target-associated entries
 * come before project-associated ones — matching the typical Xcode-file
 * convention plugins rely on when indexing into the section.
 */
export declare function sectionProxy(baconsProject: BaconsXcodeProject, isPredicate: (obj: AbstractObject<any>) => boolean, compare?: (a: AbstractObject<any>, b: AbstractObject<any>) => number): Record<string, any>;

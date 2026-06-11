/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { AbstractObject, XcodeProject as BaconsXcodeProject } from '@bacons/xcode';

import { safeGetObject } from './lookup';
import { unquoteForWrite } from './quotes';

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
export function buildSettingsProxy(target: Record<string, any>): Record<string, any> {
  return new Proxy(target, {
    set(obj, key, value) {
      if (typeof key !== 'string') return Reflect.set(obj, key, value);
      obj[key] = unquoteForWrite(value);
      return true;
    },
  });
}

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
export function wrappedProps(
  abstractObject: AbstractObject<any>,
  baconsProject: BaconsXcodeProject
): Record<string, any> {
  return wrapPropsObject(abstractObject.props as Record<string, any>, baconsProject);
}

/**
 * Recursively Proxy-wraps a plain object so:
 *   - Inflated `AbstractObject` children are exposed by UUID (legacy shape).
 *   - Reference arrays become `[{value, comment}, ...]`.
 *   - `buildSettings` reads pass through but writes strip outer quotes.
 *   - Any *other* nested plain-object writes also strip outer quotes from
 *     string values (e.g. `attributes.TargetAttributes[id].DevelopmentTeam`),
 *     preventing the new serializer from re-escaping them.
 */
function wrapPropsObject(
  props: Record<string, any>,
  baconsProject: BaconsXcodeProject
): Record<string, any> {
  return new Proxy(props, {
    get(obj, key) {
      if (typeof key !== 'string') return Reflect.get(obj, key);
      const value = obj[key];
      if (key === 'buildSettings' && value && typeof value === 'object') {
        return buildSettingsProxy(value);
      }
      // Inflated `AbstractObject` -> expose its UUID like the legacy library.
      if (value && typeof value === 'object' && 'uuid' in value && 'props' in value) {
        return value.uuid;
      }
      // Array of references -> expose as `[{value, comment}, ...]`. Use a
      // field-name whitelist so empty arrays still get wrapped (otherwise
      // newly-created groups with `children: []` would let raw
      // `{value, comment}` push through to the typed array, breaking the
      // serializer).
      if (Array.isArray(value) && (REFERENCE_LIST_FIELDS.has(key) || isReferenceArray(value))) {
        return referenceListProxy(value, baconsProject);
      }
      // Recurse into plain nested objects (e.g. `attributes`, `TargetAttributes`).
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return wrapPropsObject(value, baconsProject);
      }
      return value;
    },
    set(obj, key, value) {
      if (typeof key !== 'string') return Reflect.set(obj, key, value);
      // If the underlying field is a reference to an `AbstractObject`, accept
      // a UUID string and resolve it to the object.
      const existing = obj[key];
      if (
        existing &&
        typeof existing === 'object' &&
        'uuid' in existing &&
        typeof value === 'string'
      ) {
        const resolved = safeGetObject(baconsProject, value);
        if (resolved) {
          obj[key] = resolved;
          return true;
        }
      }
      // Strip outer quotes from incoming string values so the new serializer
      // doesn't double-encode them. `unquoteForWrite` is a no-op for unquoted
      // values.
      obj[key] = typeof value === 'string' ? unquoteForWrite(value) : value;
      return true;
    },
  });
}

function isReferenceArray(arr: any[]): boolean {
  return arr.length > 0 && arr.every((v) => v && typeof v === 'object' && 'uuid' in v);
}

/**
 * Field names that the new library models as arrays of typed object references
 * but the legacy library exposes as `{value, comment}[]` arrays. Always wrapped
 * in a `referenceListProxy` on access, regardless of array contents — this
 * matters for newly-created or empty arrays where content sniffing fails.
 */
const REFERENCE_LIST_FIELDS = new Set<string>([
  // PBXGroup / PBXVariantGroup / XCVersionGroup
  'children',
  // AbstractBuildPhase
  'files',
  // PBXProject
  'targets',
  'packageReferences',
  // XCConfigurationList
  'buildConfigurations',
  // PBXNativeTarget
  'buildPhases',
  'dependencies',
  'packageProductDependencies',
  'buildRules',
  // PBXFileSystemSynchronizedRootGroup
  'exceptions',
]);

/**
 * Wraps an array of typed `AbstractObject` references (e.g.
 * `XCConfigurationList.props.buildConfigurations`) so it looks like the legacy
 * library's `[{value: uuid, comment: name}, ...]` shape. Mutating methods
 * (push/splice) accept either the legacy `{value, comment}` shape or a UUID
 * string and write back to the underlying typed array.
 */
export function referenceListProxy(
  underlying: AbstractObject<any>[],
  baconsProject: BaconsXcodeProject
): { value: string; comment?: string }[] {
  const view = underlying.map(toLegacyRef);

  return new Proxy(view, {
    get(arr, key) {
      if (key === 'push') {
        return (...items: any[]) => {
          for (const item of items) {
            const obj = legacyRefToObject(item, baconsProject);
            if (obj) {
              underlying.push(obj);
              arr.push(toLegacyRef(obj));
            }
          }
          return arr.length;
        };
      }
      if (key === 'splice') {
        return (start: number, deleteCount: number, ...newItems: any[]) => {
          const resolved = newItems
            .map((i) => legacyRefToObject(i, baconsProject))
            .filter((o): o is AbstractObject<any> => o !== null);
          underlying.splice(start, deleteCount, ...resolved);
          return arr.splice(start, deleteCount, ...resolved.map(toLegacyRef));
        };
      }
      return Reflect.get(arr, key);
    },
  });
}

function toLegacyRef(obj: AbstractObject<any>): { value: string; comment?: string } {
  const comment = legacyComment(obj);
  return comment != null ? { value: obj.uuid, comment } : { value: obj.uuid };
}

function legacyRefToObject(
  ref: any,
  baconsProject: BaconsXcodeProject
): AbstractObject<any> | null {
  if (!ref) return null;
  if (typeof ref === 'string') return safeGetObject(baconsProject, ref) ?? null;
  if (typeof ref === 'object' && typeof ref.value === 'string') {
    return safeGetObject(baconsProject, ref.value) ?? null;
  }
  return null;
}

/** Best-effort legacy `comment` for a typed object — used for the
 *  `{value, comment}` array shape and for `_comment` sibling keys in section
 *  dicts. */
export function legacyComment(obj: AbstractObject<any>): string | undefined {
  const props = obj.props as Record<string, any>;
  if (typeof props.name === 'string') return props.name;
  if (typeof props.path === 'string') return props.path;
  return undefined;
}

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
export function sectionProxy(
  baconsProject: BaconsXcodeProject,
  isPredicate: (obj: AbstractObject<any>) => boolean,
  compare?: (a: AbstractObject<any>, b: AbstractObject<any>) => number
): Record<string, any> {
  const objects: AbstractObject<any>[] = [];
  for (const obj of baconsProject.values()) {
    if (isPredicate(obj)) objects.push(obj);
  }
  if (compare) objects.sort(compare);

  const entries: Record<string, any> = {};
  for (const obj of objects) {
    entries[obj.uuid] = wrappedProps(obj, baconsProject);
    const cmt = legacyComment(obj);
    if (cmt != null) {
      entries[`${obj.uuid}_comment`] = cmt;
    }
  }
  return entries;
}

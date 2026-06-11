"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XcodeProjectShim = void 0;
Object.defineProperty(exports, "legacyComment", {
  enumerable: true,
  get: function () {
    return _proxies().legacyComment;
  }
});
function _xcode() {
  const data = require("@bacons/xcode");
  _xcode = function () {
    return data;
  };
  return data;
}
function _json() {
  const data = require("@bacons/xcode/json");
  _json = function () {
    return data;
  };
  return data;
}
function _lookup() {
  const data = require("./lookup");
  _lookup = function () {
    return data;
  };
  return data;
}
function _proxies() {
  const data = require("./proxies");
  _proxies = function () {
    return data;
  };
  return data;
}
function _quotes() {
  const data = require("./quotes");
  _quotes = function () {
    return data;
  };
  return data;
}
/**
 * Copyright © 2023-present 650 Industries, Inc. (aka Expo)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
class XcodeProjectShim {
  /** Path to the on-disk `project.pbxproj` (legacy field name). */

  /** Reference to the underlying `@bacons/xcode` project. */

  constructor(filePath) {
    this.filepath = filePath;
    this.bacons = _xcode().XcodeProject.open(filePath);
  }

  /** Legacy two-phase init parity. The new library parses in `open()`, so
   *  this is a no-op that returns the shim. */
  parseSync() {
    return this;
  }

  /** Serialize the project back to a pbxproj string. */
  writeSync() {
    return (0, _json().build)(this.bacons.toJSON());
  }

  /**
   * Legacy direct-access namespace: `project.hash.project.objects[ISA][uuid]`.
   * Plugins use this to look up objects without going through the typed
   * accessors. We synthesize an ISA-keyed dict that resolves on access.
   */
  get hash() {
    const bacons = this.bacons;
    const objects = new Proxy({}, {
      get(_target, isa) {
        if (typeof isa !== 'string') return undefined;
        return (0, _proxies().sectionProxy)(bacons, o => o.isa === isa);
      }
    });
    return {
      project: {
        objects
      }
    };
  }

  // ------------------------------------------------------------------
  // Section accessors — each returns `{uuid: props, uuid_comment: name, ...}`.
  // ------------------------------------------------------------------

  pbxProjectSection() {
    return (0, _proxies().sectionProxy)(this.bacons, o => o instanceof _xcode().PBXProject);
  }
  pbxNativeTargetSection() {
    return (0, _proxies().sectionProxy)(this.bacons, o => o instanceof _xcode().PBXNativeTarget);
  }
  pbxXCBuildConfigurationSection() {
    return (0, _proxies().sectionProxy)(this.bacons, o => o instanceof _xcode().XCBuildConfiguration, compareByTargetAssociation(this.bacons));
  }
  pbxXCConfigurationList() {
    return (0, _proxies().sectionProxy)(this.bacons, o => o instanceof _xcode().XCConfigurationList, compareByTargetAssociation(this.bacons));
  }
  pbxFileReferenceSection() {
    return (0, _proxies().sectionProxy)(this.bacons, o => o instanceof _xcode().PBXFileReference);
  }
  pbxBuildFileSection() {
    return (0, _proxies().sectionProxy)(this.bacons, o => o instanceof _xcode().PBXBuildFile);
  }
  pbxGroupByName(name) {
    for (const obj of this.bacons.values()) {
      if (obj instanceof _xcode().PBXGroup && obj.props.name === name) {
        return (0, _proxies().wrappedProps)(obj, this.bacons);
      }
    }
    return undefined;
  }

  /** Returns the single resources build phase object, or undefined. */
  pbxResourcesBuildPhaseObj() {
    return firstBuildPhase(this.bacons, _xcode().PBXResourcesBuildPhase);
  }
  pbxSourcesBuildPhaseObj() {
    return firstBuildPhase(this.bacons, _xcode().PBXSourcesBuildPhase);
  }
  pbxFrameworksBuildPhaseObj() {
    return firstBuildPhase(this.bacons, _xcode().PBXFrameworksBuildPhase);
  }

  // ------------------------------------------------------------------
  // Query
  // ------------------------------------------------------------------

  /** Legacy returns `{ uuid, firstProject }` where `firstProject` is the
   *  PBXProject's data. We mirror the shape — most callers destructure
   *  `{ firstProject }` and read `.mainGroup`. */
  getFirstProject() {
    const root = this.bacons.rootObject;
    return {
      uuid: root.uuid,
      firstProject: (0, _proxies().wrappedProps)(root, this.bacons)
    };
  }

  /** Legacy returns `{ uuid, firstTarget }`. */
  getFirstTarget() {
    const targets = this.bacons.rootObject.props.targets;
    if (!targets || targets.length === 0) return null;
    const first = targets[0];
    return {
      uuid: first.uuid,
      firstTarget: (0, _proxies().wrappedProps)(first, this.bacons)
    };
  }

  /** Find the native target with the given product type (e.g.
   *  `'com.apple.product-type.application'`). Legacy returns
   *  `{ uuid, target }` or null. */
  getTarget(productType) {
    for (const obj of this.bacons.values()) {
      if (obj instanceof _xcode().PBXNativeTarget && trim(obj.props.productType) === productType) {
        return {
          uuid: obj.uuid,
          target: (0, _proxies().wrappedProps)(obj, this.bacons)
        };
      }
    }
    return null;
  }

  /** Returns the props view for a PBXGroup with the given UUID, or undefined. */
  getPBXGroupByKey(uuid) {
    const obj = (0, _lookup().safeGetObject)(this.bacons, uuid);
    if (obj instanceof _xcode().PBXGroup) return (0, _proxies().wrappedProps)(obj, this.bacons);
    return undefined;
  }

  /** Returns the props view for any object with the given UUID *and* ISA. */
  getPBXGroupByKeyAndType(uuid, type) {
    const obj = (0, _lookup().safeGetObject)(this.bacons, uuid);
    if (obj && obj.isa === type) return (0, _proxies().wrappedProps)(obj, this.bacons);
    return undefined;
  }

  /** True if the given file path is registered as a PBXFileReference. */
  hasFile(filepath) {
    for (const obj of this.bacons.values()) {
      if (obj instanceof _xcode().PBXFileReference) {
        const objPath = obj.props.path;
        if (typeof objPath === 'string' && trim(objPath) === filepath) {
          return (0, _proxies().wrappedProps)(obj, this.bacons);
        }
      }
    }
    return false;
  }
  get productName() {
    // Mirror legacy semantics: usually `$(TARGET_NAME)`, callers fall back
    // through `getFirstTarget()?.firstTarget?.productName`.
    const first = this.getFirstTarget();
    const productName = first?.firstTarget?.productName;
    if (typeof productName === 'string' && productName.length > 0) {
      return productName;
    }
    return '$(TARGET_NAME)';
  }

  // ------------------------------------------------------------------
  // Mutation
  // ------------------------------------------------------------------

  /** Generate a fresh UUID. Mirrors the legacy upper-case 24-char hex shape. */
  generateUuid() {
    let id = '';
    do {
      id = '';
      for (let i = 0; i < 24; i++) {
        id += '0123456789ABCDEF'[Math.floor(Math.random() * 16)];
      }
    } while (this.bacons.has(id));
    return id;
  }

  /** Create a new empty PBXGroup and return its UUID. */
  pbxCreateGroup(name, _comment) {
    const group = _xcode().PBXGroup.create(this.bacons, {
      name,
      sourceTree: '<group>',
      children: []
    });
    return group.uuid;
  }

  /** Add a build setting to all configurations, or to a single named
   *  configuration if `configName` is provided. */
  addBuildProperty(name, value, configName) {
    for (const obj of this.bacons.values()) {
      if (!(obj instanceof _xcode().XCBuildConfiguration)) continue;
      if (configName && obj.props.name !== configName) continue;
      obj.props.buildSettings = obj.props.buildSettings ?? {};
      obj.props.buildSettings[name] = (0, _quotes().unquoteForWrite)(value);
    }
  }

  /**
   * Register a `PBXFileReference` for a legacy-shape `pbxFile` object. The
   * legacy library stores certain fields (`name`, `path`, `sourceTree`) wrapped
   * in literal double-quotes; the new library normalizes them. The shim accepts
   * either form and stores unquoted internally.
   */
  addToPbxFileReferenceSection(file) {
    const props = {
      isa: 'PBXFileReference'
    };
    if (file.lastKnownFileType !== undefined) {
      props.lastKnownFileType = stripQuotes(file.lastKnownFileType);
    }
    if (file.explicitFileType !== undefined) {
      props.explicitFileType = stripQuotes(file.explicitFileType);
    }
    if (file.fileEncoding !== undefined) {
      props.fileEncoding = file.fileEncoding;
    }
    if (file.includeInIndex !== undefined) {
      props.includeInIndex = file.includeInIndex;
    }
    if (file.basename !== undefined) {
      props.name = stripQuotes(file.basename);
    }
    if (file.path !== undefined) {
      props.path = stripQuotes(file.path);
    }
    if (file.sourceTree !== undefined) {
      props.sourceTree = stripQuotes(file.sourceTree);
    }
    const model = this.bacons.createObject(file.fileRef, props);
    this.bacons.set(file.fileRef, model);
  }

  /**
   * Register a `PBXBuildFile` for a legacy-shape `pbxFile` object. The
   * resulting build file references the previously-added `PBXFileReference`
   * via `file.fileRef`.
   */
  addToPbxBuildFileSection(file) {
    const fileRef = this.bacons.getObject(file.fileRef);
    if (!fileRef) {
      throw new Error(`Cannot add a PBXBuildFile referencing ${file.fileRef} — its PBXFileReference was not registered. Call addToPbxFileReferenceSection first.`);
    }
    const model = this.bacons.createObject(file.uuid, {
      isa: 'PBXBuildFile',
      fileRef
    });
    this.bacons.set(file.uuid, model);
  }

  /** Append the just-added build file to the target's resources phase. */
  addToPbxResourcesBuildPhase(file) {
    this.appendToBuildPhase(file, 'resources');
  }

  /** Append the just-added build file to the target's sources phase. */
  addToPbxSourcesBuildPhase(file) {
    this.appendToBuildPhase(file, 'sources');
  }
  appendToBuildPhase(file, kind) {
    const target = file.target ? (0, _lookup().safeGetObject)(this.bacons, file.target) : null;
    const targets = target ? target instanceof _xcode().PBXNativeTarget ? [target] : [] : [...this.bacons.values()].filter(o => o instanceof _xcode().PBXNativeTarget);

    // The legacy library blindly appended `file.uuid` to the phase's files
    // array even when no PBXBuildFile had been registered for it (typically
    // because the caller passed `isBuildFile: false`). The new library's
    // typed phase needs a real PBXBuildFile instance, so we silently skip the
    // append in that case — the resulting pbxproj is more consistent than the
    // legacy dangling-reference behavior would have been.
    const buildFile = (0, _lookup().safeGetObject)(this.bacons, file.uuid);
    if (!buildFile) return;
    for (const t of targets) {
      const phase = kind === 'resources' ? t.getResourcesBuildPhase() : kind === 'sources' ? t.getSourcesBuildPhase() : t.getFrameworksBuildPhase();
      phase.props.files = phase.props.files ?? [];
      phase.props.files.push(buildFile);
    }
  }

  /**
   * Convenience: link a framework (e.g. `'StoreKit.framework'`) to the target
   * whose UUID is `opts.target`. Mirrors the legacy library's `addFramework`
   * just enough to satisfy our callers — option flags like `customFramework`,
   * `weak`, and `embed` are NOT supported by this shim.
   */
  addFramework(framework, opts = {}) {
    const target = opts.target ? (0, _lookup().safeGetObject)(this.bacons, opts.target) : null;
    if (target instanceof _xcode().PBXNativeTarget) {
      target.ensureFrameworks([framework]);
    } else {
      const apps = [...this.bacons.values()].filter(o => o instanceof _xcode().PBXNativeTarget);
      for (const t of apps) {
        t.ensureFrameworks([framework]);
        break; // first target only, matches legacy semantics
      }
    }
  }
}
exports.XcodeProjectShim = XcodeProjectShim;
function firstBuildPhase(project, ctor) {
  for (const obj of project.values()) {
    if (obj instanceof ctor) {
      return (0, _proxies().wrappedProps)(obj, project);
    }
  }
  return undefined;
}
function trim(value) {
  if (typeof value !== 'string') return value;
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
function stripQuotes(value) {
  return trim(value);
}

/**
 * Comparator that orders `XCBuildConfiguration` / `XCConfigurationList` so
 * entries associated with a native target come before entries associated with
 * the project. Within each group entries are sorted by name, matching the
 * typical Debug-then-Release order pbxproj files use. Plugins that index into
 * `pbxXCBuildConfigurationSection()` by position (e.g. `[0]`) historically
 * relied on the legacy library's file-order iteration, which put target
 * configs first.
 */
function compareByTargetAssociation(project) {
  // Pre-compute the set of UUIDs reachable from native targets (their
  // XCConfigurationList and that list's XCBuildConfigurations).
  const targetAssociated = new Set();
  for (const obj of project.values()) {
    if (!(obj instanceof _xcode().PBXNativeTarget)) continue;
    const list = obj.props.buildConfigurationList;
    if (list && typeof list === 'object' && 'uuid' in list) {
      targetAssociated.add(list.uuid);
      const configs = list.props.buildConfigurations;
      if (Array.isArray(configs)) {
        for (const c of configs) {
          if (c && typeof c === 'object' && 'uuid' in c) targetAssociated.add(c.uuid);
        }
      }
    }
  }
  return (a, b) => {
    const aTargeted = targetAssociated.has(a.uuid) ? 0 : 1;
    const bTargeted = targetAssociated.has(b.uuid) ? 0 : 1;
    if (aTargeted !== bTargeted) return aTargeted - bTargeted;
    // Within the same group, order by `name` if available (Debug < Release).
    const aName = a.props.name ?? '';
    const bName = b.props.name ?? '';
    if (aName !== bName) return aName < bName ? -1 : 1;
    return a.uuid < b.uuid ? -1 : 1;
  };
}

/** Legacy comment helper re-export so callers that import from the shim
 *  module path can get to it. */
//# sourceMappingURL=XcodeProjectShim.js.map
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.callSiteToString = callSiteToString;
exports.installSourceMapStackTrace = installSourceMapStackTrace;
function nodeModule() {
  const data = _interopRequireWildcard(require("node:module"));
  nodeModule = function () {
    return data;
  };
  return data;
}
function _nodeUrl() {
  const data = _interopRequireDefault(require("node:url"));
  _nodeUrl = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// MIT License, Copyright (c) 2014 Evan Wallace
// Derived from: https://github.com/evanw/node-source-map-support/blob/7b5b81e/source-map-support.js

let stackTraceInstalled = false;

/**
 * Install a JS-level `Error.prepareStackTrace` that symbolicates frames using Node's
 * source map cache (`module.findSourceMap`). Idempotent — calling more than once is a no-op.
 *
 * Background: Node's automatic stack symbolication is gated on source maps being enabled.
 * `compileModule` toggles source maps on only during `_compile` (to keep the cache scoped
 * to our bundles rather than every `require()`'d package), so by the time an error from
 * the bundle is formatted, automatic symbolication is off. This shim restores it.
 *
 * Implementation closely follows
 * https://github.com/evanw/node-source-map-support/blob/master/source-map-support.js,
 * the canonical reference for this kind of `prepareStackTrace` shim:
 *
 *   - Source-mapped frames are wrapped in cloned plain-object call sites that override
 *     `getFileName`, `getLineNumber`, `getColumnNumber`, `getFunctionName`,
 *     `getScriptNameOrSourceURL`, and `toString`. V8's native
 *     `CallSite.prototype.toString` is implemented in C++ and reads internal slots
 *     directly, ignoring overridden JS getters; so we reimplement `toString` in JS
 *     (`callSiteToString`) on the clone, which consults the overridden getters.
 *
 *   - The stack is processed in reverse so we can use the source map's `name` from the
 *     *next* frame (the caller side) when overriding the *current* frame's function
 *     name. Source map V3's `name` at a position identifies the symbol being *called*
 *     at that position — i.e. the function whose body lives at the next-out frame —
 *     which is more accurate than V8's `getFunctionName()` for that frame.
 *
 *   - Non-source-mapped frames pass through unchanged; their native
 *     `CallSite.prototype.toString` is invoked via template-literal coercion in
 *     `prepareStackTrace`. This preserves V8's canonical formatting for every frame
 *     variant we don't symbolicate (top-level `at file:line:col`, `at TypeName.method`,
 *     `at new Class`, `at fn [as alias]`, native frames, eval frames, etc.).
 */
function installSourceMapStackTrace() {
  if (stackTraceInstalled) {
    return;
  } else {
    stackTraceInstalled = true;
  }
  Error.prepareStackTrace = (error, callSites) => {
    const errorString = formatErrorHeader(error);
    if (callSites.length === 0) {
      return errorString;
    }
    const state = {
      nextPosition: null,
      curPosition: null
    };
    const lines = [];
    for (let i = callSites.length - 1; i >= 0; i--) {
      lines.push('\n    at ' + wrapCallSite(callSites[i], state));
      state.nextPosition = state.curPosition;
    }
    lines.reverse();
    return errorString + lines.join('');
  };
}
function formatErrorHeader(error) {
  // Match V8's default `Error.prototype.toString` semantics. We can't call it directly
  // because `error` may not actually be an Error instance.
  const name = error?.name === undefined ? 'Error' : String(error.name);
  const message = error?.message === undefined ? '' : String(error.message);
  if (!name) return message;
  if (!message) return name;
  return `${name}: ${message}`;
}
function wrapCallSite(site, state) {
  if (site.isNative()) {
    state.curPosition = null;
    return String(site);
  }

  // Most call sites surface their script identity via `getFileName()`. Code passed to
  // `eval()` (or otherwise compiled with a `//# sourceURL=...` directive) only exposes
  // it via `getScriptNameOrSourceURL()` — falling through to that catches those cases.
  const scriptName = site.getFileName() ?? site.getScriptNameOrSourceURL();
  if (!scriptName) {
    state.curPosition = null;
    return String(site);
  }
  const lineNumber = site.getLineNumber();
  const columnNumber = site.getColumnNumber();
  if (lineNumber == null || columnNumber == null) {
    state.curPosition = null;
    return String(site);
  }
  const sm = nodeModule().findSourceMap(scriptName);
  if (!sm) {
    state.curPosition = null;
    return String(site);
  }
  const entry = sm.findEntry(lineNumber - 1, columnNumber - 1);
  if (!entry || !('originalSource' in entry) || !entry.originalSource) {
    state.curPosition = null;
    return String(site);
  }

  // `originalSource` is a `file://` URL. `fileURLToPath` correctly handles drive letters
  // and percent-encoded characters; a naive `file://` strip would yield `/C:/foo/bar.ts`
  // on Windows.
  const originalSource = entry.originalSource.startsWith('file://') ? _nodeUrl().default.fileURLToPath(entry.originalSource) : entry.originalSource;

  // Node's runtime exposes a `name` field on the source map entry even though
  // `@types/node` omits it from `SourceMapping`. Read it defensively.
  const mappedName = entry.name ?? null;
  const position = {
    source: originalSource,
    line: entry.originalLine + 1,
    column: entry.originalColumn + 1,
    name: mappedName
  };
  state.curPosition = position;

  // Build a wrapped call site whose JS getters and `toString` agree on the mapped
  // position. The function-name override consults `state.nextPosition` first because
  // a source map's `name` at a position names the symbol being *called*, which lives
  // one frame outward.
  const wrapped = cloneCallSite(site);
  const originalGetFunctionName = wrapped.getFunctionName;
  wrapped.getFunctionName = function () {
    const nameFromNext = state.nextPosition?.name;
    if (nameFromNext) return nameFromNext;
    return originalGetFunctionName();
  };
  wrapped.getFileName = () => position.source;
  wrapped.getLineNumber = () => position.line;
  wrapped.getColumnNumber = () => position.column;
  wrapped.getScriptNameOrSourceURL = () => position.source;
  return String(wrapped);
}
function cloneCallSite(site) {
  // We need a plain object whose JS getters mirror the original site's, but whose
  // `toString` we can replace. Subclassing or proxying the native `CallSite` doesn't
  // work: `CallSite.prototype.toString` is implemented in C++ and rejects any receiver
  // that isn't the original V8-tagged object (`Method toString called on incompatible
  // receiver`). The only working approach is to build a plain object that re-exposes
  // the `is*`/`get*` methods (bound to the original) and carries our JS toString.
  const clone = {};
  const proto = Object.getPrototypeOf(site);
  for (const name of Object.getOwnPropertyNames(proto)) {
    const value = site[name];
    if (/^(?:is|get)/.test(name) && typeof value === 'function') {
      clone[name] = value.bind(site);
    } else {
      clone[name] = value;
    }
  }
  clone.toString = callSiteToString;
  return clone;
}

/**
 * V8's `CallSite.prototype.toString`, reimplemented in JS so it consults overridden
 * getters on a cloned call site. Mirrors the C++ implementation in V8's `messages.cc`
 * (which is also what `evanw/node-source-map-support` ports).
 *
 * Exported for tests, which need a working `toString` on mock plain-object call sites
 * (real V8 CallSites have one natively; plain objects don't).
 */
function callSiteToString() {
  let fileLocation = '';
  if (this.isNative()) {
    fileLocation = 'native';
  } else {
    const scriptName = this.getScriptNameOrSourceURL();
    if (!scriptName && this.isEval()) {
      fileLocation = (this.getEvalOrigin() ?? '') + ', ';
    }
    if (scriptName) {
      fileLocation += scriptName;
    } else {
      fileLocation += '<anonymous>';
    }
    const lineNumber = this.getLineNumber();
    if (lineNumber != null) {
      fileLocation += ':' + lineNumber;
      const columnNumber = this.getColumnNumber();
      if (columnNumber) {
        fileLocation += ':' + columnNumber;
      }
    }
  }
  let line = '';
  const functionName = this.getFunctionName();
  let addSuffix = true;
  const isConstructor = this.isConstructor();
  const isMethodCall = !(this.isToplevel() || isConstructor);
  if (isMethodCall) {
    let typeName = this.getTypeName();
    // Older Node versions can return `[object Object]` here; normalize to `null`.
    if (typeName === '[object Object]') {
      typeName = 'null';
    }
    const methodName = this.getMethodName();
    if (functionName) {
      if (typeName && functionName.indexOf(typeName) !== 0) {
        line += typeName + '.';
      }
      line += functionName;
      if (methodName && functionName.indexOf('.' + methodName) !== functionName.length - methodName.length - 1) {
        line += ' [as ' + methodName + ']';
      }
    } else {
      line += typeName + '.' + (methodName ?? '<anonymous>');
    }
  } else if (isConstructor) {
    line += 'new ' + (functionName ?? '<anonymous>');
  } else if (functionName) {
    line += functionName;
  } else {
    line += fileLocation;
    addSuffix = false;
  }
  if (addSuffix) {
    line += ' (' + fileLocation + ')';
  }
  return line;
}
//# sourceMappingURL=stacktrace.js.map
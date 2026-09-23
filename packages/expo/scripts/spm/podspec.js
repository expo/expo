/**
 * The little the SwiftPM plugin reads from a podspec. A podspec is Ruby, and Ruby
 * cannot be read safely without running it, so the plugin never extracts values from
 * one: a misparsed `frameworks` list would ship a wrong link line silently. It only
 * DETECTS that a podspec declares linkage — the module is then asked for a
 * Package.swift — and that its xcconfig passes linker flags, which is worth a warning.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { APPLE_SOURCE_DIRS } = require('./classify');

// CRLF-safe.
const sourceLines = (text) => text.replace(/\r\n/g, '\n').split('\n');

// ---------------------------------------------------------------------------
// Line reading: the podspec body outside `test_spec` blocks, comments stripped
// ---------------------------------------------------------------------------

/**
 * The line with the contents of its string literals blanked out and the indices
 * intact, so nothing quoted is read as code: neither a `#` — Ruby interpolation,
 * most often — as the start of a comment, nor a `do`/`end` as a block.
 */
function codeView(line) {
  // Code units, not code points: `stripComment` slices the ORIGINAL line with an index
  // found here, so blanking an emoji to a single space would cut the line short.
  const chars = line.split('');
  let quote = null;
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (quote == null) {
      if (char === "'" || char === '"') quote = char;
      continue;
    }
    if (char === '\\') {
      chars[i] = ' ';
      if (i + 1 < chars.length) chars[++i] = ' ';
    } else if (char === quote) {
      quote = null;
    } else {
      chars[i] = ' ';
    }
  }
  return chars.join('');
}

function stripComment(line) {
  const hash = codeView(line).indexOf('#');
  return hash < 0 ? line : line.slice(0, hash);
}

const TEST_SPEC_RX = /\.test_spec\b/;
const BLOCK_KEYWORD_RX = /^\s*(?:if|unless|case|while|until|begin|def)\b/;
const countMatches = (text, pattern) => text.match(pattern)?.length ?? 0;

/**
 * What a line opens minus what it closes, counted on the blanked view: an `end` in a
 * string — a `-Wl,--end-group` linker flag, or plain prose — would otherwise close a
 * block a line early and leak the next line out of it.
 */
function blockDelta(line) {
  const code = codeView(line);
  const opened = countMatches(code, /\bdo\b/g) + (BLOCK_KEYWORD_RX.test(code) ? 1 : 0);
  return opened - countMatches(code, /\bend\b/g);
}

/**
 * The lines outside any `test_spec` block, with their line numbers. Depth counting
 * and comment stripping are both approximations, but everything read from a podspec
 * goes through here: a test spec declares what its own test host links, and reporting
 * that as the module's would send the author looking for a declaration it never made.
 */
function* podspecBodyLines(text) {
  let testSpecDepth = 0;
  for (const [index, raw] of sourceLines(text).entries()) {
    const line = stripComment(raw);
    if (testSpecDepth > 0) {
      testSpecDepth += blockDelta(line);
    } else if (TEST_SPEC_RX.test(line)) {
      testSpecDepth = Math.max(blockDelta(line), 0);
    } else {
      yield { number: index + 1, text: line };
    }
  }
}

// ---------------------------------------------------------------------------
// Linkage: presence only, never values
// ---------------------------------------------------------------------------

const LINKAGE_RX = /^\s*\w+\.(?:ios\.)?(?:frameworks|weak_frameworks|libraries)\b/;

/**
 * The first line that looks like a linkage declaration, or null. Heredoc bodies are
 * not told apart from code: a match inside one asks the module for a Package.swift it
 * may not need, which is loud and fixable, whereas telling code from text needs the
 * Ruby parsing this file refuses to do.
 */
function linkageDeclaration(text) {
  for (const line of podspecBodyLines(text)) {
    if (LINKAGE_RX.test(line.text)) return { number: line.number, text: line.text.trim() };
  }
  return null;
}

const XCCONFIG_LINKER_RX = /OTHER_LDFLAGS.*(?:-l\S|-framework\s)/;

/**
 * The first `OTHER_LDFLAGS` line that links something, or null. Unlike a podspec
 * `frameworks` list this is only worth a warning: Swift autolinks the system
 * frameworks and C++ runtime its sources import, and a flag that really is
 * load-bearing fails at link time, where the error is unmissable.
 */
function xcconfigLinkerFlags(text) {
  for (const line of podspecBodyLines(text)) {
    if (XCCONFIG_LINKER_RX.test(line.text)) return { number: line.number, text: line.text.trim() };
  }
  return null;
}

/** Pod names a podspec depends on, ignoring `test_spec` blocks. Text-only. */
function podspecDependencies(text) {
  const deps = [];
  for (const { text: line } of podspecBodyLines(text)) {
    const match = line.match(/\.dependency\s+['"]([^'"]+)['"]/);
    if (match) deps.push(match[1]);
  }
  return deps;
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function podspecsIn(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.podspec'))
      .sort()
      .map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

/**
 * The podspecs describing `podName`: its own file when one carries its name, else
 * every podspec in the directories — a module may name its podspec anything.
 */
function podspecFiles(podName, dirs) {
  for (const dir of dirs) {
    const own = path.join(dir, `${podName}.podspec`);
    if (fs.existsSync(own)) return [own];
  }
  return dirs.flatMap(podspecsIn);
}

/**
 * What the plugin needs from a pod's podspecs: the linkage declaration that makes the
 * module unbuildable without a Package.swift, and the xcconfig linker flags worth a
 * warning. A module with linkage is not emitted at all, so nothing else is reported
 * for it — one diagnostic at a time.
 */
function readPodspecs(podName, dirs) {
  const texts = [];
  for (const file of podspecFiles(podName, dirs)) {
    const text = readText(file);
    if (text == null) continue;
    const declaration = linkageDeclaration(text);
    if (declaration != null) {
      return {
        linkage: { file, line: declaration.number, snippet: declaration.text },
        linkerFlags: null,
      };
    }
    texts.push({ file, text });
  }
  const located = (find) =>
    texts
      .map(({ file, text }) => {
        const found = find(text);
        return found == null ? null : { file, line: found.number, snippet: found.text };
      })
      .find((found) => found != null) ?? null;
  return {
    linkage: null,
    linkerFlags: located(xcconfigLinkerFlags),
  };
}

/**
 * Everything the plugin reads from a pod's podspecs, read once per pod. Linkage is
 * looked for beside the pod and in the module's source directories and root;
 * dependencies are read from every podspec in the pod's own directory, so a pod
 * sharing it with siblings reports theirs too.
 */
function readPodspecFacts({ podName, podspecDir, moduleRoot }) {
  const dirs = [
    podspecDir,
    ...APPLE_SOURCE_DIRS.map((dir) => path.join(moduleRoot, dir)),
    moduleRoot,
  ].filter(Boolean);
  const dependencies = new Set(
    podspecsIn(podspecDir).flatMap((file) => podspecDependencies(readText(file) ?? ''))
  );
  return { ...readPodspecs(podName, dirs), dependencies: [...dependencies] };
}

module.exports = {
  podspecBodyLines,
  podspecDependencies,
  linkageDeclaration,
  xcconfigLinkerFlags,
  readPodspecs,
  readPodspecFacts,
};

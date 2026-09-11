/**
 * Podspec text scanning, shared by the plugin's diagnostics and its manifest
 * generation. A podspec is Ruby, so it is read as text rather than evaluated: only
 * the flat declarations the SwiftPM plugin needs are parsed. Comments are stripped
 * and `test_spec` blocks are skipped, so test-only dependencies and linkage never
 * reach a production target.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/** Everything before an unquoted `#`. Ruby interpolation (`"#{…}"`) stays. */
function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quote != null) {
      if (char === '\\') i++;
      else if (char === quote) quote = null;
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (char === '#') {
      return line.slice(0, i);
    }
  }
  return line;
}

const BLOCK_KEYWORD_RX = /^\s*(?:if|unless|case|while|until|begin|def)\b/;

/** Ruby blocks opened minus blocks closed on a line. */
function blockDelta(line) {
  const opened = (line.match(/\bdo\b/g)?.length ?? 0) + (BLOCK_KEYWORD_RX.test(line) ? 1 : 0);
  return opened - (line.match(/\bend\b/g)?.length ?? 0);
}

function* podspecBodyLines(text) {
  // Block depth, not indentation: a test_spec body is Ruby and may be written flush left.
  let testSpecDepth = 0;
  for (const raw of text.split('\n')) {
    const line = stripComment(raw);
    if (testSpecDepth > 0) {
      testSpecDepth += blockDelta(line);
    } else if (/\.test_spec\b/.test(line)) {
      testSpecDepth = Math.max(blockDelta(line), 0);
    } else {
      yield line;
    }
  }
}

/** The lines rejoined so that a declaration spread over an array literal is one line. */
function* logicalLines(lines) {
  let pending = null;
  for (const line of lines) {
    pending = pending == null ? line : `${pending} ${line.trim()}`;
    const unclosed = (pending.match(/\[/g)?.length ?? 0) - (pending.match(/\]/g)?.length ?? 0);
    if (unclosed > 0) continue;
    yield pending;
    pending = null;
  }
  if (pending != null) yield pending;
}

// `s.frameworks = 'Photos','PhotosUI'`, `s.ios.frameworks = …`, `s.weak_frameworks = …`,
// `s.libraries = 'sqlite3'`. A platform prefix other than `ios` is skipped: the
// generated package is iOS-only, and linking another platform's framework fails.
const LINKAGE_RX =
  /^\s*[A-Za-z_]\w*\.(?:([a-z]+)\.)?(weak_frameworks|frameworks|libraries)\s*=\s*(.+)$/;
const QUOTED_RX = /['"]([^'"]+)['"]/g;
const PLATFORMS_HASH_RX = /^\s*[A-Za-z_]\w*\.platforms\s*=\s*\{([^}]*)\}/m;

/** What a podspec declares that a generated SwiftPM target has to reproduce. */
function parsePodspecDeclarations(text) {
  const frameworks = [];
  const libraries = [];
  const lines = [...podspecBodyLines(text)];
  for (const line of logicalLines(lines)) {
    const [, platform, keyword, values] = line.match(LINKAGE_RX) ?? [];
    if (keyword == null || (platform != null && platform !== 'ios')) continue;
    // SwiftPM has no weak linking, so `weak_frameworks` become ordinary frameworks.
    const collected = keyword === 'libraries' ? libraries : frameworks;
    for (const [, value] of values.matchAll(QUOTED_RX)) collected.push(value);
  }
  const platformsHash = lines.join('\n').match(PLATFORMS_HASH_RX)?.[1];
  return {
    frameworks: [...new Set(frameworks)],
    libraries: [...new Set(libraries)],
    iosDeploymentTarget: platformsHash?.match(/:ios\s*=>\s*['"]([^'"]+)['"]/)?.[1] ?? null,
  };
}

function collectPodspecDeclarations(dirs) {
  const frameworks = [];
  const libraries = [];
  let iosDeploymentTarget = null;
  for (const dir of dirs) {
    let names = [];
    try {
      names = fs.readdirSync(dir).filter((f) => f.endsWith('.podspec'));
    } catch {
      continue;
    }
    for (const name of names.sort()) {
      let text = '';
      try {
        text = fs.readFileSync(path.join(dir, name), 'utf8');
      } catch {
        continue;
      }
      const declared = parsePodspecDeclarations(text);
      frameworks.push(...declared.frameworks);
      libraries.push(...declared.libraries);
      iosDeploymentTarget ??= declared.iosDeploymentTarget;
    }
  }
  return {
    frameworks: [...new Set(frameworks)],
    libraries: [...new Set(libraries)],
    iosDeploymentTarget,
  };
}

/**
 * What the pod's own podspec declares. A module can ship several podspecs — a
 * companion scanner pod, say — and only the one named after the pod describes this
 * target; merging the directories is the fallback for a podspec named otherwise.
 */
function podspecDeclarations(podName, dirs) {
  for (const dir of dirs) {
    const own = path.join(dir, `${podName}.podspec`);
    if (fs.existsSync(own)) return parsePodspecDeclarations(fs.readFileSync(own, 'utf8'));
  }
  return collectPodspecDeclarations(dirs);
}

module.exports = {
  podspecBodyLines,
  parsePodspecDeclarations,
  collectPodspecDeclarations,
  podspecDeclarations,
};

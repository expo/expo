/**
 * The little the SwiftPM plugin reads from a podspec. A podspec is Ruby, and Ruby
 * cannot be read safely without running it, so the plugin does not extract linkage
 * from one: a misparsed `frameworks` list would ship a wrong link line silently.
 * Instead it only DETECTS that a podspec declares linkage (the module is then asked
 * for a Package.swift) and reads the iOS deployment floor when it is written as an
 * exact literal — anything else is refused with a `PodspecSyntaxError`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

class PodspecSyntaxError extends Error {
  constructor({ file, line, snippet, reason }) {
    super(`${file}:${line}: ${reason}`);
    this.name = 'PodspecSyntaxError';
    this.file = file;
    this.line = line;
    this.snippet = snippet;
    this.reason = reason;
  }
}

const syntaxError = (file, line, reason) =>
  new PodspecSyntaxError({ file, line: line.number, snippet: line.text.trim(), reason });

const sourceLines = (text) => text.replace(/\r\n/g, '\n').split('\n');

// ---------------------------------------------------------------------------
// Dependency scanning for diagnostics (warning-only, best effort)
// ---------------------------------------------------------------------------

/**
 * The line with the contents of its string literals blanked out and the indices
 * intact, so a `#` inside a quoted string — Ruby interpolation, most often — is not
 * mistaken for the start of a comment.
 */
function codeView(line) {
  const chars = [...line];
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

function blockDelta(line) {
  const opened = countMatches(line, /\bdo\b/g) + (BLOCK_KEYWORD_RX.test(line) ? 1 : 0);
  return opened - countMatches(line, /\bend\b/g);
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

// ---------------------------------------------------------------------------
// iOS deployment floor: exact literals or an error
// ---------------------------------------------------------------------------

const PLATFORMS_RX = /^\s*\w+\.platforms\s*=\s*(.*)$/;
const DEPLOYMENT_TARGET_RX = /^\s*\w+\.ios\.deployment_target\s*=\s*(.*)$/;
const HASH_PAIR_RX = /^:(\w+)\s*=>\s*(['"])([^'"]*)\2$/;
const LITERAL_RX = /^(['"])([^'"]*)\1$/;
const VERSION_RX = /^\d+(?:\.\d+)*$/;

/** The hash body between the braces, joined across lines. Trailing code is refused. */
function readHashBody(lines, index, file) {
  const line = lines[index];
  let body = line.text.slice(line.text.indexOf('{') + 1);
  let last = index;
  while (!body.includes('}')) {
    last += 1;
    if (last >= lines.length) {
      throw syntaxError(file, line, 'a `platforms` hash that is never closed');
    }
    body += ` ${lines[last].text.trim()}`;
  }
  const close = body.indexOf('}');
  const trailing = body.slice(close + 1).trim();
  if (trailing.length) {
    throw syntaxError(file, line, `\`${trailing}\` after the platforms hash`);
  }
  return { body: body.slice(0, close), last };
}

function iosVersionFromHash(body, line, file) {
  let version = null;
  for (const entry of body.split(',').map((pair) => pair.trim())) {
    if (entry.length === 0) continue;
    const pair = entry.match(HASH_PAIR_RX);
    if (pair == null) {
      throw syntaxError(file, line, `\`${entry}\` where a \`:ios => '16.4'\` pair belongs`);
    }
    const [, platform, , value] = pair;
    if (platform !== 'ios') continue;
    if (version != null) {
      throw syntaxError(file, line, 'two `:ios` keys in one platforms hash');
    }
    version = requireVersion(value, line, file);
  }
  return version;
}

function requireVersion(value, line, file) {
  if (!VERSION_RX.test(value)) {
    throw syntaxError(file, line, `the iOS floor \`${value}\`, which is not a version literal`);
  }
  return value;
}

function compareVersions(one, other) {
  const parts = (version) => version.split('.').map(Number);
  const [left, right] = [parts(one), parts(other)];
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const delta = (left[i] ?? 0) - (right[i] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

/**
 * The iOS floor the podspec declares, or null when it declares none. Only exact
 * literals are read; anything computed is refused rather than guessed at.
 *
 * A `platforms` hash written inside a heredoc would be read as if it were code. That
 * costs a wrong deployment floor — a compile-time error in the module being built —
 * where a heredoc-driven linkage guess would have shipped a wrong link line.
 */
function readIosFloor(text, file) {
  const lines = [...podspecBodyLines(text)];
  const versions = [];
  let platformsLine = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const interpolated = () => {
      if (line.text.includes('#{')) {
        throw syntaxError(
          file,
          line,
          'string interpolation, which the reader cannot resolve without running the podspec'
        );
      }
    };
    const platforms = line.text.match(PLATFORMS_RX);
    if (platforms != null) {
      interpolated();
      if (!platforms[1].trimStart().startsWith('{')) {
        throw syntaxError(
          file,
          line,
          `\`${platforms[1].trim()}\` where a \`{ :ios => '16.4' }\` hash belongs`
        );
      }
      if (platformsLine != null) {
        throw syntaxError(
          file,
          line,
          `a second \`platforms\` assignment (the first is on line ${platformsLine}), so which ` +
            'floor wins depends on Ruby evaluation order'
        );
      }
      platformsLine = line.number;
      const { body, last } = readHashBody(lines, i, file);
      const version = iosVersionFromHash(body, line, file);
      if (version != null) versions.push(version);
      i = last;
      continue;
    }
    const deploymentTarget = line.text.match(DEPLOYMENT_TARGET_RX);
    if (deploymentTarget != null) {
      interpolated();
      const literal = deploymentTarget[1].trim().match(LITERAL_RX);
      if (literal == null) {
        throw syntaxError(
          file,
          line,
          `\`${deploymentTarget[1].trim()}\` where a version literal like '16.4' belongs`
        );
      }
      versions.push(requireVersion(literal[2], line, file));
    }
  }
  // Both forms may appear; the higher one is the floor that actually holds.
  return versions.sort(compareVersions).pop() ?? null;
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

/**
 * The podspecs describing `podName`: its own file when one carries its name, else
 * every podspec in the directories — a module may name its podspec anything.
 */
function podspecFiles(podName, dirs) {
  for (const dir of dirs) {
    const own = path.join(dir, `${podName}.podspec`);
    if (fs.existsSync(own)) return [own];
  }
  return dirs.flatMap((dir) => {
    try {
      return fs
        .readdirSync(dir)
        .filter((name) => name.endsWith('.podspec'))
        .sort()
        .map((name) => path.join(dir, name));
    } catch {
      return [];
    }
  });
}

/**
 * What the plugin needs from a pod's podspecs: the linkage declaration that makes the
 * module unbuildable without a Package.swift, and the iOS floor. A module with linkage
 * is not emitted at all, so its floor is never read — one diagnostic at a time.
 */
function readPodspecs(podName, dirs) {
  const texts = [];
  for (const file of podspecFiles(podName, dirs)) {
    let text = '';
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const declaration = linkageDeclaration(text);
    if (declaration != null) {
      return {
        linkage: { file, line: declaration.number, snippet: declaration.text },
        linkerFlags: null,
        iosDeploymentTarget: null,
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
  const versions = texts
    .map(({ file, text }) => readIosFloor(text, file))
    .filter((version) => version != null);
  return {
    linkage: null,
    linkerFlags: located(xcconfigLinkerFlags),
    iosDeploymentTarget: versions.sort(compareVersions).pop() ?? null,
  };
}

module.exports = {
  PodspecSyntaxError,
  podspecBodyLines,
  linkageDeclaration,
  xcconfigLinkerFlags,
  readIosFloor,
  readPodspecs,
};

import { applyPatch } from 'diff';
import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

const readTemplate = (relativePath: string) =>
  fs.readFileSync(path.join(TEMPLATES_DIR, relativePath), 'utf8');

const interpolate = (contents: string) =>
  contents.replace(/\$\{\{[A-Za-z0-9]+\}\}/g, 'com.example.app');

/** Body of `fun initialize(...) { ... }`, matched by brace depth. */
const initializeBody = (contents: string): string => {
  const start = contents.indexOf('fun initialize(');
  if (start === -1) {
    throw new Error('`fun initialize(` not found — did the declaration get renamed?');
  }
  const open = contents.indexOf('{', contents.indexOf(')', start));
  let depth = 0;
  for (let index = open; index < contents.length; index++) {
    if (contents[index] === '{') depth++;
    if (contents[index] === '}') {
      depth--;
      if (depth === 0) {
        return contents.slice(start, index + 1);
      }
    }
  }
  throw new Error('unbalanced braces in initialize()');
};

/**
 * Embedding a JS bundle in the debug AAR is only half of "run without Metro": `useDevSupport`
 * was hardcoded to `BuildConfig.DEBUG`, so a debug build still went to the packager and
 * red-boxed when it was unreachable. The host needs to be able to opt out.
 */
describe('android templates — dev support override', () => {
  it('lets the host override useDevSupport, defaulting to the debug build config', () => {
    const body = initializeBody(readTemplate('android/ReactNativeHostManager.kt'));

    expect(body).toContain('useDevSupport: Boolean = BuildConfig.DEBUG');
    // The parameter has to reach the factory, not just sit in the signature.
    expect(body).toContain('useDevSupport = useDevSupport');
  });

  it('requires an embedded bundle whenever dev support is off, not just in release', () => {
    const body = initializeBody(readTemplate('android/ReactNativeHostManager.kt'));

    // With `useDevSupport = false` in a debug build the bundle is mandatory, so the existing
    // "cannot find index.android.bundle" guard has to key off dev support rather than DEBUG —
    // otherwise the failure surfaces as an opaque runtime crash instead of a clear message.
    expect(body).toContain('if (!useDevSupport)');
    expect(body).not.toContain('if (!BuildConfig.DEBUG)');
  });

  it('forwards useDevSupport through the Activity entry point', () => {
    const template = readTemplate('android/ReactNativeHostManager.kt');
    const extension = template.slice(template.indexOf('fun Activity.showReactNativeFragment'));

    expect(extension).toContain('useDevSupport');
  });

  it('keeps the dev-menu patches applying to the current templates', () => {
    const pairs: [string, string][] = [
      ['android/ReactNativeHostManager.kt', 'patches/ReactNativeHostManager.patch'],
      ['android/BrownfieldActivity.kt', 'patches/BrownfieldActivity.patch'],
    ];

    for (const [template, patch] of pairs) {
      const patched = applyPatch(interpolate(readTemplate(template)), readTemplate(patch));
      expect(`${patch} applied: ${patched !== false}`).toBe(`${patch} applied: true`);
    }
  });
});

import { applyPatch } from 'diff';
import fs from 'node:fs';
import path from 'node:path';

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

const readTemplate = (relativePath: string) =>
  fs.readFileSync(path.join(TEMPLATES_DIR, relativePath), 'utf8');

/** Templates are emitted through interpolation, so resolve the placeholders first. */
const interpolate = (contents: string) =>
  contents.replace(/\$\{\{[A-Za-z0-9]+\}\}/g, 'com.example.app');

/**
 * Grab the parameter list of `declaration`, spanning newlines. Kotlin templates wrap their
 * signatures, so a single-line match would miss most of them.
 */
const signatureOf = (contents: string, declaration: string): string => {
  const start = contents.indexOf(declaration);
  if (start === -1) {
    throw new Error(`'${declaration}' not found — did the declaration get renamed?`);
  }
  const open = contents.indexOf('(', start);
  let depth = 0;
  for (let index = open; index < contents.length; index++) {
    if (contents[index] === '(') depth++;
    if (contents[index] === ')') {
      depth--;
      if (depth === 0) {
        return contents.slice(start, index + 1);
      }
    }
  }
  throw new Error(`unbalanced parentheses after '${declaration}'`);
};

/**
 * `launchOptions` reaches `ReactDelegate` (and so the root component's initial props) only if
 * every layer above `ReactNativeViewFactory` forwards it. iOS already exposes it on all of its
 * public entry points; these guard the Android side against drifting back out of parity.
 */
describe('android templates — launchOptions', () => {
  it('accepts launchOptions on every public entry point', () => {
    const cases: [string, string][] = [
      ['ReactNativeViewFactory.kt', 'fun createSurface'],
      ['ReactNativeViewFactory.kt', 'fun createFrameLayout'],
      ['ReactNativeFragment.kt', 'fun createFragmentHost'],
      ['ReactNativeFragment.kt', 'fun createAndCommit'],
      ['ReactNativeHostManager.kt', 'fun Activity.showReactNativeFragment'],
      ['BrownfieldActivity.kt', 'fun showReactNativeFragment'],
    ];

    for (const [template, declaration] of cases) {
      const signature = signatureOf(readTemplate(`android/${template}`), declaration);
      expect(`${template} ${declaration}: ${signature}`).toContain('launchOptions: Bundle?');
    }
  });

  it('carries launchOptions in the fragment arguments so it survives recreation', () => {
    const fragment = readTemplate('android/ReactNativeFragment.kt');

    // Written on creation and read back in onCreateView: a fragment recreated by the system
    // (configuration change, process death) rebuilds its surface from `arguments` alone.
    expect(fragment).toContain('putBundle("launchOptions", launchOptions)');
    expect(fragment).toContain('arguments?.getBundle("launchOptions")');
    // And actually handed to the factory rather than read and dropped.
    expect(signatureOf(fragment, 'ReactNativeViewFactory.createSurface')).toContain(
      'launchOptions'
    );
  });

  /**
   * The dev-menu patches encode template lines as context, so a template edit that isn't
   * mirrored in the patch breaks prebuild for every expo-dev-menu user. The patches are applied
   * to the interpolated file in the generated project, so check them the same way.
   */
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

  /**
   * The dev-menu patch replaces the body of `showReactNativeFragment` with its own
   * `createFrameLayout` call. If that call doesn't forward `launchOptions`, the parameter works
   * in release and is silently dropped in debug builds that depend on expo-dev-menu.
   */
  it('forwards launchOptions in the dev-menu patched showReactNativeFragment', () => {
    const template = interpolate(readTemplate('android/ReactNativeHostManager.kt'));
    const patch = readTemplate('patches/ReactNativeHostManager.patch');

    const patched = applyPatch(template, patch);
    expect(patched).not.toBe(false);

    // Both branches of the patched function — dev-menu host and plain fragment host.
    expect(signatureOf(patched as string, 'ReactNativeViewFactory.createFrameLayout')).toContain(
      'launchOptions'
    );
    expect(signatureOf(patched as string, 'ReactNativeFragment.createFragmentHost')).toContain(
      'launchOptions'
    );
  });
});

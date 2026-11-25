import { composeMetroIgnorePatterns } from '../../../../utils/composeMetroIgnorePatterns';
import { withNativeBuildIgnores } from '../withNativeBuildIgnores';

const projectRoot = '/apps/my.app (1)';

function isBlocked(filePath: string, blockList?: RegExp | RegExp[]) {
  return composeMetroIgnorePatterns(withNativeBuildIgnores(blockList, projectRoot)).test(filePath);
}

describe(withNativeBuildIgnores, () => {
  test.each([
    [`${projectRoot}/ios/Pods`],
    [`${projectRoot}/android/app/build`],
    [`${projectRoot}/android/.gradle`],
    // As FallbackWatcher tests paths on Windows, after converting separators
    [`${projectRoot}\\ios\\Pods`],
    [`${projectRoot}/android/app/.cxx`],
    [`${projectRoot}/android/app/.cxx/Debug/compile_commands.json`],
    [`${projectRoot}/node_modules/react-native-reanimated/android/.cxx/Debug/x.json`],
    // Relative to a watched folder, as Metro's watchers test them
    ['node_modules/some-library/android/.cxx/Debug/x.json'],
    ['.cxx/Debug/x.json'],
  ])('blocks %s', (filePath) => {
    expect(isBlocked(filePath)).toBe(true);
  });

  test.each([
    [`${projectRoot}/ios/PodsScreen.tsx`],
    [`${projectRoot}/ios/Pods.js`],
    [`${projectRoot}/myios/Pods`],
    [`${projectRoot}/android/app/build.gradle`],
    [`${projectRoot}/android/app/src/main/build`],
    [`${projectRoot}/node_modules/some-library/example/ios/Pods`],
    [`${projectRoot}/src/.cxxrc.js`],
    ['/apps/myXapp (1)/ios/Pods'],
    ['/apps/other/ios/Pods'],
    ['ios/Pods'],
  ])('does not block %s', (filePath) => {
    expect(isBlocked(filePath)).toBe(false);
  });

  test.each([
    ['no blockList', undefined, []],
    ['a blockList pattern', /\/__tests__\//, [/\/__tests__\//]],
    ['blockList patterns', [/a/, /b/], [/a/, /b/]],
  ])('appends to %s', (_name, blockList, expected) => {
    const result = withNativeBuildIgnores(blockList, projectRoot);
    expect(result.slice(0, -2)).toEqual(expected);
    expect(result).toHaveLength(expected.length + 2);
  });

  test.each([['i'], ['u'], ['v'], ['su']])(
    "copies the user's %s flags, so that Metro can combine them",
    (flags) => {
      const blockList = [new RegExp('\\/__tests__\\/', flags)];
      const result = withNativeBuildIgnores(blockList, projectRoot);
      expect(result.map((re) => re.flags)).toEqual([flags, flags, flags]);
      expect(isBlocked(`${projectRoot}/ios/Pods`, blockList)).toBe(true);
      expect(isBlocked(`${projectRoot}/node_modules/lib/android/.cxx/x.json`, blockList)).toBe(
        true
      );
    }
  );
});

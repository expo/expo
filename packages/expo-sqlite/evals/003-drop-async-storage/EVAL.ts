import { check, score, type Scorer } from '../harness/types';

/**
 * The skill's guidance: expo-sqlite/kv-store is a drop-in AsyncStorage
 * replacement, so removing the dependency should be an import swap — not a
 * hand-rolled key-value table.
 */
const scorer: Scorer = async (ctx) => {
  const settings = ctx.read('src/settings.ts');
  const packageJson = ctx.packageJson();
  const asyncStorageImports = ctx.grep(/@react-native-async-storage\/async-storage/);

  return score([
    check(
      'dependency removed from package.json',
      !packageJson?.dependencies?.['@react-native-async-storage/async-storage']
    ),
    check('no remaining async-storage imports', asyncStorageImports.length === 0),
    check(
      'uses expo-sqlite/kv-store',
      /from ['"]expo-sqlite\/kv-store['"]/.test(settings),
      'the drop-in replacement, not a hand-rolled key-value table'
    ),
    check(
      'settings API preserved',
      ['loadSettingsAsync', 'saveSettingsAsync', 'clearSettingsAsync'].every((name) =>
        settings.includes(name)
      )
    ),
  ]);
};

export default scorer;

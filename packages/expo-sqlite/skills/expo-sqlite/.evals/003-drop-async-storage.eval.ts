import { agentEval, expect } from './eval-kit';

// The skill's guidance: expo-sqlite/kv-store is a drop-in AsyncStorage
// replacement, so removing the dependency should be an import swap — not a
// hand-rolled key-value table.
agentEval(
  import.meta.url,
  {
    title: 'replace async-storage with what expo-sqlite already provides',
    prompt: `We're trimming dependencies. This app already uses expo-sqlite for its notes, but src/settings.ts pulls in @react-native-async-storage/async-storage just for a few key-value settings. Get rid of that extra dependency without changing how settings behave.`,
    seed: {
      fixture: 'notes-settings',
      dependencies: { '@react-native-async-storage/async-storage': '^2.1.0' },
    },
  },
  (check) => {
    check('dependency removed from package.json', (ws) => {
      expect(
        ws.packageJson()?.dependencies?.['@react-native-async-storage/async-storage']
      ).toBeUndefined();
    });

    check('no remaining async-storage imports', (ws) => {
      expect(ws.source()).not.toMatch(/@react-native-async-storage\/async-storage/);
    });

    // The drop-in replacement, not a hand-rolled key-value table.
    check('uses expo-sqlite/kv-store', (ws) => {
      expect(ws.read('src/settings.ts')).toMatch(/from ['"]expo-sqlite\/kv-store['"]/);
    });

    check('settings API preserved', (ws) => {
      const settings = ws.read('src/settings.ts');
      for (const name of ['loadSettingsAsync', 'saveSettingsAsync', 'clearSettingsAsync']) {
        expect(settings).toContain(name);
      }
    });
  }
);

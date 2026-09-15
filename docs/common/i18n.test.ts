import { listJaPages, relKey } from '~/checks/ja/sync';
import {
  JA_TRANSLATED_PATHS,
  getJapaneseSectionTitle,
  getJapaneseSidebarTitle,
  hasJapaneseTranslation,
  isTranslatableSection,
} from '~/common/i18n';

const BUILD_WITH_AI_PAGES = [
  '/tutorial/build-with-ai/introduction',
  '/tutorial/build-with-ai/set-up-your-tools',
  '/tutorial/build-with-ai/create-your-first-app',
  '/tutorial/build-with-ai/build-the-home-screen',
  '/tutorial/build-with-ai/add-stickers',
  '/tutorial/build-with-ai/save-your-creation',
  '/tutorial/build-with-ai/finishing-touches',
];

const EAS_TUTORIAL_PAGES = [
  '/tutorial/eas/introduction',
  '/tutorial/eas/configure-development-build',
  '/tutorial/eas/android-development-build',
  '/tutorial/eas/ios-development-build-for-simulators',
  '/tutorial/eas/ios-development-build-for-devices',
  '/tutorial/eas/multiple-app-variants',
  '/tutorial/eas/internal-distribution-builds',
  '/tutorial/eas/manage-app-versions',
  '/tutorial/eas/android-production-build',
  '/tutorial/eas/ios-production-build',
  '/tutorial/eas/team-development',
  '/tutorial/eas/using-github',
  '/tutorial/eas/next-steps',
];

const CICD_TUTORIAL_PAGES = [
  '/tutorial/cicd/introduction',
  '/tutorial/cicd/first-workflow',
  '/tutorial/cicd/development-builds',
  '/tutorial/cicd/preview-builds',
  '/tutorial/cicd/e2e-tests',
  '/tutorial/cicd/production',
  '/tutorial/cicd/tag-based-releases',
  '/tutorial/cicd/web-deployments',
  '/tutorial/cicd/next-steps',
];

describe('hasJapaneseTranslation', () => {
  it('covers the Expo tutorial', () => {
    expect(hasJapaneseTranslation('/tutorial/overview')).toBe(true);
    expect(hasJapaneseTranslation('/ja/tutorial/overview')).toBe(true);
  });

  it('covers the Build with AI tutorial', () => {
    for (const path of BUILD_WITH_AI_PAGES) {
      expect(hasJapaneseTranslation(path)).toBe(true);
      expect(hasJapaneseTranslation(`/ja${path}`)).toBe(true);
    }
  });

  it('covers the EAS tutorial', () => {
    for (const path of EAS_TUTORIAL_PAGES) {
      expect(hasJapaneseTranslation(path)).toBe(true);
      expect(hasJapaneseTranslation(`/ja${path}`)).toBe(true);
    }
  });

  it('covers the CI/CD tutorial', () => {
    for (const path of CICD_TUTORIAL_PAGES) {
      expect(hasJapaneseTranslation(path)).toBe(true);
      expect(hasJapaneseTranslation(`/ja${path}`)).toBe(true);
    }
  });

  it('excludes sections that are not translated yet', () => {
    expect(hasJapaneseTranslation('/eas/workflows/introduction')).toBe(false);
    expect(hasJapaneseTranslation('/get-started/create-a-project')).toBe(false);
  });
});

describe('isTranslatableSection', () => {
  it('agrees with hasJapaneseTranslation', () => {
    for (const path of [
      ...BUILD_WITH_AI_PAGES,
      ...EAS_TUTORIAL_PAGES,
      ...CICD_TUTORIAL_PAGES,
      '/tutorial/overview',
      '/eas/workflows/introduction',
    ]) {
      expect(isTranslatableSection(path)).toBe(hasJapaneseTranslation(path));
    }
  });
});

describe('getJapaneseSidebarTitle', () => {
  it('returns Japanese titles for the Build with AI tutorial', () => {
    expect(getJapaneseSidebarTitle('/tutorial/build-with-ai/introduction')).toBe('はじめに');
    expect(getJapaneseSidebarTitle('/tutorial/build-with-ai/set-up-your-tools')).toBe(
      'ツールを準備する'
    );
    expect(getJapaneseSidebarTitle('/tutorial/build-with-ai/finishing-touches')).toBe('仕上げ');
  });

  it('has a title for every translated path', () => {
    for (const path of JA_TRANSLATED_PATHS) {
      expect(getJapaneseSidebarTitle(path)).toBeTruthy();
    }
  });
});

describe('getJapaneseSectionTitle', () => {
  it('translates the Build with AI tutorial section', () => {
    expect(getJapaneseSectionTitle('Build with AI tutorial')).toBe(
      'AI エージェントで作るチュートリアル'
    );
  });
});

describe('registered paths and translated files agree', () => {
  const translatedFiles = listJaPages().map(jaPath => `/${relKey(jaPath).replace(/\.mdx$/, '')}`);

  it('scans the translated pages (guards against a vacuous pass)', () => {
    expect(translatedFiles.length).toBeGreaterThan(0);
  });

  it('every translated file is registered', () => {
    const unregistered = translatedFiles.filter(path => !hasJapaneseTranslation(path));
    expect(unregistered).toEqual([]);
  });

  it('every registered path has a translated file', () => {
    const missing = [...JA_TRANSLATED_PATHS].filter(path => !translatedFiles.includes(path));
    expect(missing).toEqual([]);
  });
});

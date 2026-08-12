import enMessages from '~/messages/en.json';
import jaMessages from '~/messages/ja.json';

export type SupportedLocale = 'en' | 'ja';

export const messages: Record<SupportedLocale, Record<string, string>> = {
  en: enMessages,
  ja: jaMessages,
};

export function getLocaleFromPath(path: string): SupportedLocale {
  if (path === '/ja' || path.startsWith('/ja/')) {
    return 'ja';
  }
  return 'en';
}

export function getCanonicalPath(path: string): string {
  if (path === '/ja' || path === '/ja/') {
    return '/';
  }
  let stripped = path.startsWith('/ja/') ? path.slice(3) : path;
  if (stripped !== '/' && stripped.endsWith('/')) {
    stripped = stripped.slice(0, -1);
  }
  return stripped;
}

export function buildLocalePath(currentPath: string, targetLocale: SupportedLocale): string {
  const englishPath = getCanonicalPath(currentPath);
  if (targetLocale === 'en') {
    return englishPath;
  }
  if (englishPath === '/') {
    return '/ja';
  }
  return `/ja${englishPath}`;
}

/**
 * Every page with a Japanese translation, mapped to its Japanese sidebar title.
 *
 * This is the single source of truth: a page is translated when it appears here,
 * and `checks/ja/sync.test.ts` keeps the list and `pages/ja/**` from drifting apart.
 * Keys are English canonical paths, matching the file layout under `pages/ja`.
 */
const JA_TRANSLATED_PAGES: Record<string, string> = {
  '/tutorial/overview': '概要',
  '/tutorial/introduction': 'はじめに',
  '/tutorial/create-your-first-app': '最初のアプリを作成する',
  '/tutorial/add-navigation': 'ナビゲーションを追加する',
  '/tutorial/build-a-screen': '画面を構築する',
  '/tutorial/image-picker': '画像ピッカーを使用する',
  '/tutorial/create-a-modal': 'モーダルを作成する',
  '/tutorial/gestures': 'ジェスチャーを追加する',
  '/tutorial/screenshot': 'スクリーンショットを撮影する',
  '/tutorial/platform-differences': 'プラットフォームの違いに対応する',
  '/tutorial/configuration': 'ステータスバー、スプラッシュスクリーン、アプリアイコンを設定する',
  '/tutorial/follow-up': '学習リソース',
  '/tutorial/build-with-ai/introduction': 'はじめに',
  '/tutorial/build-with-ai/set-up-your-tools': 'ツールを準備する',
  '/tutorial/build-with-ai/create-your-first-app': '最初のアプリを作成する',
  '/tutorial/build-with-ai/build-the-home-screen': 'ホーム画面を構築する',
  '/tutorial/build-with-ai/add-stickers': 'ステッカーを追加する',
  '/tutorial/build-with-ai/save-your-creation': '画像を保存する',
  '/tutorial/build-with-ai/finishing-touches': '仕上げ',
  '/tutorial/cicd/introduction': 'はじめに',
  '/tutorial/cicd/first-workflow': '最初の EAS Workflows ジョブ',
  '/tutorial/cicd/development-builds': '開発ビルド',
  '/tutorial/cicd/preview-builds': 'プレビュービルド',
  '/tutorial/cicd/e2e-tests': 'E2E テスト',
  '/tutorial/cicd/production': '本番デプロイ',
  '/tutorial/cicd/tag-based-releases': 'タグベースのリリース',
  '/tutorial/cicd/web-deployments': 'web デプロイ',
  '/tutorial/cicd/next-steps': '次のステップ',
  '/tutorial/eas/introduction': 'はじめに',
  '/tutorial/eas/configure-development-build': '開発ビルドを設定する',
  '/tutorial/eas/android-development-build': 'Android 開発ビルド',
  '/tutorial/eas/ios-development-build-for-simulators': 'iOS シミュレーター向け開発ビルド',
  '/tutorial/eas/ios-development-build-for-devices': 'iOS 実機向け開発ビルド',
  '/tutorial/eas/multiple-app-variants': '複数のアプリバリアント',
  '/tutorial/eas/internal-distribution-builds': '内部配布ビルド',
  '/tutorial/eas/manage-app-versions': 'アプリバージョンを管理する',
  '/tutorial/eas/android-production-build': 'Android 本番ビルド',
  '/tutorial/eas/ios-production-build': 'iOS 本番ビルド',
  '/tutorial/eas/team-development': 'プレビューを共有する',
  '/tutorial/eas/using-github': 'GitHub からのビルド',
  '/tutorial/eas/next-steps': '次のステップ',
};

export const JA_TRANSLATED_PATHS: ReadonlySet<string> = new Set(Object.keys(JA_TRANSLATED_PAGES));

export function isTranslatableSection(path: string): boolean {
  return JA_TRANSLATED_PATHS.has(getCanonicalPath(path));
}

export function hasJapaneseTranslation(path: string): boolean {
  return JA_TRANSLATED_PATHS.has(getCanonicalPath(path));
}

export function getJapaneseSidebarTitle(path: string): string | undefined {
  return JA_TRANSLATED_PAGES[getCanonicalPath(path)];
}

const JA_SECTION_TITLES: Record<string, string> = {
  'Expo tutorial': 'Expo チュートリアル',
  'Build with AI tutorial': 'AI エージェントで作るチュートリアル',
  'CI/CD tutorial': 'CI/CD チュートリアル',
  'EAS tutorial': 'EAS チュートリアル',
  More: 'その他',
};

export function getJapaneseSectionTitle(name: string): string | undefined {
  return JA_SECTION_TITLES[name];
}

export const OG_LOCALES: Record<SupportedLocale, string> = {
  en: 'en_US',
  ja: 'ja_JP',
};

export const SITE_NAMES: Record<SupportedLocale, string> = {
  en: 'Expo Documentation',
  ja: 'Expo ドキュメント',
};

export const BASE_DESCRIPTIONS: Record<SupportedLocale, string> = {
  en: 'Expo is an open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React.',
  ja: 'Expo は、JavaScript と React を使って Android、iOS、web で動作するユニバーサルネイティブアプリを作るためのオープンソースプラットフォームです。',
};

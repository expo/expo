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

const EXPO_TUTORIAL_PATHS: ReadonlySet<string> = new Set([
  '/tutorial/overview',
  '/tutorial/introduction',
  '/tutorial/create-your-first-app',
  '/tutorial/add-navigation',
  '/tutorial/build-a-screen',
  '/tutorial/image-picker',
  '/tutorial/create-a-modal',
  '/tutorial/gestures',
  '/tutorial/screenshot',
  '/tutorial/platform-differences',
  '/tutorial/configuration',
  '/tutorial/follow-up',
]);

export function isTranslatableSection(path: string): boolean {
  return EXPO_TUTORIAL_PATHS.has(getCanonicalPath(path));
}

const PATHS_WITH_JAPANESE: ReadonlySet<string> = new Set([
  '/tutorial/overview',
  '/tutorial/introduction',
  '/tutorial/create-your-first-app',
  '/tutorial/add-navigation',
  '/tutorial/build-a-screen',
  '/tutorial/image-picker',
  '/tutorial/create-a-modal',
  '/tutorial/gestures',
  '/tutorial/screenshot',
  '/tutorial/platform-differences',
  '/tutorial/configuration',
  '/tutorial/follow-up',
]);

export function hasJapaneseTranslation(path: string): boolean {
  return PATHS_WITH_JAPANESE.has(getCanonicalPath(path));
}

const JA_SIDEBAR_TITLES: Record<string, string> = {
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
};

export function getJapaneseSidebarTitle(path: string): string | undefined {
  return JA_SIDEBAR_TITLES[getCanonicalPath(path)];
}

const JA_SECTION_TITLES: Record<string, string> = {
  'Expo tutorial': 'Expo チュートリアル',
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

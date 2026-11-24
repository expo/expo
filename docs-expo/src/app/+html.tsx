import { THEME_COOKIE_NAME } from '@expo/styleguide';
import { useServerDocumentContext } from 'expo-router/html';
import { useState, type PropsWithChildren, type ReactElement } from 'react';

import { getLocaleFromPath } from '~/common/i18n';
import {
  DEFAULT_PACKAGE_MANAGER,
  PACKAGE_MANAGER_ORDER,
  PACKAGE_MANAGER_STORAGE_KEY,
} from '~/ui/components/Snippet/blocks/packageManagerStore';

import { ServerHeadContext, ServerHeadOutlet } from '../next-compat/head';

// These scripts are the same as in `../docs/pages/_document.tsx`.
const BLOCKING_THEME_SCRIPT = `
(function() {
  function getCookieTheme() {
    var match = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]*)/);
    var val = match && match[1];
    return val === 'dark' || val === 'light' ? val : null;
  }
  var theme = getCookieTheme();
  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark-theme', isDark);
  document.documentElement.classList.toggle('light-theme', !isDark);
})();
`;

const BLOCKING_PACKAGE_MANAGER_SCRIPT = `
(function() {
  var managers = ${JSON.stringify(PACKAGE_MANAGER_ORDER)};
  var stored = null;
  try {
    stored = window.localStorage.getItem('${PACKAGE_MANAGER_STORAGE_KEY}');
  } catch (error) {}
  var active = managers.indexOf(stored) === -1 ? '${DEFAULT_PACKAGE_MANAGER}' : stored;
  document.documentElement.classList.add('pm-' + active);
})();
`;

const BLOCKING_IOS_SCRIPT = `
(function() {
  if (!window.CSS || !CSS.supports('-webkit-touch-callout', 'none')) {
    return;
  }
  document.documentElement.classList.add('ios-webkit');
  function updateScreenHeight() {
    document.documentElement.style.setProperty('--nested-scroll-layout-screen-height', window.outerHeight + 'px');
  }
  updateScreenHeight();
  window.addEventListener('resize', updateScreenHeight);
})();
`;

// The browser makes an element with `id="expo"` available as `window.expo`. The
// `expo-modules-core` web code does not install its `globalThis.expo` object when that name
// already has a value, and then `expo-font` stops with an error. Some pages have a heading
// with that `id`. A global `var` hides the element.
const EXPO_GLOBAL_SCRIPT = 'var expo;';

export default function Root({ children, pathname }: PropsWithChildren<{ pathname?: string }>) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  const [serverHeadNodes] = useState<ReactElement[]>(() => []);

  return (
    <ServerHeadContext.Provider value={serverHeadNodes}>
      <html {...htmlAttributes} lang={getLocaleFromPath(pathname ?? '')} data-expo-theme>
        <head>
          <script dangerouslySetInnerHTML={{ __html: EXPO_GLOBAL_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: BLOCKING_THEME_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: BLOCKING_PACKAGE_MANAGER_SCRIPT }} />
          <script dangerouslySetInnerHTML={{ __html: BLOCKING_IOS_SCRIPT }} />
          {headNodes}
        </head>
        <body {...bodyAttributes} className="text-pretty">
          {children}
          <ServerHeadOutlet />
          {bodyNodes}
        </body>
      </html>
    </ServerHeadContext.Provider>
  );
}

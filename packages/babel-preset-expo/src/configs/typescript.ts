import type { PluginItem } from '@babel/core';

function isTypeScriptSource(fileName: string | undefined | null) {
  return !!fileName && fileName.endsWith('.ts');
}

function isTSXSource(fileName: string | undefined | null) {
  return !!fileName && fileName.endsWith('.tsx');
}

export function getConfig() {
  return {
    overrides: [
      {
        test: isTypeScriptSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: false,
              allowNamespaces: true,
            },
          ],
        ] as PluginItem[],
      },
      {
        test: isTSXSource,
        plugins: [
          [
            require('@babel/plugin-transform-typescript'),
            {
              isTSX: true,
              allowNamespaces: true,
            },
          ],
        ] as PluginItem[],
      },
    ],
  };
}

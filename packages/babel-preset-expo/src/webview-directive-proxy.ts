/**
 * Copyright © 2024 650 Industries.
 */
import { ConfigAPI, template } from '@babel/core';
import crypto from 'crypto';
import { basename } from 'path';
import url from 'url';

import { getIsProd } from './common';

export function expoWebviewDirectiveProxy(api: ConfigAPI): babel.PluginObj {
  // TODO: Is exporting
  const isProduction = api.caller(getIsProd);
  const platform = api.caller((caller) => (caller as any)?.platform);

  return {
    name: 'expo-webview-directive-proxy',
    visitor: {
      Program(path, state) {
        // Native only feature.
        if (platform === 'web') {
          return;
        }

        const isUseWebview = path.node.directives.some(
          (directive: any) => directive.value.value === 'use dom'
        );
        const isUseWebviewSource = false;
        // const isUseWebviewSource = path.node.directives.some(
        //   (directive: any) => directive.value.value === 'use dom:source'
        // );

        const filePath = state.file.opts.filename;

        if (!filePath) {
          // This can happen in tests or systems that use Babel standalone.
          throw new Error('[Babel] Expected a filename to be set in the state');
        }

        // File starts with "use client" directive.
        if (!isUseWebview && !isUseWebviewSource) {
          // Do nothing for code that isn't marked as a client component.
          return;
        }

        const outputKey = url.pathToFileURL(filePath).href;

        let proxyModule: string[] = [];
        if (isProduction) {
          // MUST MATCH THE EXPORT COMMAND!
          const hash = crypto.createHash('sha1').update(outputKey).digest('hex');

          if (platform === 'ios') {
            const outputName = `www.bundle/${hash}.html`;
            proxyModule = [`const proxy = { uri: ${JSON.stringify(outputName)} };`];
          } else if (platform === 'android') {
            // TODO: This is a guess.
            const outputName = `www/${hash}.html`;
            proxyModule = [
              `const proxy = { uri: "file:///android_asset" + ${JSON.stringify(outputName)} };`,
            ];
          } else {
            throw new Error(
              'production "use dom" directive is not supported yet for platform: ' + platform
            );
          }
        } else {
          proxyModule = [
            // Add the basename to improve the Safari debug preview option.
            `const proxy = { uri: new URL("/_expo/@dom/${basename(filePath)}?file=" + ${JSON.stringify(outputKey)}, window.location.href).toString() };`,
          ];
        }

        proxyModule.push(
          !isUseWebviewSource
            ? `
                import React from 'react';
              import { WebView } from 'expo/dom/internal';

              export default React.forwardRef((props, ref) => {
                return React.createElement(WebView, { ref, ...props, $$source: proxy });
            });
              `
            : `export default proxy`
        );

        // Clear the body
        path.node.body = [];
        path.node.directives = [];

        path.pushContainer('body', template.ast(proxyModule.join('\n')));

        assertExpoMetadata(state.file.metadata);

        // Save the client reference in the metadata.
        state.file.metadata.webviewReference = outputKey;
      },
    },
  };
}

function assertExpoMetadata(metadata: any): asserts metadata is { webviewReference?: string } {
  if (metadata && typeof metadata === 'object') {
    return;
  }
  throw new Error('Expected Babel state.file.metadata to be an object');
}

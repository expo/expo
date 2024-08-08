import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function getDomComponentVirtualProxy(generatedEntry: string, filePath: string) {
  // filePath relative to the generated entry
  let relativeFilePath = path.relative(path.dirname(generatedEntry), filePath);

  if (!relativeFilePath.startsWith('.')) {
    relativeFilePath = './' + relativeFilePath;
  }

  // NOTE: This might need to be in the Metro transform cache.
  const templatePath = require.resolve(`@expo/cli/static/template/webview-entry.tsx`);
  const template = fs.readFileSync(templatePath, 'utf8');

  return {
    filePath: generatedEntry,
    contents: template.replace('[$$GENERATED_ENTRY]', relativeFilePath),
  };
}

export function getDomComponentHtml(src?: string, { title }: { title?: string } = {}) {
  return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        ${title ? `<title>${title}</title>` : ''}
        <style id="expo-reset">
        /* These styles make the body full-height */
        html,
        body {
        -webkit-overflow-scrolling: touch; /* Enables smooth momentum scrolling */
        /* height: 100%; */
        }
        /* These styles make the root element full-height */
        #root {
        display: flex;
        flex: 1;
        }
        </style>
    </head>
    <body>
    <noscript>WebView requires <code>javaScriptEnabled</code></noscript>
        <!-- Root element for the DOM component. -->
        <div id="root"></div>
        ${src ? `<script crossorigin src="${src}"></script>` : ''}
    </body>
</html>`;
}

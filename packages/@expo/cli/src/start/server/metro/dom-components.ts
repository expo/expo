import path from 'path';

export function getDomComponentVirtualProxy(generatedEntry: string, filePath: string) {
  // filePath relative to the generated entry
  let relativeFilePath = path.relative(path.dirname(generatedEntry), filePath);

  if (!relativeFilePath.startsWith('.')) {
    relativeFilePath = './' + relativeFilePath;
  }

  const stringifiedFilePath = JSON.stringify(relativeFilePath);
  // NOTE: This might need to be in the Metro transform cache if we ever change it.
  const contents = `
// Entry file for the web-side of a DOM Component.
import { registerDOMComponent } from 'expo/dom/internal';

registerDOMComponent(() => import(${stringifiedFilePath}), ${stringifiedFilePath});
`;

  return {
    filePath: generatedEntry,
    contents,
  };
}

export function getDomComponentHtml(src?: string, { title }: { title?: string } = {}) {
  // This HTML is not optimized for `react-native-web` since DOM Components are meant for general React DOM web development.
  return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        ${title ? `<title>${title}</title>` : ''}
        <style id="expo-dom-component-style">
        /* These styles make the body full-height */
        html,
        body {
          -webkit-overflow-scrolling: touch; /* Enables smooth momentum scrolling */
        }
        /* These styles make the root element full-height */
        #root {
          display: flex;
          flex: 1;
        }
        </style>
    </head>
    <body>
    <noscript>DOM Components require <code>javaScriptEnabled</code></noscript>
        <!-- Root element for the DOM component. -->
        <div id="root"></div>
        ${src ? `<script crossorigin src="${src}"></script>` : ''}
    </body>
</html>`;
}

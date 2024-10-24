import codeFrame from '@babel/code-frame';
import type { TransformResult, Warning } from 'lightningcss';

import type { CollectedDependencies } from './collect-dependencies';
import { wrapDevelopmentCSS } from './css';
import { CSSMetadata } from '../serializer/jsOutput';

type NotReadonly<T> = {
  -readonly [P in keyof T]: T[P];
};

const RNW_CSS_CLASS_ID = '_';

export async function transformCssModuleWeb(props: {
  filename: string;
  src: string;
  options: {
    projectRoot: string;
    minify: boolean;
    dev: boolean;
    sourceMap: boolean;
    reactServer: boolean;
  };
}) {
  const { transform } = require('lightningcss') as typeof import('lightningcss');

  // TODO: Add bundling to resolve imports
  // https://lightningcss.dev/bundling.html#bundling-order

  const cssResults = transform({
    filename: props.filename,
    code: Buffer.from(props.src),
    sourceMap: props.options.sourceMap,
    cssModules: {
      // Prevent renaming CSS variables to ensure
      // variables created in global files are available.
      dashedIdents: false,
    },
    errorRecovery: true,
    analyzeDependencies: true,
    // cssModules: true,
    projectRoot: props.options.projectRoot,
    minify: props.options.minify,
  });

  printCssWarnings(props.filename, props.src, cssResults.warnings);

  const codeAsString = cssResults.code.toString();

  const { styles, reactNativeWeb, variables } = convertLightningCssToReactNativeWebStyleSheet(
    cssResults.exports!
  );

  let outputModule = `module.exports=Object.assign(${JSON.stringify(
    styles
  )},{unstable_styles:${JSON.stringify(reactNativeWeb)}},${JSON.stringify(variables)});`;

  if (props.options.dev) {
    const runtimeCss = wrapDevelopmentCSS({
      reactServer: props.options.reactServer,
      filename: props.filename,
      src: codeAsString,
    });

    outputModule += '\n' + runtimeCss;
  }

  const cssImports = collectCssImports(
    props.filename,
    props.src,
    cssResults.code.toString(),
    cssResults
  );

  return {
    output: outputModule,
    css: cssImports.code,
    map: cssResults.map,
    ...cssImports,
  };
}

export function convertLightningCssToReactNativeWebStyleSheet(
  input: import('lightningcss').CSSModuleExports
) {
  const styles: Record<string, string> = {};
  const reactNativeWeb: Record<string, any> = {};
  const variables: Record<string, string> = {};
  // e.g. { container: { name: 'ahs8IW_container', composes: [], isReferenced: false }, }
  Object.entries(input).map(([key, value]) => {
    // order matters here
    let className = value.name;

    if (value.composes.length) {
      className += ' ' + value.composes.map((value) => value.name).join(' ');
    }

    // CSS Variables will be `{string: string}`
    if (key.startsWith('--')) {
      variables[key] = className;
    }

    styles[key] = className;
    reactNativeWeb[key] = { $$css: true, [RNW_CSS_CLASS_ID]: className };
    return {
      [key]: { $$css: true, [RNW_CSS_CLASS_ID]: className },
    };
  });

  return { styles, reactNativeWeb, variables };
}

export function matchCssModule(filePath: string): boolean {
  return !!/\.module(\.(native|ios|android|web))?\.(css|s[ac]ss)$/.test(filePath);
}

export function printCssWarnings(filename: string, code: string, warnings?: Warning[]) {
  if (warnings) {
    for (const warning of warnings) {
      console.warn(
        `Warning: ${warning.message} (${filename}:${warning.loc.line}:${warning.loc.column}):\n${codeFrame(code, warning.loc.line, warning.loc.column)}`
      );
    }
  }
}

function isExternalUrl(url: string) {
  return url.match(/^\w+:\/\//);
}

export function collectCssImports(
  filename: string,
  originalCode: string,
  code: string,
  cssResults: Pick<TransformResult, 'dependencies' | 'exports'>
) {
  const externalImports: CSSMetadata['externalImports'] = [];

  const cssModuleDeps: NotReadonly<CollectedDependencies['dependencies']> = [];
  if (cssResults.dependencies) {
    for (const dep of cssResults.dependencies) {
      if (dep.type === 'import') {
        // If the URL starts with `http://` or other protocols, we'll treat it like an external import.
        if (isExternalUrl(dep.url)) {
          externalImports.push({
            url: dep.url,
            supports: dep.supports,
            media: dep.media,
          });
        } else {
          // If the import is a local file, then add it as a JS dependency so the bundler can resolve it.
          cssModuleDeps.push({
            name: dep.url,
            data: {
              asyncType: null,
              isOptional: false,
              locs: [
                {
                  start: {
                    line: dep.loc.start.line,
                    column: dep.loc.start.column,
                    index: -1,
                  },
                  end: {
                    line: dep.loc.end.line,
                    column: dep.loc.end.column,
                    index: -1,
                  },
                  filename,
                  identifierName: undefined,
                },
              ],
              css: {
                url: dep.url,
                media: dep.media,
                supports: dep.supports,
              },
              exportNames: [],
              key: dep.url,
            },
          });
        }
      } else if (dep.type === 'url') {
        // Put the URL back into the code.
        code = code.replaceAll(dep.placeholder, dep.url);

        const isSupported = // External URL
          isExternalUrl(dep.url) ||
          // Data URL, DOM id, or public file.
          dep.url.match(/^(data:|[#/])/);
        if (!isSupported) {
          // Assert that syntax like `background: url('./img.png');` is not supported yet.
          console.warn(
            `Importing local resources in CSS is not supported yet. (${filename}:${dep.loc.start.line}:${dep.loc.start.column}):\n${codeFrame(originalCode, dep.loc.start.line, dep.loc.start.column)}`
          );
        }
      }
    }
  }

  return { externalImports, code, dependencies: cssModuleDeps };
}

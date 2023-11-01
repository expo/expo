import * as babel from '@babel/core';
import { getConfig } from '@expo/config';
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

import { getRoutePaths, getRouterDirectoryWithManifest } from '../../start/server/metro/router';

export function removeSupportedExtensions(name: string): string {
  return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}

// Remove any amount of `./` and `../` from the start of the string
export function removeFileSystemDots(filePath: string): string {
  return filePath.replace(/^(?:\.\.?\/)+/g, '');
}

export async function getRouterFixtureFromProject(projectRoot: string) {
  const { exp } = getConfig(projectRoot);
  const appDir = getRouterDirectoryWithManifest(projectRoot, exp);

  const routePaths = getRoutePaths(appDir)
    .filter((routePath) => {
      return !routePath.match(/^\.\/\+html/) && !routePath.match(/\+api\.[jt]sx?$/);
    })
    .sort();

  let results = `renderRouter({
${routePaths
  .map((routePath) => {
    const keyId = removeFileSystemDots(removeSupportedExtensions(routePath));
    const isLayout = keyId.match(/_layout$/);
    const routeFilePath = path.join(appDir, routePath);
    const contents = fs.readFileSync(routeFilePath, 'utf8');
    const routerModules = getRouterImports(contents);
    // console.log('imports:', keyId, routerModules);

    const possibleLayout =
      routerModules.imports.filter((m) => knownNavigators.includes(m))[0] ?? 'Stack';

    let v = isLayout ? `() => <${possibleLayout} />` : `() => <Text />`;

    if (routerModules.redirect) {
      v = `() => ${routerModules.redirect}`;
    }

    if (routerModules.unstableSettings) {
      return `  "${keyId}": {
            unstable_settings: ${routerModules.unstableSettings},
            default: ${v},
        }`;
    }

    return `  "${keyId}": ${v}`;
  })
  .join(',\n')}
});`;

  // format the code
  results = await prettier.format(results, {
    parser: 'babel',
    singleQuote: true,
    trailingComma: 'es5',
  });

  return results;
}

const knownNavigators = ['Stack', 'Tabs', 'Drawer', 'Slot'];

// Parse the AST and return a list of modules imported from expo-router.
function getRouterImports(contents: string): {
  imports: string[];
  unstableSettings: string | null;
  redirect: string | null;
} {
  const ast = babel.parse(contents, {
    sourceType: 'module',
  });

  // List of imports like Tabs, Stack, etc.
  const imports: string[] = [];

  let unstableSettings: string | null = null;

  // Search for react component exporting `<Redirect href="/xxx" />` and store the string of the JSX.
  let redirect: string | null = null;

  babel.traverse(ast, {
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (source === 'expo-router') {
        const specifiers = path.node.specifiers;
        specifiers.forEach((specifier) => {
          if (specifier.type === 'ImportSpecifier') {
            imports.push(specifier.imported.name);
          }
        });
      }
    },

    // Search for react component exporting `<Redirect href="/xxx" />` and store the string of the JSX.
    JSXElement(path) {
      const { openingElement } = path.node;
      // Check if the JSX element is a "Redirect" with a "href" attribute
      if (openingElement.name.type === 'JSXIdentifier' && openingElement.name.name === 'Redirect') {
        const hrefAttribute = openingElement.attributes.find(
          (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'href'
        );
        if (hrefAttribute) {
          const wrappedAst = {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ExpressionStatement',
                expression: path.node,
              },
            ],
          };
          redirect = babel.transformFromAstSync(wrappedAst, undefined, {
            configFile: false,
            babelrc: false,
            presets: [],
            plugins: ['@babel/plugin-syntax-jsx'], // Ensure JSX transformation is enabled
          })?.code;
          redirect = redirect?.replace(/;$/, '');
        }
      }
    },

    // Scan for a top-level export `const unstable_settings = { ... }` and save the static object.
    ExportNamedDeclaration(path) {
      const { declaration } = path.node;
      if (declaration?.type === 'VariableDeclaration') {
        const { declarations } = declaration;
        if (declarations.length === 1) {
          const { id, init } = declarations[0];
          if (id.type === 'Identifier' && id.name === 'unstable_settings') {
            if (init?.type === 'ObjectExpression') {
              // Wrap the ObjectExpression in a Program node
              const wrappedAst = {
                type: 'Program',
                sourceType: 'module',
                body: [
                  {
                    type: 'ExpressionStatement',
                    expression: init,
                  },
                ],
              };

              unstableSettings = babel.transformFromAstSync(wrappedAst, undefined, {
                configFile: false,
                babelrc: false,
                presets: [],
                plugins: [],
              })?.code;

              unstableSettings = unstableSettings?.replace(/;$/, '');
            }
          }
        }
      }
    },
  });

  return { imports, unstableSettings, redirect };
}

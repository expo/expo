import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DefinedNativePlugin } from 'noxcturnal';

import {
  expoPluginInput,
  isNodeModule,
  type Noxcturnal,
  type NoxcturnalTransformInput,
} from '../noxcturnal-transformer';

interface ExpoDomComponentState {
  input: NoxcturnalTransformInput;
  enabled: boolean;
  hasDefault: boolean;
  displayName: string;
}

export function createExpoDomComponentPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<ExpoDomComponentState> {
  return nox.defineNativePlugin<ExpoDomComponentState>({
    name: 'expo-dom-component',
    editEffect: 'bindings',
    contract: { metadata: { writes: ['expoDomComponentReference'] } },
    createState: (context) => ({
      input: expoPluginInput(context),
      enabled: false,
      hasDefault: false,
      displayName: 'Component',
    }),
    visitors: [
      nox.defineVisitor(
        'Program',
        {
          children: {
            directives: { route: 'Directive', fields: ['value'] },
          },
        },
        (program, state) => {
          state.enabled =
            state.input.options.platform !== 'web' &&
            program
              .getChildList('directives')
              .some((directive) => directive.node.value === 'use dom');
        }
      ),
      nox.defineVisitor(
        'ExportNamedDeclaration',
        {
          fields: ['exportKind'],
          ancestry: { mode: 'programParent' },
          children: {
            declaration: { route: 'Declaration', fields: ['nodeKind'] },
          },
        },
        (exportPath, state) => {
          if (!state.enabled || exportPath.parentPath?.node.type !== 'Program') return;
          if (exportPath.node.exportKind === 'type') return;
          const kind = exportPath.getChild('declaration')?.node.type;
          if (kind === 'TSInterfaceDeclaration' || kind === 'TSTypeAliasDeclaration') return;
          exportPath.unsupported('dom-component-named-export');
        }
      ),
      nox.defineVisitor(
        'ExportDefaultDeclaration',
        {
          ancestry: { mode: 'programParent' },
          children: {
            declaration: {
              route: 'Declaration|Expression',
              fields: ['nodeKind', 'name'],
            },
          },
        },
        (exportPath, state) => {
          if (!state.enabled || exportPath.parentPath?.node.type !== 'Program') return;
          state.hasDefault = true;
          const declaration = exportPath.getChild('declaration') as any;
          if (
            declaration?.node.nodeKind === 'FunctionDeclaration' &&
            typeof declaration.node.name === 'string'
          ) {
            state.displayName = declaration.node.name;
          }
        }
      ),
    ],
    post(context, state) {
      if (!state.enabled) return;
      if (!state.hasDefault) context.unsupported('dom-component-missing-default');
      const basename = path.basename(state.input.filename);
      if (
        state.input.filename.includes(state.input.projectRoot) &&
        !isNodeModule(state.input.filename)
      ) {
        if (/^_layout\.[jt]sx?$/.test(basename)) {
          context.unsupported('dom-component-layout-route');
        }
        if (/\+api\.[jt]sx?$/.test(basename)) {
          context.unsupported('dom-component-api-route');
        }
      }
      const outputKey = pathToFileURL(state.input.filename).href;
      const filePath = state.input.options.dev
        ? `${JSON.stringify(`${basename}?file=`)} + ${JSON.stringify(outputKey)}`
        : JSON.stringify(`${createHash('md5').update(outputKey).digest('hex')}.html`);
      const proxy = `import React from "react";
import { WebView } from "expo/dom/internal";
const filePath = ${filePath};
const _Expo_DOMProxyComponent = React.forwardRef((props, ref) => React.createElement(WebView, { ref, ...props, filePath }));
if (__DEV__) _Expo_DOMProxyComponent.displayName = ${JSON.stringify(`DOM(${state.displayName})`)};
export default _Expo_DOMProxyComponent;`;
      context.editor.overwrite(0, context.source.length, proxy);
      context.metadata.set('expoDomComponentReference', outputKey);
    },
  });
}

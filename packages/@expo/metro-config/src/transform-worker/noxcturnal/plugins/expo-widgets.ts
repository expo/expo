import generate from '@babel/generator';
import path from 'node:path';
import type {
  Code,
  DefinedNativePlugin,
  NativeNodePath,
  PluginContext,
  SourceFragment,
} from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

type HermesProgram = Record<string, unknown>;
type HermesTransform = (
  program: HermesProgram,
  options: Record<string, unknown>
) => HermesProgram | null;
const hermesParser = require('hermes-parser') as {
  parse(source: string, options: Record<string, unknown>): HermesProgram;
  Transforms: {
    transformEnumSyntax: HermesTransform;
    transformMatchSyntax: HermesTransform;
    transformComponentSyntax: HermesTransform;
    transformRecordSyntax: HermesTransform;
    stripFlowTypes: HermesTransform;
  };
};
const transformESTreeToBabel = (
  require(
    path.join(path.dirname(require.resolve('hermes-parser')), 'babel/TransformESTreeToBabel.js')
  ) as {
    transformProgram(
      program: HermesProgram,
      options: Record<string, unknown>
    ): Parameters<typeof generate>[0];
  }
).transformProgram;

function compactWidgetFunction(source: string): string {
  let pureCalls = source.match(/\/\*\s*@__PURE__\s*\*\//g)?.length ?? 0;
  const ast = hermesParser.parse(`const __expoWidget = ${source};`, {
    babel: false,
    flow: 'detect',
    sourceType: 'module',
  });
  const file = transformESTreeToBabel(ast, {}) as any;
  const declaration = file.program.body[0].declarations[0];
  return generate(declaration.init, {
    compact: true,
    comments: true,
  }).code.replace(/\s*\b(_jsx[\w$]*\()/g, (call: string) =>
    pureCalls-- > 0 ? `/*#__PURE__*/${call.trimStart()}` : call
  );
}

function escapeWidgetTemplate(source: string): string {
  return source.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const expoWidgetsAvailabilityByRoot = new Map<string, boolean>();

export function hasExpoWidgets(projectRoot: string): boolean {
  const cached = expoWidgetsAvailabilityByRoot.get(projectRoot);
  if (cached != null) return cached;
  let available = false;
  try {
    require.resolve('expo-widgets/package.json', {
      paths: [projectRoot, __dirname],
    });
    available = true;
  } catch {}
  expoWidgetsAvailabilityByRoot.set(projectRoot, available);
  return available;
}

export function createExpoWidgetsPlugin(nox: Noxcturnal): DefinedNativePlugin {
  type WidgetParentPath = {
    node: {
      type: string;
      method?: boolean;
      kind?: string;
      computed?: boolean;
    };
    context: PluginContext;
    getChild(role: 'key'): Pick<NativeNodePath, 'getSource'> | null;
    replaceWith(code: Code): void;
  };
  type WidgetFunctionPath = {
    node: {
      async?: boolean;
      generator?: boolean;
      nodeKind?: string;
      name?: string;
    };
    parentPath: WidgetParentPath | null;
    getChild(role: 'body'): {
      node: { type: string };
      getChildList(role: 'directives'): readonly {
        node: { value?: string; start: number; end: number };
      }[];
      getSource(): SourceFragment;
      sourceText(): string;
    } | null;
    getChildList(role: 'params'): readonly Pick<NativeNodePath, 'sourceText'>[];
    replaceWith(code: Code): void;
  };
  const transformFunction = (functionPath: WidgetFunctionPath) => {
    const bodyPath = functionPath.getChild('body');
    if (!bodyPath || bodyPath.node.type !== 'FunctionBody') return;
    const directive = bodyPath
      .getChildList('directives')
      .find((candidate) => candidate.node.value === 'widget');
    if (!directive) return;
    const bodyRange = bodyPath.getSource();
    const bodySource = bodyPath.sourceText();
    const directiveStart = directive.node.start - bodyRange.start;
    const directiveEnd = directive.node.end - bodyRange.start;
    const withoutDirective = bodySource.slice(0, directiveStart) + bodySource.slice(directiveEnd);
    const parameters = functionPath
      .getChildList('params')
      .map((parameter) => parameter.sourceText())
      .join(',');
    const expression =
      `${functionPath.node.async === true ? 'async ' : ''}function` +
      `${functionPath.node.generator === true ? '*' : ''}(${parameters})${withoutDirective}`;
    const template = `\`${escapeWidgetTemplate(compactWidgetFunction(expression))}\``;

    if (
      functionPath.node.nodeKind === 'FunctionDeclaration' &&
      functionPath.parentPath?.node.type === 'ExportDefaultDeclaration'
    ) {
      functionPath.parentPath.replaceWith(`export default ${template};`);
    } else if (
      functionPath.node.nodeKind === 'FunctionDeclaration' &&
      typeof functionPath.node.name === 'string'
    ) {
      functionPath.replaceWith(`var ${functionPath.node.name} = ${template};`);
    } else if (
      functionPath.parentPath?.node.type === 'ObjectProperty' &&
      functionPath.parentPath.node.method === true
    ) {
      const property = functionPath.parentPath;
      if (property.node.kind !== 'init') return;
      const key = property.getChild('key');
      if (!key) return;
      property.replaceWith(
        property.node.computed
          ? property.context.code.template`[${key.getSource()}]: ${template}`
          : property.context.code.template`${key.getSource()}: ${template}`
      );
    } else {
      functionPath.replaceWith(template);
    }
  };

  return nox.defineNativePlugin({
    name: 'expo-widgets',
    editEffect: 'bindings',
    visitors: [
      nox.defineVisitor(
        'Function',
        {
          fields: ['nodeKind', 'name', 'async', 'generator', 'bodyStart', 'bodyEnd'],
          ancestry: {
            mode: 'parent',
            routes: {
              ObjectProperty: {
                fields: ['key', 'computed', 'kind', 'method'],
                children: { key: { route: 'Expression' } },
              },
            },
          },
          children: {
            body: {
              route: 'FunctionBody',
              children: {
                directives: { route: 'Directive', fields: ['value'] },
              },
            },
            params: {
              route: 'FormalParameter|FormalParameterRest',
            },
          },
        },
        (functionPath) => transformFunction(functionPath)
      ),
      nox.defineVisitor(
        'ArrowFunctionExpression',
        {
          fields: ['async', 'expression', 'bodyStart', 'bodyEnd'],
          ancestry: {
            mode: 'parent',
            routes: {
              ObjectProperty: {
                fields: ['key', 'computed', 'kind', 'method'],
                children: { key: { route: 'Expression' } },
              },
            },
          },
          children: {
            body: {
              route: 'FunctionBody',
              children: {
                directives: { route: 'Directive', fields: ['value'] },
              },
            },
            params: {
              route: 'FormalParameter|FormalParameterRest|BindingRestElement',
            },
          },
        },
        (functionPath) => {
          if (functionPath.node.expression === false) transformFunction(functionPath);
        }
      ),
    ],
  });
}

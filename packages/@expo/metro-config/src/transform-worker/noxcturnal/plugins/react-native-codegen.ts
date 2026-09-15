import type { DefinedNativePlugin } from 'noxcturnal';

import { TURBO_MODULE_SPEC } from '../codegen';
import { expoPluginInput, type Noxcturnal } from '../noxcturnal-transformer';

const CODEGEN_MODULE = /(?:^|\/)codegenNative(?:Component|Commands)$/;

export function createReactNativeCodegenEligibilityPlugin(nox: Noxcturnal): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-react-native-codegen-eligibility',
    visitors: [
      nox.defineVisitor('Program', {}, (program) => {
        if (TURBO_MODULE_SPEC.test(expoPluginInput(program.context).source)) {
          program.unsupported('react-native-codegen');
        }
      }),
      nox.defineVisitor(
        'ImportDeclaration',
        {
          fields: ['source'],
          children: {
            specifiers: {
              route: 'ImportSpecifier|ImportDefaultSpecifier|ImportNamespaceSpecifier',
              fields: ['imported'],
            },
          },
        },
        (declaration) => {
          const source = String(declaration.node.source);
          if (CODEGEN_MODULE.test(source)) {
            declaration.unsupported('react-native-codegen');
            return;
          }
          if (
            source === 'react-native' &&
            declaration
              .getChildList('specifiers')
              .some(
                (specifier) =>
                  specifier.node.imported === 'codegenNativeComponent' ||
                  specifier.node.imported === 'codegenNativeCommands'
              )
          ) {
            declaration.unsupported('react-native-codegen');
          }
        }
      ),
      nox.defineVisitor('CallExpression', { fields: ['calleeName', 'calleeGlobal'] }, (call) => {
        if (
          call.node.calleeGlobal === true &&
          (call.node.calleeName === 'codegenNativeComponent' ||
            call.node.calleeName === 'codegenNativeCommands')
        ) {
          call.unsupported('react-native-codegen');
        }
      }),
    ],
  });
}

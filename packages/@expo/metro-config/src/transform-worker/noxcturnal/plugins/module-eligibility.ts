import type { DefinedNativePlugin } from 'noxcturnal';

import type { Noxcturnal } from '../noxcturnal-transformer';

export function createEligibilityVisitors(nox: Noxcturnal, isHermesV1: boolean) {
  return [
    nox.defineVisitor('Decorator', {}, (path) => {
      path.unsupported('decorator-lowering');
    }),
    ...(isHermesV1
      ? []
      : [
          nox.defineVisitor(
            'Function',
            { fields: ['generator'], where: { async: { equals: true } } },
            (fn) => {
              fn.unsupported(
                fn.node.generator === true ? 'async-generator-lowering' : 'async-lowering'
              );
            }
          ),
        ]),
  ];
}

export function createModuleEligibilityPlugin(
  nox: Noxcturnal,
  isHermesV1: boolean
): DefinedNativePlugin {
  return nox.defineNativePlugin({
    name: 'expo-metro-eligibility',
    contract: { queries: [{ imports: true, exports: true }] },
    analyze(context) {
      const modules = context.query({ imports: true, exports: true });
      return modules.imports.length === 0 && modules.exports.length === 0
        ? { status: 'supported', analysis: undefined }
        : {
            status: 'unsupported',
            reason: 'esm-requires-babel-module-transform',
          };
    },
    visitors: createEligibilityVisitors(nox, isHermesV1),
  });
}

import { createHash } from 'node:crypto';
import type { DefinedNativePlugin, NativeNodePath } from 'noxcturnal';
import { isStatementType } from 'noxcturnal';

import type { AsyncDependencyType, Dependency } from '../../collect-dependencies';
import {
  metroPluginData,
  type Noxcturnal,
  type NoxcturnalMetroTransformInput,
} from '../noxcturnal-transformer';

export interface MetroDependencyState {
  dependencies: Map<
    string,
    Dependency & { index: number; imports: number; exportNameSet?: Set<string> }
  >;
  requireName: string;
  importDefaultName: string;
  importAllName: string;
  dependencyMapName: string;
}

const OPTIONAL_DEPENDENCY_ANCESTRY = {
  mode: 'findParent',
  routes: {
    MemberExpression: {
      fields: ['computed', 'property'],
      children: { object: { route: 'Expression' } },
    },
    CallExpression: {
      fields: ['optional', 'argumentCount'],
      children: {
        callee: { route: 'Expression' },
        arguments: { route: 'Expression', fields: ['name', 'value'] },
      },
    },
    Statement: {},
    TryStatement: {
      children: { block: { route: 'BlockStatement' } },
    },
  },
} as const;

interface OptionalDependencyChild {
  readonly id: number;
  readonly node: {
    readonly type: string;
    readonly name?: unknown;
    readonly computed?: unknown;
    readonly property?: unknown;
  };
}

interface OptionalDependencyAncestor extends OptionalDependencyChild {
  readonly node: OptionalDependencyChild['node'] & {
    readonly optional?: unknown;
    readonly argumentCount?: number;
  };
  readonly parentPath: OptionalDependencyAncestor | null;
  getChild(role: string): OptionalDependencyChild | null;
  getChildList(role: string): readonly OptionalDependencyChild[];
}

function isOptionalMetroDependency(
  input: NoxcturnalMetroTransformInput,
  name: string,
  path: {
    readonly id: number;
    readonly parentPath: OptionalDependencyAncestor | null;
  },
  checkPromiseChain = false
): boolean {
  if (name === input.config.asyncRequireModulePath) return false;
  const setting = input.config.allowOptionalDependencies;
  if (!setting || (typeof setting === 'object' && setting.exclude.includes(name))) {
    return false;
  }
  let promiseChainActive = checkPromiseChain;
  let expectedObjectId = path.id;
  let memberId: number | null = null;
  let method: unknown = null;
  let statementCount = 0;
  let tryBlockResolved = false;

  for (let ancestor = path.parentPath; ancestor; ancestor = ancestor.parentPath) {
    if (promiseChainActive) {
      if (memberId == null) {
        if (
          (ancestor.node.type === 'StaticMemberExpression' ||
            ancestor.node.type === 'ComputedMemberExpression') &&
          ancestor.node.computed === false &&
          ancestor.getChild('object')?.id === expectedObjectId
        ) {
          memberId = ancestor.id;
          method = ancestor.node.property;
        } else {
          promiseChainActive = false;
        }
      } else {
        if (
          ancestor.node.type === 'CallExpression' &&
          ancestor.node.optional !== true &&
          ancestor.getChild('callee')?.id === memberId
        ) {
          const callback =
            method === 'catch' && (ancestor.node.argumentCount ?? 0) >= 1
              ? ancestor.getChildList('arguments')[0]
              : method === 'then' && (ancestor.node.argumentCount ?? 0) >= 2
                ? ancestor.getChildList('arguments')[1]
                : null;
          if (
            callback != null &&
            callback.node.type !== 'NullLiteral' &&
            !(callback.node.type === 'Identifier' && callback.node.name === 'undefined')
          ) {
            return true;
          }
          expectedObjectId = ancestor.id;
          memberId = null;
          method = null;
        } else {
          promiseChainActive = false;
        }
      }
    }

    if (!tryBlockResolved && isStatementType(ancestor.node.type)) {
      if (ancestor.node.type === 'BlockStatement') {
        tryBlockResolved = true;
        const parent = ancestor.parentPath;
        if (parent?.node.type === 'TryStatement' && parent.getChild('block')?.id === ancestor.id) {
          return true;
        }
      } else if (++statementCount >= 3) {
        tryBlockResolved = true;
      }
    }

    if (!promiseChainActive && tryBlockResolved) return false;
  }
  return false;
}

function reconcileDependencyOptionality(
  state: MetroDependencyState,
  key: string,
  dependency: MetroDependencyState['dependencies'] extends Map<string, infer T> ? T : never,
  optional: boolean
) {
  if (dependency.data.isOptional && !optional) {
    const required = {
      ...dependency,
      data: {
        ...dependency.data,
        isOptional: false,
      },
    };
    state.dependencies.set(key, required);
    return required;
  }
  return dependency;
}

function isIgnoredDynamicImport(path: {
  getComments(relation: 'inner'): readonly { value: string }[];
}): boolean {
  return path
    .getComments('inner')
    .some((comment) => /@metro-ignore|webpackIgnore\s*:\s*true/.test(comment.value));
}

function registerCommonJsDependency(
  state: MetroDependencyState,
  name: string,
  location: ReturnType<NativeNodePath['getLocation']>,
  optional = false
) {
  const key = `${name}\0require`;
  let dependency = state.dependencies.get(key);
  if (!dependency) {
    dependency = {
      name,
      index: state.dependencies.size,
      imports: 0,
      data: {
        key: dependencyKeyHash(key),
        asyncType: null,
        isESMImport: false,
        ...(optional ? { isOptional: true } : {}),
        locs: [],
        exportNames: ['*'],
      },
    };
    state.dependencies.set(key, dependency);
  } else {
    dependency = reconcileDependencyOptionality(state, key, dependency, optional);
  }
  dependency.imports++;
  (dependency.data.locs as any[]).push(location);
  return dependency;
}

export function registerNativeEsmDependency(
  state: MetroDependencyState,
  name: string,
  location: ReturnType<NativeNodePath['getLocation']>,
  exportNames: readonly string[] = ['*']
) {
  const key = `${name}\0import`;
  let dependency = state.dependencies.get(key);
  if (!dependency) {
    dependency = {
      name,
      index: state.dependencies.size,
      imports: 0,
      data: {
        key: dependencyKeyHash(key),
        asyncType: null,
        isESMImport: true,
        locs: [],
        exportNames: [],
      },
      exportNameSet: new Set(exportNames),
    };
    state.dependencies.set(key, dependency);
  } else {
    for (const exportName of exportNames) {
      dependency.exportNameSet!.add(exportName);
    }
  }
  dependency.imports++;
  (dependency.data.locs as any[]).push(location);
  return dependency;
}

function dependencyKeyHash(key: string): string {
  return createHash('sha1').update(key).digest('base64');
}

export function createMetroDependencyPlugin(
  nox: Noxcturnal
): DefinedNativePlugin<MetroDependencyState> {
  const nativeRequire = (
    context: { pluginData: unknown },
    state: MetroDependencyState,
    index: number,
    name: string,
    keepName = false
  ) => {
    const { input } = metroPluginData(context);
    return `${state.requireName}(${state.dependencyMapName}[${index}]${
      input.options.dev || keepName ? `, ${JSON.stringify(name)}` : ''
    })`;
  };
  return nox.defineNativePlugin<MetroDependencyState>({
    name: 'metro-collect-static-commonjs-dependencies',
    contract: {
      queries: [
        {
          globals: [{ name: '_$$_IMPORT_DEFAULT' }, { name: '_$$_IMPORT_ALL' }],
        },
      ],
      metadata: {
        writes: [
          'dependencies',
          'dependencyMapName',
          'metroRequireName',
          'metroImportDefaultName',
          'metroImportAllName',
        ],
      },
    },
    pre(context) {
      // One declared query seeds both program-level global checks. The scope
      // facade then serves hasGlobal() from the session cache instead of making
      // two synchronous native calls for every module.
      context.query({
        globals: [{ name: '_$$_IMPORT_DEFAULT' }, { name: '_$$_IMPORT_ALL' }],
      });
    },
    createState: (context) => {
      const { shared } = metroPluginData(context);
      shared.sawImportSyntax = false;
      return (shared.state = {
        dependencies: new Map(),
        requireName: 'require',
        importDefaultName: '$$_IMPORT_DEFAULT',
        importAllName: '$$_IMPORT_ALL',
        dependencyMapName: 'dependencyMap',
      });
    },
    visitors: [
      nox.defineVisitor(
        'Program',
        { scope: true },
        {
          enter(program, state: MetroDependencyState) {
            const { input, normalizePseudoGlobals } = metroPluginData(program.context);
            if (normalizePseudoGlobals) {
              state.requireName = 'r';
              state.importDefaultName = 'i';
              state.importAllName = 'a';
            } else if (input.config.unstable_disableModuleWrapping !== true) {
              state.requireName =
                input.config.unstable_renameRequire === false
                  ? 'require'
                  : program.scope.generateUid('$$_REQUIRE');
              state.importDefaultName = program.scope.hasGlobal('_$$_IMPORT_DEFAULT')
                ? '_$$_IMPORT_DEFAULT'
                : program.scope.generateUid('$$_IMPORT_DEFAULT');
              state.importAllName = program.scope.hasGlobal('_$$_IMPORT_ALL')
                ? '_$$_IMPORT_ALL'
                : program.scope.generateUid('$$_IMPORT_ALL');
            }
            const reservedDependencyMap = input.config.unstable_dependencyMapReservedName;
            if (reservedDependencyMap && program.scope.hasBinding(reservedDependencyMap)) {
              program.unsupported('reserved-dependency-map-name-collision');
            }
            state.dependencyMapName =
              reservedDependencyMap ??
              (normalizePseudoGlobals && !program.scope.hasBinding('d')
                ? 'd'
                : program.scope.generateUid('dependencyMap'));
          },
        }
      ),
      nox.defineVisitor(
        'ImportExpression',
        {
          ancestry: OPTIONAL_DEPENDENCY_ANCESTRY,
          comments: 'inner',
          children: { source: { route: 'StringLiteral', fields: ['value'] } },
        },
        (call, state: MetroDependencyState) => {
          const { input, collectOnly } = metroPluginData(call.context);
          if (isIgnoredDynamicImport(call)) return;
          const source = call.getChild('source');
          const sourceValue = source?.node.value;
          if (source?.node.type !== 'StringLiteral' || typeof sourceValue !== 'string') {
            call.unsupported('dynamic-async-dependency');
            return;
          }
          const name = sourceValue;
          const optional = isOptionalMetroDependency(input, name, call, true);
          const targetKey = `${name}\0import\0async`;
          let target = state.dependencies.get(targetKey);
          if (!target) {
            target = {
              name,
              index: state.dependencies.size,
              imports: 0,
              data: {
                key: dependencyKeyHash(targetKey),
                asyncType: 'async',
                isESMImport: true,
                ...(optional ? { isOptional: true } : {}),
                locs: [],
                exportNames: ['*'],
              },
            };
            state.dependencies.set(targetKey, target);
          } else {
            target = reconcileDependencyOptionality(state, targetKey, target, optional);
          }
          target.imports++;
          (target.data.locs as any[]).push(call.getLocation());

          const runtimeName = input.config.asyncRequireModulePath;
          const runtimeKey = `${runtimeName}\0require`;
          let runtime = state.dependencies.get(runtimeKey);
          if (!runtime) {
            runtime = {
              name: runtimeName,
              index: state.dependencies.size,
              imports: 0,
              data: {
                key: dependencyKeyHash(runtimeKey),
                asyncType: null,
                isESMImport: false,
                locs: [],
                exportNames: ['*'],
              },
            };
            state.dependencies.set(runtimeKey, runtime);
          }
          runtime.imports++;
          (runtime.data.locs as any[]).push(call.getLocation());
          if (!collectOnly && input.config.unstable_disableModuleWrapping !== true) {
            call.replaceWith({
              code: `${nativeRequire(call.context, state, runtime.index, runtimeName)}(${state.dependencyMapName}[${target.index}], ${state.dependencyMapName}.paths, ${JSON.stringify(name)})`,
              mapping: 'anchor-boundaries',
            });
          }
        }
      ),
      nox.defineVisitor(
        'CallExpression',
        {
          fields: ['calleeName', 'calleePath', 'calleeGlobal', 'staticArgument', 'argumentCount'],
          comments: 'inner',
          where: {
            calleePath: {
              oneOf: [
                '__noxcturnalImport',
                'require.context',
                'require.resolveWeak',
                'require.unstable_resolveWorker',
                'import',
                '__prefetchImport',
                'require.unstable_importMaybeSync',
                'require',
              ],
            },
          },
          ancestry: OPTIONAL_DEPENDENCY_ANCESTRY,
          children: {
            arguments: {
              route: 'Expression',
              fields: ['name', 'value', 'pattern', 'flags'],
            },
          },
        },
        (call, state: MetroDependencyState) => {
          const { input, collectOnly } = metroPluginData(call.context);
          const callee = String(call.node.calleePath ?? call.node.calleeName ?? '');
          const isGlobalRequire = call.node.calleeGlobal === true;
          if (callee === '__noxcturnalImport' && call.node.calleeGlobal === true) {
            if (call.node.argumentCount !== 1 || typeof call.node.staticArgument !== 'string') {
              call.unsupported('invalid-native-esm-import');
            }
            const name = call.node.staticArgument as string;
            const dependency = registerNativeEsmDependency(state, name, call.getLocation());
            if (!collectOnly) {
              call.replaceWith({
                code: nativeRequire(call.context, state, dependency.index, name),
                mapping: 'anchor-boundaries',
              });
            }
            return;
          }
          if (
            callee === 'require.context' &&
            isGlobalRequire &&
            input.config.unstable_allowRequireContext === true
          ) {
            const args = call.getChildList('arguments');
            const directory = args[0]?.node.value;
            if (args.length < 1 || args.length > 4 || typeof directory !== 'string') {
              call.unsupported('unsupported-require-context-arguments');
            }
            const recursiveArg = args[1];
            const recursive =
              recursiveArg == null ||
              (recursiveArg.node.type === 'Identifier' && recursiveArg.node.name === 'undefined')
                ? true
                : recursiveArg.node.type === 'BooleanLiteral' &&
                    typeof recursiveArg.node.value === 'boolean'
                  ? recursiveArg.node.value
                  : null;
            if (recursive == null) call.unsupported('unsupported-require-context-recursive');

            let pattern = '.*';
            let flags = '';
            const filterArg = args[2];
            if (
              filterArg &&
              !(filterArg.node.type === 'Identifier' && filterArg.node.name === 'undefined')
            ) {
              if (filterArg.node.type !== 'RegExpLiteral') {
                call.unsupported('unsupported-require-context-filter');
              }
              if (
                typeof filterArg.node.pattern !== 'string' ||
                typeof filterArg.node.flags !== 'string'
              ) {
                call.unsupported('unsupported-require-context-filter');
              }
              pattern = filterArg.node.pattern as string;
              flags = filterArg.node.flags as string;
            }

            const modeArg = args[3];
            const modeValue = modeArg?.node.value;
            const mode =
              modeArg == null ||
              (modeArg.node.type === 'Identifier' && modeArg.node.name === 'undefined')
                ? 'sync'
                : typeof modeValue === 'string' &&
                    ['sync', 'eager', 'lazy', 'lazy-once'].includes(modeValue)
                  ? modeValue
                  : null;
            if (mode == null) call.unsupported('unsupported-require-context-mode');

            const optional = isOptionalMetroDependency(input, directory as string, call);
            const key = `${directory}\0require\0context\0${recursive}\0${pattern}\0${flags}\0${mode}`;
            let dependency = state.dependencies.get(key);
            if (!dependency) {
              dependency = {
                name: directory as string,
                index: state.dependencies.size,
                imports: 0,
                data: {
                  key: dependencyKeyHash(key),
                  asyncType: null,
                  isESMImport: false,
                  ...(optional ? { isOptional: true } : {}),
                  locs: [],
                  exportNames: ['*'],
                  contextParams: {
                    recursive: recursive as boolean,
                    filter: { pattern, flags },
                    mode: mode as 'sync' | 'eager' | 'lazy' | 'lazy-once',
                  },
                },
              };
              state.dependencies.set(key, dependency);
            } else {
              dependency = reconcileDependencyOptionality(state, key, dependency, optional);
            }
            dependency.imports++;
            (dependency.data.locs as any[]).push(call.getLocation());
            if (!collectOnly) {
              call.replaceWith({
                code: nativeRequire(
                  call.context,
                  state,
                  dependency.index,
                  directory as string,
                  optional
                ),
                mapping: 'anchor-boundaries',
              });
            }
            return;
          }
          if (callee === 'require.resolveWeak' && isGlobalRequire) {
            if (call.node.argumentCount !== 1 || typeof call.node.staticArgument !== 'string') {
              call.unsupported('invalid-require-resolve-weak');
            }
            const name = call.node.staticArgument as string;
            const optional = isOptionalMetroDependency(input, name, call);
            const key = `${name}\0require\0weak`;
            let dependency = state.dependencies.get(key);
            if (!dependency) {
              dependency = {
                name,
                index: state.dependencies.size,
                imports: 0,
                data: {
                  key: dependencyKeyHash(key),
                  asyncType: 'weak',
                  isESMImport: false,
                  ...(optional ? { isOptional: true } : {}),
                  locs: [],
                  exportNames: ['*'],
                },
              };
              state.dependencies.set(key, dependency);
            } else {
              dependency = reconcileDependencyOptionality(state, key, dependency, optional);
            }
            dependency.imports++;
            (dependency.data.locs as any[]).push(call.getLocation());
            if (!collectOnly) {
              call.replaceWith({
                code: `${state.dependencyMapName}[${dependency.index}]`,
                mapping: 'anchor-boundaries',
              });
            }
            return;
          }
          if (callee === 'require.unstable_resolveWorker' && isGlobalRequire) {
            if (call.node.argumentCount !== 1 || typeof call.node.staticArgument !== 'string') {
              call.unsupported('invalid-require-resolve-worker');
            }
            const name = call.node.staticArgument as string;
            const optional = isOptionalMetroDependency(input, name, call);
            const targetKey = `${name}\0require\0worker`;
            let target = state.dependencies.get(targetKey);
            if (!target) {
              target = {
                name,
                index: state.dependencies.size,
                imports: 0,
                data: {
                  key: dependencyKeyHash(targetKey),
                  asyncType: 'worker',
                  isESMImport: false,
                  ...(optional ? { isOptional: true } : {}),
                  locs: [],
                  exportNames: ['*'],
                },
              };
              state.dependencies.set(targetKey, target);
            } else {
              target = reconcileDependencyOptionality(state, targetKey, target, optional);
            }
            target.imports++;
            (target.data.locs as any[]).push(call.getLocation());

            const runtimeName = input.config.asyncRequireModulePath;
            const runtimeKey = `${runtimeName}\0require`;
            let runtime = state.dependencies.get(runtimeKey);
            if (!runtime) {
              runtime = {
                name: runtimeName,
                index: state.dependencies.size,
                imports: 0,
                data: {
                  key: dependencyKeyHash(runtimeKey),
                  asyncType: null,
                  isESMImport: false,
                  locs: [],
                  exportNames: ['*'],
                },
              };
              state.dependencies.set(runtimeKey, runtime);
            }
            runtime.imports++;
            (runtime.data.locs as any[]).push(call.getLocation());
            if (!collectOnly) {
              call.replaceWith({
                code: `${nativeRequire(call.context, state, runtime.index, runtimeName)}.unstable_resolve(${state.dependencyMapName}[${target.index}], ${state.dependencyMapName}.paths)`,
                mapping: 'anchor-boundaries',
              });
            }
            return;
          }
          const asyncType: AsyncDependencyType | null =
            callee === 'import'
              ? 'async'
              : callee === '__prefetchImport' && call.node.calleeGlobal === true
                ? 'prefetch'
                : callee === 'require.unstable_importMaybeSync' && isGlobalRequire
                  ? 'maybeSync'
                  : null;
          if (asyncType) {
            if (callee === 'import' && isIgnoredDynamicImport(call)) return;
            if (call.node.argumentCount !== 1 || typeof call.node.staticArgument !== 'string') {
              call.unsupported(`dynamic-${asyncType}-dependency`);
            }
            const name = call.node.staticArgument as string;
            const optional = isOptionalMetroDependency(input, name, call, true);
            const targetKey = `${name}\0import\0${asyncType}`;
            let target = state.dependencies.get(targetKey);
            if (!target) {
              target = {
                name,
                index: state.dependencies.size,
                imports: 0,
                data: {
                  key: dependencyKeyHash(targetKey),
                  asyncType,
                  isESMImport: true,
                  ...(optional ? { isOptional: true } : {}),
                  locs: [],
                  exportNames: ['*'],
                },
              };
              state.dependencies.set(targetKey, target);
            } else {
              target = reconcileDependencyOptionality(state, targetKey, target, optional);
            }
            target.imports++;
            (target.data.locs as any[]).push(call.getLocation());

            const runtimeName = input.config.asyncRequireModulePath;
            const runtimeKey = `${runtimeName}\0require`;
            let runtime = state.dependencies.get(runtimeKey);
            if (!runtime) {
              runtime = {
                name: runtimeName,
                index: state.dependencies.size,
                imports: 0,
                data: {
                  key: dependencyKeyHash(runtimeKey),
                  asyncType: null,
                  isESMImport: false,
                  locs: [],
                  exportNames: ['*'],
                },
              };
              state.dependencies.set(runtimeKey, runtime);
            }
            runtime.imports++;
            (runtime.data.locs as any[]).push(call.getLocation());

            const runtimeRequire = nativeRequire(call.context, state, runtime.index, runtimeName);
            const method =
              asyncType === 'prefetch'
                ? '.prefetch'
                : asyncType === 'maybeSync'
                  ? '.unstable_importMaybeSync'
                  : '';
            if (!collectOnly) {
              call.replaceWith({
                code: `${runtimeRequire}${method}(${state.dependencyMapName}[${target.index}], ${state.dependencyMapName}.paths, ${JSON.stringify(name)})`,
                mapping: 'anchor-boundaries',
              });
            }
            return;
          }
          if (
            (callee === 'require.context' && input.config.unstable_allowRequireContext === true) ||
            (callee === '__prefetchImport' && call.node.calleeGlobal === true) ||
            (callee === 'require.unstable_importMaybeSync' && isGlobalRequire)
          ) {
            call.unsupported(`unsupported-metro-dependency-call:${callee}`);
          }
          if (callee !== 'require' || call.node.calleeGlobal !== true) return;
          if (call.node.argumentCount !== 1 || typeof call.node.staticArgument !== 'string') {
            call.unsupported('dynamic-require');
          }

          const name = call.node.staticArgument as string;
          const optional = isOptionalMetroDependency(input, name, call);
          const registered = registerCommonJsDependency(state, name, call.getLocation(), optional);
          if (!collectOnly && input.config.unstable_disableModuleWrapping !== true) {
            const dependencyArgument = `${state.dependencyMapName}[${registered.index}]`;
            const replacement = /^@babel\/runtime\/helpers\/[^/]+$/.test(name)
              ? `${state.importDefaultName}(${dependencyArgument}, ${JSON.stringify(name)})`
              : nativeRequire(call.context, state, registered.index, name, optional);
            call.replaceWith({
              code: replacement,
              mapping: 'anchor-boundaries',
            });
          }
        }
      ),
    ],
    post(context, state) {
      const { input, collectOnly, normalizePseudoGlobals } = metroPluginData(context);
      const dependencies = [...state.dependencies.values()].map(
        ({ index, imports, exportNameSet, ...dependency }) =>
          Object.freeze({
            ...dependency,
            data: Object.freeze({
              ...dependency.data,
              ...(exportNameSet ? { exportNames: [...exportNameSet] } : {}),
              imports,
            }),
          })
      );
      context.metadata.set('dependencies', dependencies);
      context.metadata.set('dependencyMapName', state.dependencyMapName);
      context.metadata.set('metroRequireName', state.requireName);
      context.metadata.set('metroImportDefaultName', state.importDefaultName);
      context.metadata.set('metroImportAllName', state.importAllName);
      if (!collectOnly && input.config.unstable_disableModuleWrapping !== true) {
        const parameters = [
          normalizePseudoGlobals ? 'g' : 'global',
          state.requireName,
          state.importDefaultName,
          state.importAllName,
          normalizePseudoGlobals ? 'm' : 'module',
          normalizePseudoGlobals ? 'e' : 'exports',
          state.dependencyMapName,
        ];
        context.editor.prepend(
          `${input.config.globalPrefix}__d(function (${parameters.join(', ')}) {\n`
        );
        context.editor.append('\n});');
      }
    },
  });
}

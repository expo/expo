import type { JsTransformOptions } from '@expo/metro/metro-transform-worker';
import path from 'node:path';
import type {
  DefinedNativePlugin,
  NodeView,
  NativePipeline,
  NativeTransformResult,
  PipelinePhase,
  PreflightPlan,
  PreflightTransforms,
  PluginContext,
  TransformResult,
} from 'noxcturnal';

import type { Dependency } from '../collect-dependencies';
import { isReactNativeCodegenCandidate } from './codegen';
import { getHermesV0PreflightConfig } from './configs/hermes-v0';
import { getHermesV1PreflightConfig } from './configs/hermes-v1';
import type { ProfilePreflightFacts } from './configs/types';
import { getWebPreflightConfig } from './configs/web';
import { getWebViewPreflightConfig } from './configs/webview';
import { createCjsDetectionPlugin } from './plugins/cjs-detection';
import { createClientServerDirectiveBoundaryPlugin } from './plugins/client-server-directive-boundary';
import { createClientServerReferenceProxyPlugin } from './plugins/client-server-reference-proxy';
import { createDeepReactNativeImportWarningsPlugin } from './plugins/deep-react-native-import-warnings';
import { createDefinePlugin } from './plugins/define';
import { createDevelopmentPublicEnvPlugin } from './plugins/development-public-env';
import { createEnvironmentRestrictedImportsPlugin } from './plugins/environment-restricted-imports';
import { createEnvironmentRestrictedReactApisPlugin } from './plugins/environment-restricted-react-apis';
import { createExpoDomComponentPlugin } from './plugins/expo-dom-component';
import { createExpoInlineManifestPlugin } from './plugins/expo-inline-manifest';
import { createExpoRouterServerExportsPlugin } from './plugins/expo-router-server-exports';
import { createExpoUiPlugin } from './plugins/expo-ui';
import { createExpoWidgetsPlugin, hasExpoWidgets } from './plugins/expo-widgets';
import { createFixHermesV1AsyncArrowNonSimpleParamsPlugin } from './plugins/fix-hermes-v1-async-arrow-non-simple-params';
import { createFixHermesV1ClassInFinallyPlugin } from './plugins/fix-hermes-v1-class-in-finally';
import { createFixHermesV1SuperInObjectAccessorPlugin } from './plugins/fix-hermes-v1-super-in-object-accessor';
import { createImportMetaPlugin } from './plugins/import-meta';
import { createInlineRequiresPlugin } from './plugins/inline-requires';
import { createMetroDependencyPlugin } from './plugins/metro-dependency';
import type { MetroDependencyState } from './plugins/metro-dependency';
import { createMetroEsmGlobalsPlugin } from './plugins/metro-esm-globals';
import { createMetroLiveBindingsPlugin } from './plugins/metro-live-bindings';
import { createModuleEligibilityPlugin } from './plugins/module-eligibility';
import { createNativeEsmEligibilityPlugin } from './plugins/native-esm-eligibility';
import { createPlatformSelectPlugin } from './plugins/platform-select';
import { createProcessEnvPlugin } from './plugins/process-env';
import { createReactDisplayNamePlugin } from './plugins/react-display-name';
import { createReactNativeWebPlugin } from './plugins/react-native-web';
import { createReactServerClientProxyPlugin } from './plugins/react-server-client-proxy';
import { createReactServerDirectiveBoundaryPlugin } from './plugins/react-server-directive-boundary';
import { createReactServerModuleActionsPlugin } from './plugins/react-server-module-actions';

export type Noxcturnal = typeof import('noxcturnal');

export interface MetroDependencyShared {
  state?: MetroDependencyState;
  sawImportSyntax?: boolean;
  importedBindings?: Map<string, string>;
}

/** Boundary facts the server/client directive plugins share for one file.
 *
 * These plugins observe each other: the directive-boundary plugins must know
 * whether a proxy or module-level action was already emitted. Keeping that on
 * per-file plugin data rather than in a closure lets every plugin be defined once
 * and interned, so its plan and routes compile once for the process. */
export interface ServerBoundaryShared {
  clientProxy: boolean;
  moduleServerActions: boolean;
  serverProxy: boolean;
  handledDirectives: Set<number>;
}

export interface ExpoTransformPluginData {
  input: NoxcturnalTransformInput;
  sourceFacts: NoxcturnalSourceFacts;
  serverBoundary: ServerBoundaryShared;
}

export function sortedUniqueCaptureNames(captures: readonly NodeView[]): string[] {
  return [...new Set(captures.map((capture) => String(capture.name)))].sort();
}

export interface MetroTransformPluginData extends ExpoTransformPluginData {
  input: NoxcturnalMetroTransformInput;
  shared: MetroDependencyShared;
  collectOnly: boolean;
  normalizePseudoGlobals: boolean;
}

export function expoPluginInput(context: { pluginData: unknown }): NoxcturnalTransformInput {
  return (context.pluginData as ExpoTransformPluginData).input;
}

export function serverBoundary(context: { pluginData: unknown }): ServerBoundaryShared {
  return (context.pluginData as ExpoTransformPluginData).serverBoundary;
}

export function expoPluginData(context: { pluginData: unknown }): ExpoTransformPluginData {
  return context.pluginData as ExpoTransformPluginData;
}

function createExpoTransformPluginData(
  input: NoxcturnalTransformInput,
  sourceFacts = input.sourceFacts ?? createNoxcturnalSourceFacts(input.source)
): ExpoTransformPluginData {
  return {
    input,
    sourceFacts,
    serverBoundary: {
      clientProxy: false,
      moduleServerActions: false,
      serverProxy: false,
      handledDirectives: new Set(),
    },
  };
}

export function metroPluginData(context: { pluginData: unknown }): MetroTransformPluginData {
  return context.pluginData as MetroTransformPluginData;
}

function createMetroTransformPluginData(
  input: NoxcturnalMetroTransformInput,
  sourceFacts = input.sourceFacts ?? createNoxcturnalSourceFacts(input.source)
): MetroTransformPluginData {
  const hermesBytecode =
    getBaseProfile(input) === 'hermes-v1' && input.options.customTransformOptions?.bytecode === '1';
  return {
    ...createExpoTransformPluginData(input, sourceFacts),
    input,
    shared: {},
    collectOnly: String(input.options.customTransformOptions?.optimize) === 'true',
    normalizePseudoGlobals:
      input.options.minify &&
      !hermesBytecode &&
      input.config.unstable_disableNormalizePseudoGlobals !== true &&
      input.config.unstable_disableModuleWrapping !== true &&
      input.source.length <= (input.config.optimizationSizeLimit ?? Number.POSITIVE_INFINITY) &&
      !sourceFacts.hasPseudoGlobals,
  };
}

function needsServerExportsPhase(
  input: NoxcturnalTransformInput,
  sourceFacts: NoxcturnalSourceFacts
): boolean {
  // `"use client"` is metadata only in an ordinary client graph. React Server
  // graphs remain unconditional below, where the directive creates a proxy.
  // Client-side `"use server"`/`"use dom"` references still require this phase.
  const hasActionableClientDirective = sourceFacts.hasActionableClientDirective;
  const isLoaderBundle = String(input.options.customTransformOptions?.isLoaderBundle) === 'true';
  const hasRouterServerExport =
    isInExpoRouterAppDirectory(input) &&
    sourceFacts.hasExport &&
    (isLoaderBundle || sourceFacts.hasRouterServerExport);
  // React Server transforms also enforce restricted-import and restricted-API
  // boundaries for ordinary modules, even when no directive is present.
  return (
    input.options.customTransformOptions?.environment === 'react-server' ||
    hasActionableClientDirective ||
    hasRouterServerExport
  );
}

export interface MetroLiveModule {
  source: string;
  requiredLocal: string;
  requireCall: string;
  defaultLocal?: string;
  namespaceLocal?: string;
  afterImport: (
    | { kind: 'statement'; code: string }
    | { kind: 'default-interop'; code: string }
    | { kind: 'namespace-interop'; code: string }
  )[];
  exportAll: boolean;
  referenced: boolean;
  defaultReferenced: boolean;
  namespaceReferenced: boolean;
  sideEffect: boolean;
}

export interface MetroLiveBindingsState {
  sawEsm: boolean;
  modules: Map<string, MetroLiveModule>;
  moduleOrder: MetroLiveModule[];
  importedBindings: Map<string, string>;
  exportStatements: string[];
  deferredExports: (
    | { kind: 'specifier'; local: string; exported: string }
    | { kind: 'declaration'; name: string; assign: boolean }
  )[];
}

export type NoxcturnalTransformAttempt =
  | { status: 'complete'; result: NativeTransformResult }
  | { status: 'fallback'; reason: string };

export type NoxcturnalMetroTransformAttempt =
  | {
      status: 'complete';
      result: NativeTransformResult;
      dependencies: readonly Dependency[];
      dependencyMapName: string;
    }
  | { status: 'fallback'; reason: string };

export interface NoxcturnalTransformInput {
  filename: string;
  source: string;
  projectRoot: string;
  options: JsTransformOptions;
  /** False when Metro is invoking a custom Babel transformer. */
  isDefaultExpoTransformer: boolean;
  /**
   * True when Babel's resolved project configuration differs from Expo's default
   * preset recipe. Config filenames and source text are deliberately irrelevant.
   */
  hasNonDefaultBabelConfig?: boolean;
  /** Exact semver exposed to Babel as its caller's `babelRuntimeVersion`. */
  enableBabelRuntime?: boolean | string;
  /** Optional precomputed source classification. */
  sourceFacts?: NoxcturnalSourceFacts;
}

export interface NoxcturnalSourceFacts {
  directive?: 'client' | 'server' | 'dom';
  hasActionableClientDirective: boolean;
  hasFlowPragma: boolean;
  hasCodegenNames: boolean;
  hasExport: boolean;
  hasRouterServerExport: boolean;
  hasPseudoGlobals: boolean;
  hasDefineCandidate: boolean;
  hasPublicEnv: boolean;
  hasProcess: boolean;
  hasPlatform: boolean;
  hasSelect: boolean;
  hasClass: boolean;
  hasFinally: boolean;
  hasSuper: boolean;
  hasAsync: boolean;
  hasArrow: boolean;
  hasAsyncArrowNonSimpleParamsCandidate: boolean;
  hasClassInFinallyCandidate: boolean;
  hasSuperInObjectAccessorCandidate: boolean;
  hasLetOrConst: boolean;
  hasStaticBlock: boolean;
  hasAsyncGenerator: boolean;
  hasPrivateSyntax: boolean;
  hasFor: boolean;
  hasOf: boolean;
  hasSpread: boolean;
  hasSlash: boolean;
  hasJsxCandidate: boolean;
  hasComments: boolean;
  reactNativeCodegen?: boolean;
}

const SOURCE_SIGNAL =
  /["']use (?:server|dom)["']|@flow\b|codegenNativeComponent|codegenNativeCommands|TurboModule|\bexport\b|\b(?:loader|generateMetadata)\b|\b(?:global|module|exports)\b|\b(?:process|Platform|__DEV__)\b|\btypeof\s+window\b|EXPO_PUBLIC_|select|\bclass\b|\bfinally\b|\bsuper\b|\basync(?:\s+function)?\s*\*|\basync\b|\bstatic\s*\{|#[A-Za-z_$][\w$]*/g;

export function createNoxcturnalSourceFacts(source: string): NoxcturnalSourceFacts {
  const facts: NoxcturnalSourceFacts = {
    directive: source.match(/^[\t ]*["']use (client|server|dom)["']/m)?.[1] as
      | NoxcturnalSourceFacts['directive']
      | undefined,
    hasActionableClientDirective: false,
    hasFlowPragma: false,
    hasCodegenNames: false,
    hasExport: false,
    hasRouterServerExport: false,
    hasPseudoGlobals: false,
    hasDefineCandidate: false,
    hasPublicEnv: false,
    hasProcess: false,
    hasPlatform: false,
    hasSelect: false,
    hasClass: false,
    hasFinally: false,
    hasSuper: false,
    hasAsync: false,
    hasArrow: source.includes('=>'),
    hasAsyncArrowNonSimpleParamsCandidate: hasAsyncArrowNonSimpleParamsCandidate(source),
    hasClassInFinallyCandidate: hasOrderedSignals(source, /\bfinally\b/g, /\bclass\b/g),
    hasSuperInObjectAccessorCandidate: hasOrderedSignals(
      source,
      /\b(?:get|set)\b/g,
      /\bsuper\s*(?:\.|\[)/g
    ),
    hasLetOrConst: /\b(?:let|const)\b/.test(source),
    hasStaticBlock: false,
    hasAsyncGenerator: false,
    hasPrivateSyntax: false,
    hasFor: source.includes('for'),
    hasOf: source.includes('of'),
    hasSpread: source.includes('...'),
    hasSlash: source.includes('/'),
    hasJsxCandidate: source.includes('<'),
    hasComments: source.includes('/*') || source.includes('//'),
  };
  for (const match of source.matchAll(SOURCE_SIGNAL)) {
    const signal = match[0];
    if (signal.includes('use server') || signal.includes('use dom'))
      facts.hasActionableClientDirective = true;
    else if (signal === '@flow') facts.hasFlowPragma = true;
    else if (
      signal === 'codegenNativeComponent' ||
      signal === 'codegenNativeCommands' ||
      signal === 'TurboModule'
    )
      facts.hasCodegenNames = true;
    else if (signal === 'export') facts.hasExport = true;
    else if (signal === 'loader' || signal === 'generateMetadata')
      facts.hasRouterServerExport = true;
    else if (signal === 'global' || signal === 'module' || signal === 'exports')
      facts.hasPseudoGlobals = true;
    else if (signal === 'process') {
      facts.hasProcess = true;
      facts.hasDefineCandidate = true;
    } else if (signal === 'Platform') {
      facts.hasPlatform = true;
      facts.hasDefineCandidate = true;
    } else if (signal === '__DEV__' || signal.startsWith('typeof')) facts.hasDefineCandidate = true;
    else if (signal === 'EXPO_PUBLIC_') facts.hasPublicEnv = true;
    else if (signal === 'select') facts.hasSelect = true;
    else if (signal === 'class') facts.hasClass = true;
    else if (signal === 'finally') facts.hasFinally = true;
    else if (signal === 'super') facts.hasSuper = true;
    else if (signal.startsWith('async')) {
      facts.hasAsync = true;
      if (signal.includes('*')) facts.hasAsyncGenerator = true;
    } else if (signal.startsWith('static')) facts.hasStaticBlock = true;
    else if (signal.startsWith('#')) facts.hasPrivateSyntax = true;
  }
  return facts;
}

/**
 * Whether a left-hand signal occurs before a right-hand signal.
 *
 * Expressing this as `left[\s\S]*right` makes V8 retry the greedy middle from
 * every left-hand match when the right-hand signal is absent or near EOF. Large
 * generated bundles contain thousands of words such as `get`, so that shape is
 * quadratic. Two forward searches preserve the deliberately broad prerequisite
 * while making its worst case linear.
 */
function hasOrderedSignals(source: string, left: RegExp, right: RegExp): boolean {
  const leftMatch = left.exec(source);
  if (leftMatch == null) return false;
  right.lastIndex = leftMatch.index + leftMatch[0].length;
  return right.test(source);
}

function hasAsyncArrowNonSimpleParamsCandidate(source: string): boolean {
  let arrow = source.indexOf('=>');
  let asyncSearchFrom = 0;
  let asyncStart = -1;
  while (arrow !== -1) {
    for (let next = source.indexOf('async', asyncSearchFrom); next !== -1 && next < arrow; ) {
      asyncStart = next;
      asyncSearchFrom = next + 5;
      next = source.indexOf('async', asyncSearchFrom);
    }
    if (
      asyncStart !== -1 &&
      !/[$\w]/.test(source[asyncStart - 1] ?? '') &&
      !/[$\w]/.test(source[asyncStart + 5] ?? '')
    ) {
      const parameters = source.slice(asyncStart + 5, arrow).trim();
      if (
        !/^[$A-Z_a-z][$\w]*$/.test(parameters) &&
        !/^\(\s*(?:[$A-Z_a-z][$\w]*\s*(?:,\s*[$A-Z_a-z][$\w]*\s*)*)?\)$/.test(parameters)
      ) {
        return true;
      }
    }
    arrow = source.indexOf('=>', arrow + 2);
  }
  return false;
}

export interface NoxcturnalMetroTransformInput extends NoxcturnalTransformInput {
  config: {
    allowOptionalDependencies: boolean | { exclude: string[] };
    asyncRequireModulePath: string;
    globalPrefix: string;
    unstable_compactOutput: boolean;
    unstable_dependencyMapReservedName?: string | null;
    unstable_disableNormalizePseudoGlobals?: boolean;
    optimizationSizeLimit?: number;
    minifierConfig?: { output?: { comments?: boolean } };
    unstable_disableModuleWrapping?: boolean;
    unstable_allowRequireContext?: boolean;
    unstable_renameRequire?: boolean;
  };
}

let noxcturnal: Noxcturnal | undefined;

function loadNoxcturnal(): Noxcturnal {
  // Keep native initialization off the legacy and early-fallback paths.
  if (!noxcturnal) {
    const loaded = require('noxcturnal') as Noxcturnal;
    noxcturnal = loaded;
  }
  return noxcturnal;
}

function literal(value: unknown): string {
  if (value === undefined) return 'undefined';
  const result = JSON.stringify(value);
  return result === undefined ? 'undefined' : result;
}

export function mappedLiteral(context: PluginContext, value: unknown) {
  if (value === undefined) return context.code.parseExpression('undefined');
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return {
      ...context.code.literal(value),
      mapping: 'anchor-boundaries' as const,
    };
  }
  return context.code.parseExpression(literal(value));
}

export function isNodeModule(filename: string): boolean {
  return filename.includes('node_modules');
}

type BaseProfile = 'hermes-v0' | 'hermes-v1' | 'web' | 'webview';

function getBaseProfile(input: NoxcturnalTransformInput): BaseProfile {
  const environment = input.options.customTransformOptions?.environment;
  if (input.options.customTransformOptions?.dom != null) return 'webview';
  if (
    input.options.platform === 'web' ||
    environment === 'node' ||
    environment === 'react-server'
  ) {
    return 'web';
  }
  if (
    input.options.unstable_transformProfile === 'hermes-stable' ||
    input.options.unstable_transformProfile === 'hermes-canary'
  ) {
    return 'hermes-v1';
  }
  return 'hermes-v0';
}

export function usesPublicEnvPlugin(input: NoxcturnalTransformInput): boolean {
  const environment = input.options.customTransformOptions?.environment;
  return !isNodeModule(input.filename) && environment !== 'node' && environment !== 'react-server';
}

export function isPathInsideRoot(
  root: string,
  candidate: string,
  pathImplementation: Pick<typeof path, 'relative' | 'isAbsolute' | 'sep'> = path
): boolean {
  const relative = pathImplementation.relative(root, candidate);
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${pathImplementation.sep}`) &&
    !pathImplementation.isAbsolute(relative)
  );
}

function isInExpoRouterAppDirectory(input: NoxcturnalTransformInput): boolean {
  const routerRootOption = input.options.customTransformOptions?.routerRoot;
  const routerRoot = typeof routerRootOption === 'string' ? decodeURI(routerRootOption) : 'app';
  const absoluteRouterRoot = path.isAbsolute(routerRoot)
    ? routerRoot
    : path.join(input.projectRoot, routerRoot);
  return isPathInsideRoot(absoluteRouterRoot, input.filename);
}

function isSupportedJavaScriptSource(filename: string): boolean {
  return (
    /\.(?:[cm]?[jt]s|jsx|tsx)$/.test(filename) ||
    filename.startsWith('\0polyfill:') ||
    /(?:^|[/\\])[^/\\?]+\?ctx=[^/\\]+$/.test(filename)
  );
}

/** Whether Expo must preserve this source for React Native Codegen and Babel. */
function isReactNativeCodegenSource(
  input: NoxcturnalTransformInput,
  sourceFacts: NoxcturnalSourceFacts
): boolean {
  return (
    sourceFacts.hasCodegenNames &&
    (sourceFacts.reactNativeCodegen ??= isReactNativeCodegenCandidate(input.source, input.filename))
  );
}

function getEarlyFallbackReason(
  input: NoxcturnalTransformInput,
  allowProductionAppSource = false,
  sourceFacts = input.sourceFacts ?? createNoxcturnalSourceFacts(input.source)
): string | null {
  const { filename, options, source } = input;
  const isDependency = isNodeModule(filename);
  if (!isDependency && !allowProductionAppSource) {
    return 'not-node-modules';
  }
  if (!isDependency) {
    const reactCompiler = options.customTransformOptions?.reactCompiler as
      | 'true'
      | true
      | undefined;
    if (reactCompiler === true || reactCompiler === 'true') {
      if (sourceFacts.hasFlowPragma) {
        return 'react-compiler-flow-source';
      }
    }
    const directive = sourceFacts.directive;
    if (
      directive &&
      !(
        directive === 'dom' ||
        directive === 'server' ||
        (directive === 'client' && options.customTransformOptions?.environment === 'react-server')
      )
    ) {
      return 'expo-directive';
    }
  }
  if (!input.isDefaultExpoTransformer) return 'custom-babel-transformer';
  if (input.hasNonDefaultBabelConfig) return 'non-default-babel-config';
  if (options.type === 'asset') return 'asset';
  if (!isSupportedJavaScriptSource(filename)) return 'unsupported-source-extension';
  if (getBaseProfile(input) !== 'web' && isReactNativeCodegenSource(input, sourceFacts)) {
    return 'react-native-codegen';
  }
  const directive = sourceFacts.directive;
  if (
    directive &&
    !(
      (directive === 'client' &&
        (options.customTransformOptions?.environment == null ||
          options.customTransformOptions?.environment === 'react-server')) ||
      directive === 'dom' ||
      directive === 'server'
    )
  ) {
    return 'expo-directive';
  }
  if (source.includes('worklet') && WORKLET_DIRECTIVE.test(source)) return 'worklets';
  if (mayAutoWorkletize(source)) {
    return 'worklets-candidate';
  }
  return null;
}

/** A function the worklets plugin workletizes because it says so itself. */
const WORKLET_DIRECTIVE = /^[\t ]*["']worklet["']/m;

/**
 * Calls whose function arguments the worklets plugin workletizes without a
 * directive, taken from the plugin's own `reanimatedFunctionHooks` and
 * `reanimatedObjectHooks`. Matching the call rather than the bare name keeps a
 * barrel file that merely re-exports `withTiming` out of the gate.
 */
const REANIMATED_AUTOWORKLETIZED =
  /\b(?:useFrameCallback|useAnimatedStyle|useAnimatedProps|createAnimatedPropAdapter|useDerivedValue|useAnimatedScrollHandler|useAnimatedReaction|withTiming|withSpring|withDecay|withRepeat|runOnUI|executeOnUIRuntimeSync|scheduleOnUI|runOnUISync|runOnUIAsync|runOnRuntime|runOnRuntimeSync|runOnRuntimeAsync|scheduleOnRuntime|runOnRuntimeSyncWithId|scheduleOnRuntimeWithId)\s*[(<]/;

/** The plugin's `gestureHandlerObjectHooks`, which workletize a config object. */
const GESTURE_HANDLER_OBJECT_HOOK =
  /\b(?:useTapGesture|usePanGesture|usePinchGesture|useRotationGesture|useFlingGesture|useLongPressGesture|useNativeGesture|useManualGesture|useHoverGesture)\s*[(<]/;

/**
 * The plugin's `gestureHandlerBuilderMethods`, which are ordinary callback names
 * and say nothing on their own. The plugin only acts on one whose receiver is a
 * `Gesture.<Kind>()` chain, so both have to be present — otherwise every
 * `onStart(` in the graph matches, including the gesture library's own source.
 */
const GESTURE_HANDLER_BUILDER_CALL =
  /\.(?:onBegin|onStart|onEnd|onFinalize|onUpdate|onChange|onTouchesDown|onTouchesMove|onTouchesUp|onTouchesCancelled)\s*\(/;
const GESTURE_HANDLER_OBJECT_CALL =
  /\bGesture\s*\.\s*(?:Tap|Pan|Pinch|Rotation|Fling|LongPress|ForceTouch|Native|Manual|Race|Simultaneous|Exclusive|Hover)\s*\(/;

/**
 * Whether the worklets Babel plugin could rewrite this file with no `'worklet'`
 * directive to point at.
 *
 * This used to be a substring match on `react-native-reanimated` or
 * `react-native-worklets`, which was wrong in both directions. Measured against
 * the plugin itself over a 5.5k-module graph — running it on every file and
 * comparing with a plain reprint — the package-name match missed 3 of the 246
 * files the plugin changes and gated 48 (185 KB) it does not. The three it
 * missed reach gesture APIs without naming either package, so they were
 * transformed natively and their callbacks silently never workletized.
 *
 * Deriving the test from the plugin's own trigger sets, and matching call sites
 * rather than names, catches all 246 and gates 15 (55 KB).
 */
function mayAutoWorkletize(source: string): boolean {
  return (
    ((source.includes('use') ||
      source.includes('runOn') ||
      source.includes('scheduleOn') ||
      source.includes('with')) &&
      REANIMATED_AUTOWORKLETIZED.test(source)) ||
    (source.includes('Gesture') &&
      (GESTURE_HANDLER_OBJECT_HOOK.test(source) ||
        (source.includes('.on') &&
          GESTURE_HANDLER_OBJECT_CALL.test(source) &&
          GESTURE_HANDLER_BUILDER_CALL.test(source))))
  );
}

function helperPolicy(input: NoxcturnalTransformInput): PreflightPlan['helpers'] {
  const babelRuntimeVersion =
    typeof input.enableBabelRuntime === 'string' ? input.enableBabelRuntime : undefined;
  return input.enableBabelRuntime === false
    ? { mode: 'inline' }
    : {
        mode: 'runtime',
        moduleName: '@babel/runtime',
        version: babelRuntimeVersion,
      };
}

function getProfilePreflightConfig(
  input: NoxcturnalTransformInput,
  facts: ProfilePreflightFacts
): PreflightTransforms {
  switch (getBaseProfile(input)) {
    case 'webview':
      return getWebViewPreflightConfig(facts);
    case 'web':
      return getWebPreflightConfig(facts);
    case 'hermes-v1':
      return getHermesV1PreflightConfig(facts);
    case 'hermes-v0':
      return getHermesV0PreflightConfig(facts);
  }
}

function createProfilePreflight(
  input: NoxcturnalTransformInput,
  sourceFacts: NoxcturnalSourceFacts
): PreflightPlan | null {
  const { options } = input;
  // These are generated, already-lowered development bundles. Their diagnostic
  // strings and comments contain JSX-looking `<Component>` text, while the
  // DevTools bundle also contains URL fragments and colours that resemble
  // private names (`#sourceloc`, `#ee78e6`). The cheap source facts therefore
  // select a language preflight that parses the entire 600–700 KiB file only to
  // return it unchanged. Keep the native Metro phase (dependency collection and
  // module wrapping), but do not run this redundant language phase.
  if (
    /(?:^|[/\\])react-devtools-core[/\\]dist[/\\]backend\.js$/.test(input.filename) ||
    /(?:^|[/\\])react-native[/\\]Libraries[/\\]Renderer[/\\]implementations[/\\]ReactFabric-dev\.js$/.test(
      input.filename
    )
  ) {
    return null;
  }
  const enableReactRefresh =
    options.dev &&
    !isNodeModule(input.filename) &&
    options.customTransformOptions?.environment == null;
  const isTypeScript = /\.(?:[cm]?ts|tsx)$/.test(input.filename);
  const hasExplicitJsxExtension = /\.(?:jsx|tsx)$/.test(input.filename);
  const allowsJsx = /\.(?:[cm]?js|jsx|tsx)$/.test(input.filename);
  // Every JSX form contains `<`. This is only a lossless prerequisite for
  // avoiding a native call; the native preflight decides from the parsed AST
  // whether JSX is actually present.
  const mayContainJsx = !hasExplicitJsxExtension && allowsJsx && sourceFacts.hasJsxCandidate;
  const hasStaticBlock = sourceFacts.hasStaticBlock;
  const hasAsyncGenerator = sourceFacts.hasAsyncGenerator;
  const hasBlockScopedDeclaration = sourceFacts.hasLetOrConst;
  const hasClassSyntax = sourceFacts.hasClass;
  const hasForOfCandidate = sourceFacts.hasFor && sourceFacts.hasOf;
  const hasSpreadCandidate = sourceFacts.hasSpread;
  const hasAsyncCandidate = sourceFacts.hasAsync;
  const hasRegexpLiteralCandidate = sourceFacts.hasSlash;
  const hasDecoratorCandidate = /@\w/.test(input.source);
  const nonHermes = options.customTransformOptions?.engine !== 'hermes';
  const hasObjectRestSpread = nonHermes && hasSpreadCandidate;
  const profileTransforms = getProfilePreflightConfig(input, {
    hasAsync: hasAsyncCandidate,
    hasAsyncGenerator,
    hasBlockScopedDeclaration,
    hasClass: hasClassSyntax,
    hasForOf: hasForOfCandidate,
    hasPrivateSyntax: sourceFacts.hasPrivateSyntax,
    hasRegexpLiteral: hasRegexpLiteralCandidate,
    hasStaticBlock,
  });
  const hasProfileWork = Object.values(profileTransforms).some(Boolean);
  const hasOtherLanguageWork =
    isTypeScript ||
    enableReactRefresh ||
    hasProfileWork ||
    hasDecoratorCandidate ||
    hasObjectRestSpread;
  // Avoid a parse/codegen boundary for the overwhelmingly common file that has
  // none of this recipe's language work. Flow without JSX is already rendered by
  // its focused native erasure and does not need a second print.
  if (
    !isTypeScript &&
    !hasExplicitJsxExtension &&
    !mayContainJsx &&
    !hasProfileWork &&
    !hasDecoratorCandidate &&
    !hasObjectRestSpread &&
    !enableReactRefresh
  ) {
    return null;
  }
  return {
    transforms: {
      ...profileTransforms,
      legacyDecorators: hasDecoratorCandidate,
      objectRestSpread: hasObjectRestSpread
        ? {
            loose: true,
            useBuiltIns: true,
          }
        : undefined,
    },
    // Expo owns this recipe. These choices mirror its Hermes-v1 and React configs
    // without exposing either config name through Noxcturnal's capability API.
    typescript: isTypeScript ? 'strip' : undefined,
    reactRefresh: enableReactRefresh ? {} : undefined,
    // babel-preset-expo deliberately uses the ordinary automatic runtime in
    // both modes; development only changes purity/Refresh policy outside this
    // native language phase.
    jsx: hasExplicitJsxExtension
      ? 'automatic'
      : mayContainJsx
        ? hasOtherLanguageWork
          ? 'automatic'
          : 'automatic-if-present'
        : undefined,
    jsxImportSource: hasExplicitJsxExtension || mayContainJsx ? 'react' : undefined,
    helpers: helperPolicy(input),
    // Metro's dependency pass still needs ordinary string literals. Compacting at
    // this boundary can turn them into template literals, so output compaction
    // remains a later consumer concern.
    compact: false,
    comments: true,
  };
}

function createReactCompilerPreflight(input: NoxcturnalTransformInput): PreflightPlan | null {
  const reactCompiler = input.options.customTransformOptions?.reactCompiler as
    | 'true'
    | true
    | undefined;
  const environment = input.options.customTransformOptions?.environment;
  if (
    (reactCompiler !== true && reactCompiler !== 'true') ||
    isNodeModule(input.filename) ||
    environment === 'node' ||
    environment === 'react-server'
  ) {
    return null;
  }
  return {
    reactCompiler: {
      compilationMode: 'infer',
      // babel-plugin-react-compiler defaults to critical errors in development;
      // Babel preset Expo explicitly selects NONE in production.
      panicThreshold: input.options.dev ? 'critical_errors' : 'none',
      target: '19',
      enableResetCacheOnSourceFileChanges: input.options.dev,
      // Noxcturnal adds the compiler's `use no memo` and `use no forget`
      // defaults, matching Babel preset Expo's merged directive list.
      customOptOutDirectives: ['widget'],
    },
    jsx: 'preserve',
    comments: true,
    compact: false,
  };
}

function parserMode(
  input: NoxcturnalTransformInput,
  sourceFacts = input.sourceFacts ?? createNoxcturnalSourceFacts(input.source)
): 'auto' | 'jsx' {
  // Flow must first reach Noxcturnal's native Flow erasure. For otherwise plain
  // JavaScript files, Babel accepts JSX regardless of whether the extension
  // spells `.jsx`. JSX parsing is therefore an extension policy, not a
  // source-text guess. TypeScript keeps Babel's `.ts`/`.tsx` distinction.
  return !sourceFacts.hasFlowPragma &&
    (/\.(?:[cm]?js|jsx)$/.test(input.filename) ||
      input.filename.startsWith('\0polyfill:') ||
      /(?:^|[/\\])[^/\\?]+\?ctx=[^/\\]+$/.test(input.filename))
    ? 'jsx'
    : 'auto';
}

const stableSourcePlugins = new Map<string, DefinedNativePlugin<any>>();
const stableSourcePhases = new Map<string, PipelinePhase>();
let metroInlineRequiresPhase: PipelinePhase | undefined;

function stableSourcePlugin(
  key: string,
  create: () => DefinedNativePlugin<any>
): DefinedNativePlugin<any> {
  const cached = stableSourcePlugins.get(key);
  if (cached) return cached;
  const plugin = create();
  stableSourcePlugins.set(key, plugin);
  return plugin;
}

function stableSourcePhase(
  nox: Noxcturnal,
  keys: readonly string[],
  plugins: readonly DefinedNativePlugin<any>[]
): PipelinePhase {
  const key = keys.join('\u001f');
  const cached = stableSourcePhases.get(key);
  if (cached) return cached;
  const phase = nox.definePipelinePhase({ name: 'expo-source', plugins });
  if (stableSourcePhases.size < 128) stableSourcePhases.set(key, phase);
  return phase;
}

function getMetroInlineRequiresPhase(nox: Noxcturnal): PipelinePhase {
  return (metroInlineRequiresPhase ??= nox.definePipelinePhase({
    name: 'metro-inline-requires',
    requiresPrintedInput: true,
    plugins: [createInlineRequiresPlugin(nox)],
  }));
}

function createPipeline(
  nox: Noxcturnal,
  input: NoxcturnalTransformInput,
  pluginData: ExpoTransformPluginData,
  includeModuleEligibility = true
): NativePipeline {
  const { options } = input;
  const { sourceFacts } = pluginData;
  const baseProfile = getBaseProfile(input);
  const isHermesV1 = baseProfile === 'hermes-v1';
  const supportsModernSyntax = isHermesV1 || baseProfile === 'web';
  const plugins: DefinedNativePlugin<any>[] = [];
  const sourcePluginKeys: string[] = [];
  const addPlugin = (key: string, create: () => DefinedNativePlugin<any>) => {
    sourcePluginKeys.push(key);
    plugins.push(stableSourcePlugin(key, create));
  };
  // The complete Metro path folds the two read-only policy plugins into its
  // existing dependency batch. The isolated source-pipeline test adapter needs them here.
  if (includeModuleEligibility) {
    if (options.experimentalImportSupport) {
      addPlugin(`eligibility:${supportsModernSyntax}:native-esm`, () =>
        createNativeEsmEligibilityPlugin(nox, supportsModernSyntax)
      );
    } else {
      addPlugin(`eligibility:${supportsModernSyntax}:module-query`, () =>
        createModuleEligibilityPlugin(nox, supportsModernSyntax)
      );
    }
    addPlugin('cjs-detection', () => createCjsDetectionPlugin(nox));
  }
  if (isHermesV1 && sourceFacts.hasAsyncArrowNonSimpleParamsCandidate) {
    addPlugin('async-arrow', () => createFixHermesV1AsyncArrowNonSimpleParamsPlugin(nox));
  }
  if (isHermesV1 && sourceFacts.hasClassInFinallyCandidate) {
    addPlugin('class-finally', () => createFixHermesV1ClassInFinallyPlugin(nox));
  }
  if (isHermesV1 && sourceFacts.hasSuperInObjectAccessorCandidate) {
    addPlugin('super-accessor', () => createFixHermesV1SuperInObjectAccessorPlugin(nox));
  }
  if (baseProfile === 'hermes-v0' || baseProfile === 'webview') {
    addPlugin('display-name', () => createReactDisplayNamePlugin(nox));
  }
  if (sourceFacts.hasDefineCandidate) {
    addPlugin('define-globals', () => createDefinePlugin(nox));
  }
  if (sourceFacts.hasProcess) {
    addPlugin('process-env', () => createProcessEnvPlugin(nox));
  }
  if (!options.dev && sourceFacts.hasPlatform && sourceFacts.hasSelect) {
    addPlugin(`platform-select:${options.platform ?? ''}`, () =>
      createPlatformSelectPlugin(nox, options.platform)
    );
  }
  if (input.source.includes('APP_MANIFEST')) {
    addPlugin('inline-manifest', () => createExpoInlineManifestPlugin(nox));
  }
  if (input.source.includes('@expo/ui') && /from\s*["']@expo\/ui["']/.test(input.source)) {
    addPlugin(`expo-ui:${options.platform ?? ''}`, () => createExpoUiPlugin(nox, options.platform));
  }
  if (
    input.source.includes('widget') &&
    /^[\t ]*["']widget["']/m.test(input.source) &&
    hasExpoWidgets(input.projectRoot)
  ) {
    addPlugin('expo-widgets', () => createExpoWidgetsPlugin(nox));
  }
  if (
    options.customTransformOptions?.environment !== 'react-server' &&
    input.source.includes('server-only') &&
    /["']server-only["']/.test(input.source)
  ) {
    addPlugin('restricted-imports:server-only', () =>
      createEnvironmentRestrictedImportsPlugin(nox, 'server-only')
    );
  }
  if (
    options.platform === 'web' &&
    input.source.includes('react-native') &&
    /["']react-native(?:-web)?["']/.test(input.source)
  ) {
    addPlugin('react-native-web', () => createReactNativeWebPlugin(nox));
  }
  if (
    options.dev &&
    usesPublicEnvPlugin(input) &&
    sourceFacts.hasProcess &&
    sourceFacts.hasPublicEnv
  ) {
    addPlugin('development-public-env', () => createDevelopmentPublicEnvPlugin(nox));
  }
  const needsDeepImportWarnings =
    options.dev &&
    !isNodeModule(input.filename) &&
    String(options.customTransformOptions?.disableDeepImportWarnings ?? 'false') !== 'true';
  if (needsDeepImportWarnings && input.source.includes('react-native/')) {
    addPlugin('deep-import-warnings', () => createDeepReactNativeImportWarningsPlugin(nox));
  }
  if (
    String(options.customTransformOptions?.transformImportMeta) !== 'false' &&
    input.source.includes('import.meta')
  ) {
    addPlugin('import-meta', () => createImportMetaPlugin(nox));
  }
  const native = createProfilePreflight(input, sourceFacts);
  const reactCompiler = createReactCompilerPreflight(input);
  // This phase handles directive-based server boundaries and a very small set
  // of Expo Router exports. Most dependencies contain neither. Omitting it
  // avoids an otherwise wasted JS dispatch and, when a native language phase
  // follows, an AST parse whose unchanged result cannot be reused.
  const includeServerExportsPhase = needsServerExportsPhase(input, sourceFacts);
  const isReactServer = options.customTransformOptions?.environment === 'react-server';
  // These plugins read the current file and their shared boundary facts from
  // plugin data, so each is defined once for the process and interned. Their plans
  // and routes therefore compile once rather than once per file.
  const reactServerPlugins = isReactServer
    ? [
        stableSourcePlugin('react-server-client-proxy', () =>
          createReactServerClientProxyPlugin(nox)
        ),
        stableSourcePlugin('react-server-module-actions', () =>
          createReactServerModuleActionsPlugin(nox)
        ),
        stableSourcePlugin('react-server-directive-boundary', () =>
          createReactServerDirectiveBoundaryPlugin(nox)
        ),
        stableSourcePlugin('restricted-imports:client-only', () =>
          createEnvironmentRestrictedImportsPlugin(
            nox,
            'client-only',
            (context) => serverBoundary(context).clientProxy
          )
        ),
        stableSourcePlugin('restricted-react-apis', () =>
          createEnvironmentRestrictedReactApisPlugin(
            nox,
            (context) => serverBoundary(context).clientProxy
          )
        ),
      ]
    : [];
  const clientServerPlugins = isReactServer
    ? []
    : [
        stableSourcePlugin('client-server-reference-proxy', () =>
          createClientServerReferenceProxyPlugin(nox)
        ),
        stableSourcePlugin('client-server-directive-boundary', () =>
          createClientServerDirectiveBoundaryPlugin(nox)
        ),
      ];
  return nox.defineNativePipeline({
    phases: [
      ...(reactCompiler == null ? [] : [{ name: 'react-compiler', native: reactCompiler }]),
      ...(includeServerExportsPhase
        ? [
            {
              name: 'expo-router-server-exports',
              editEffect: 'bindings' as const,
              plugins: [
                ...reactServerPlugins,
                ...clientServerPlugins,
                ...(isReactServer
                  ? []
                  : [stableSourcePlugin('dom-component', () => createExpoDomComponentPlugin(nox))]),
                ...(isInExpoRouterAppDirectory(input)
                  ? [
                      stableSourcePlugin('router-server-exports', () =>
                        createExpoRouterServerExportsPlugin(nox)
                      ),
                    ]
                  : []),
              ],
            },
          ]
        : []),
      ...(native == null ? [] : [{ name: 'expo-language', native }]),
      // Type syntax must be erased before ordinary Expo visitors run. Besides
      // matching Babel's ordering, this lets the native language plan lower
      // the JavaScript emitted from TypeScript before Expo visitors observe it.
      ...(plugins.length === 0 ? [] : [stableSourcePhase(nox, sourcePluginKeys, plugins)]),
      ...(options.inlineRequires ? [getMetroInlineRequiresPhase(nox)] : []),
    ],
  });
}

const metroModulePhases = new Map<string, PipelinePhase>();
let metroScriptPhase: PipelinePhase | undefined;
let metroEsmGlobalsPhase: PipelinePhase | undefined;

function getMetroEsmGlobalsPhase(nox: Noxcturnal): PipelinePhase {
  if (metroEsmGlobalsPhase) return metroEsmGlobalsPhase;
  metroEsmGlobalsPhase = nox.definePipelinePhase({
    name: 'metro-esm-pseudo-global-renames',
    editEffect: 'bindings',
    plugins: [createMetroEsmGlobalsPlugin(nox)],
  });
  return metroEsmGlobalsPhase;
}

function getMetroModulePhase(nox: Noxcturnal, input: NoxcturnalMetroTransformInput): PipelinePhase {
  const baseProfile = getBaseProfile(input);
  const supportsModernSyntax = baseProfile === 'hermes-v1' || baseProfile === 'web';
  const key = `${supportsModernSyntax}:${input.options.experimentalImportSupport === true}`;
  const cached = metroModulePhases.get(key);
  if (cached) return cached;
  const phase = nox.definePipelinePhase({
    name: 'module-and-dependencies',
    // These visitors are routed by parsed node kinds, so installing them
    // unconditionally is both cheap and correct for comment-prefixed,
    // shebang-prefixed, and otherwise non-regex-detectable modules.
    plugins: [
      stableSourcePlugin(`eligibility:${supportsModernSyntax}:native-esm`, () =>
        createNativeEsmEligibilityPlugin(nox, supportsModernSyntax)
      ),
      stableSourcePlugin('cjs-detection', () => createCjsDetectionPlugin(nox)),
      createMetroDependencyPlugin(nox),
      createMetroLiveBindingsPlugin(nox),
    ],
  });
  metroModulePhases.set(key, phase);
  return phase;
}

function getMetroScriptPhase(nox: Noxcturnal): PipelinePhase {
  if (metroScriptPhase) return metroScriptPhase;
  metroScriptPhase = nox.definePipelinePhase({
    name: 'script',
    plugins: [
      nox.defineNativePlugin({
        name: 'metro-native-script',
        contract: {
          metadata: { writes: ['dependencies', 'dependencyMapName'] },
        },
        visitors: [
          nox.defineVisitor('ImportDeclaration', {}, (path) => path.unsupported('script-import')),
          nox.defineVisitor('ExportAllDeclaration', {}, (path) =>
            path.unsupported('script-export')
          ),
          nox.defineVisitor('ExportDefaultDeclaration', {}, (path) =>
            path.unsupported('script-export')
          ),
          nox.defineVisitor('ExportNamedDeclaration', {}, (path) =>
            path.unsupported('script-export')
          ),
        ],
        post(context) {
          context.metadata.set('dependencies', []);
          context.metadata.set('dependencyMapName', '');
          context.editor.prepend('(function (global) {\n');
          context.editor.append(
            `${context.source.endsWith('\n') ? '' : '\n'}})(typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this);`
          );
        },
      }),
    ],
  });
  return metroScriptPhase;
}

function createFullMetroPipeline(
  nox: Noxcturnal,
  input: NoxcturnalMetroTransformInput,
  pluginData: MetroTransformPluginData
): NativePipeline {
  const preserveSourceComments =
    pluginData.sourceFacts.hasComments &&
    (!input.options.minify || input.config.minifierConfig?.output?.comments === true);
  const sourcePhases = [...createPipeline(nox, input, pluginData, false).phases];
  if (!input.options.dev && !preserveSourceComments) {
    sourcePhases.push({
      name: 'metro-optimization',
      native: {
        optimize: {
          constantFolding: true,
          deadCodeElimination: true,
        },
        comments: true,
      },
    });
  }
  const compactPhases = input.config.unstable_compactOutput
    ? [
        {
          name: 'metro-compact-output',
          native: { compact: true },
        } satisfies NativePipeline['phases'][number],
      ]
    : [];
  return nox.defineNativePipeline({
    phases: [
      ...sourcePhases,
      ...(input.options.type === 'module' &&
      input.options.experimentalImportSupport === true &&
      String(input.options.customTransformOptions?.optimize) !== 'true'
        ? [getMetroEsmGlobalsPhase(nox)]
        : []),
      input.options.type === 'script' ? getMetroScriptPhase(nox) : getMetroModulePhase(nox, input),
      ...compactPhases,
    ],
  });
}

/**
 * Transform a conservative Metro module or script entirely in Noxcturnal. Modules include
 * dependency collection and `__d` wrapping; scripts use Metro's dependency-free polyfill
 * wrapper. A fallback never exposes partially edited source.
 */
export function transformFileFullyWithNoxcturnalSync(
  input: NoxcturnalMetroTransformInput
): NoxcturnalMetroTransformAttempt {
  const sourceFacts = input.sourceFacts ?? createNoxcturnalSourceFacts(input.source);
  const earlyReason = getEarlyFallbackReason(input, true, sourceFacts);
  if (earlyReason) return { status: 'fallback', reason: earlyReason };
  if (input.options.type !== 'module' && input.options.type !== 'script') {
    return { status: 'fallback', reason: 'unsupported-input-type' };
  }
  if (input.options.type === 'script' && input.source.startsWith('#!')) {
    return { status: 'fallback', reason: 'script-hashbang' };
  }
  const nox = loadNoxcturnal();
  const pluginData = createMetroTransformPluginData(input, sourceFacts);
  const pipeline = createFullMetroPipeline(nox, input, pluginData);
  const result = nox.transform(input.source, input.filename, pipeline, {
    parser: parserMode(input, sourceFacts),
    sourceMapMode: 'boundary',
    functionMap: true,
    pluginData,
  });
  if (result.status !== 'complete') return { status: 'fallback', reason: result.reason };
  const dependencies = result.metadata.dependencies;
  const dependencyMapName = result.metadata.dependencyMapName;
  if (!Array.isArray(dependencies) || typeof dependencyMapName !== 'string') {
    throw new nox.NativeTransformError(
      'A complete full-Metro transform returned invalid dependency metadata',
      [
        {
          code: 'native-transform-error',
          message: 'Missing or malformed dependencies or dependencyMapName',
          phase: 'metro-module',
        },
      ],
      ['metro-module'],
      { phase: 'metro-module', reason: 'invalid-metro-metadata' }
    );
  }
  return {
    status: 'complete',
    result,
    dependencies: dependencies as readonly Dependency[],
    dependencyMapName,
  };
}

export async function transformFileFullyWithNoxcturnal(
  input: NoxcturnalMetroTransformInput
): Promise<NoxcturnalMetroTransformAttempt> {
  return transformFileFullyWithNoxcturnalSync(input);
}

/**
 * Low-level source-pipeline adapter for focused plugin tests.
 * The production worker only uses the complete Metro pipeline above.
 */
export function transformNodeModuleWithNoxcturnalSync(
  input: NoxcturnalTransformInput
): NoxcturnalTransformAttempt {
  const sourceFacts = input.sourceFacts ?? createNoxcturnalSourceFacts(input.source);
  const earlyReason = getEarlyFallbackReason(input, true, sourceFacts);
  if (earlyReason) return { status: 'fallback', reason: earlyReason };

  const nox = loadNoxcturnal();
  const pluginData = createExpoTransformPluginData(input, sourceFacts);
  const result: TransformResult = nox.transform(
    input.source,
    input.filename,
    createPipeline(nox, input, pluginData),
    {
      parser: parserMode(input, sourceFacts),
      sourceMapMode: 'boundary',
      functionMap: true,
      pluginData,
    }
  );
  return result.status === 'complete'
    ? { status: 'complete', result }
    : { status: 'fallback', reason: result.reason };
}

export async function transformNodeModuleWithNoxcturnal(
  input: NoxcturnalTransformInput
): Promise<NoxcturnalTransformAttempt> {
  return transformNodeModuleWithNoxcturnalSync(input);
}

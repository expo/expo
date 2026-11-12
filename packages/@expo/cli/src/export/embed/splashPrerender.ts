import type { ExpoConfig } from '@expo/config';
import { convertEntryPointToRelative } from '@expo/config/paths';
import fs from 'fs';
import path from 'path';

import { Log } from '../../log';
import { evalMetroNoHandling } from '../../start/server/getStaticRenderFunctions';
import type { MetroBundlerDevServer } from '../../start/server/metro/MetroBundlerDevServer';

/** File name the native side of `expo-splash-screen` loads from the app bundle / assets. */
export const SPLASH_PRERENDER_FILE_NAME = 'SplashScreenPrerender.json';

export type SplashPrerenderTemplate = {
  name: string;
  props: Record<string, unknown>;
  children: SplashPrerenderTemplate[];
};

/**
 * The component configured through the `expo-splash-screen` config plugin's `prerender` option,
 * or `null` when the option is unset or points at a prebuilt JSON template.
 */
export function getSplashPrerenderComponentPath(projectRoot: string, exp: ExpoConfig): string | null {
  for (const plugin of exp.plugins ?? []) {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-splash-screen') {
      continue;
    }
    // `prerender: './LaunchScreen.tsx'` or `prerender: { component: '...', snapshot: true }`.
    const prerender = plugin[1]?.prerender;
    const component = typeof prerender === 'string' ? prerender : prerender?.component;
    if (typeof component === 'string' && !component.endsWith('.json')) {
      return path.resolve(projectRoot, component);
    }
  }
  return null;
}

/**
 * Renders the launch component through React Native's own Fabric JS renderer and records what it
 * would send to native. The component is bundled with Metro for the target platform (so platform
 * extensions, assets and the project's Babel config apply) and evaluated in Node with a recording
 * `nativeFabricUIManager`. The result is the exact tree of component names and raw props the
 * renderer produces, which the native prerender commits before React Native starts.
 */
/**
 * Writes the Metro entry that renders the launch component. Must run before Metro starts so the
 * file is part of the initial file map.
 */
export function prepareSplashPrerenderEntry(
  projectRoot: string,
  exp: ExpoConfig,
  platform: string
): { componentPath: string; entryFile: string } | null {
  const componentPath = getSplashPrerenderComponentPath(projectRoot, exp);
  if (!componentPath) {
    return null;
  }
  if (!fs.existsSync(componentPath)) {
    throw new Error(`expo-splash-screen: the prerender component does not exist: ${componentPath}`);
  }
  const entryDir = path.join(projectRoot, '.expo', 'splash-prerender');
  fs.mkdirSync(entryDir, { recursive: true });
  const entryFile = path.join(entryDir, `entry.${platform}.js`);
  const relativeImport = path.relative(entryDir, componentPath).split(path.sep).join('/');
  const componentImport = relativeImport.startsWith('.') ? relativeImport : './' + relativeImport;
  fs.writeFileSync(
    entryFile,
    [
      `const React = require('react');`,
      `const ReactFabric = require('react-native/Libraries/Renderer/shims/ReactFabric').default;`,
      `const Component = require('${componentImport}').default;`,
      `ReactFabric.render(React.createElement(Component), 1, undefined, false);`,
      '',
    ].join('\n')
  );
  return { componentPath, entryFile };
}

/**
 * Renders the launch component through React Native's own Fabric JS renderer and records what it
 * would send to native. The component is bundled with Metro for the target platform (so platform
 * extensions, assets and the project's Babel config apply) and evaluated in Node with a recording
 * `nativeFabricUIManager`. The result is the exact tree of component names and raw props the
 * renderer produces, which the native prerender commits before React Native starts.
 */
export async function exportSplashPrerenderAsync({
  projectRoot,
  exp,
  devServer,
  platform,
  entryFile,
}: {
  projectRoot: string;
  exp: ExpoConfig;
  devServer: MetroBundlerDevServer;
  platform: string;
  entryFile: string;
}): Promise<string> {
  const bundles = await devServer.nativeExportBundleAsync(
    exp,
    {
      splitChunks: false,
      mainModuleName: convertEntryPointToRelative(projectRoot, entryFile),
      platform,
      minify: false,
      mode: 'production',
      engine: undefined,
      serializerIncludeMaps: true,
      bytecode: false,
      reactCompiler: false,
    },
    new Map(),
    { unstable_transformProfile: 'default' }
  );
  const code = bundles.artifacts.find((artifact) => artifact.type === 'js')?.source;
  const sourceMap = bundles.artifacts.find((artifact) => artifact.type === 'map')?.source;
  if (typeof code !== 'string') {
    throw new Error(
      'expo-splash-screen: Metro did not produce a JavaScript bundle for the prerender component'
    );
  }

  const template = await recordTemplateAsync({
    projectRoot,
    code,
    filename: entryFile,
    sourceMap: typeof sourceMap === 'string' ? sourceMap : undefined,
    platform,
  });
  warnAboutUnknownComponents(template);
  return JSON.stringify(template);
}

type RecordedNode = { name: string; props: Record<string, unknown>; children: RecordedNode[] };

async function recordTemplateAsync({
  projectRoot,
  code,
  filename,
  sourceMap,
  platform,
}: {
  projectRoot: string;
  code: string;
  filename: string;
  sourceMap?: string;
  platform: string;
}): Promise<SplashPrerenderTemplate> {
  const roots = new Map<number, RecordedNode[]>();
  const node = (name: string, props: Record<string, unknown> | null, children: RecordedNode[] = []): RecordedNode => ({
    name,
    props: props ?? {},
    children,
  });
  // The subset of `nativeFabricUIManager` the renderer uses to build a tree. Everything else is a no-op.
  const fabricUIManager = {
    createNode: (_tag: number, viewName: string, _rootTag: number, props: Record<string, unknown>) =>
      node(viewName, props),
    cloneNode: (n: RecordedNode) => node(n.name, n.props, [...n.children]),
    cloneNodeWithNewChildren: (n: RecordedNode, children?: RecordedNode[]) =>
      node(n.name, n.props, children ? [...children] : []),
    cloneNodeWithNewProps: (n: RecordedNode, newProps: Record<string, unknown>) =>
      node(n.name, { ...n.props, ...newProps }, [...n.children]),
    cloneNodeWithNewChildrenAndProps: (
      n: RecordedNode,
      childrenOrProps: RecordedNode[] | Record<string, unknown>,
      maybeProps?: Record<string, unknown>
    ) =>
      Array.isArray(childrenOrProps)
        ? node(n.name, { ...n.props, ...maybeProps }, [...childrenOrProps])
        : node(n.name, { ...n.props, ...childrenOrProps }, []),
    appendChild: (parent: RecordedNode, child: RecordedNode) => {
      parent.children.push(child);
    },
    createChildSet: () => [] as RecordedNode[],
    appendChildToSet: (set: RecordedNode[], child: RecordedNode) => {
      set.push(child);
    },
    completeRoot: (rootTag: number, childSet: RecordedNode[]) => {
      roots.set(rootTag, childSet);
    },
    registerEventHandler() {},
    dispatchCommand() {},
    sendAccessibilityEvent() {},
    setIsJSResponder() {},
    measure() {},
    measureInWindow() {},
    measureLayout() {},
    findNodeAtPoint() {},
    getBoundingClientRect: () => [0, 0, 0, 0],
    unstable_DiscreteEventPriority: 1,
    unstable_ContinuousEventPriority: 2,
    unstable_DefaultEventPriority: 3,
    unstable_IdleEventPriority: 4,
    unstable_getCurrentEventPriority: () => 3,
  };

  const isApple = platform !== 'android';
  // Layout happens natively with the real window, so these only feed `Dimensions`/`PixelRatio` for
  // components that read them during render.
  const window = { width: 393, height: 852, scale: 3, fontScale: 1 };
  const nativeModules: Record<string, unknown> = {
    PlatformConstants: {
      getConstants: () => ({
        isTesting: false,
        isDisableAnimations: false,
        reactNativeVersion: { major: 0, minor: 0, patch: 0 },
        forceTouchAvailable: false,
        osVersion: isApple ? '18.0' : '35',
        systemName: isApple ? 'iOS' : 'Android',
        interfaceIdiom: 'phone',
        Version: 35,
        Release: '15',
        Brand: '',
        Model: '',
        uiMode: 'normal',
        Fingerprint: '',
        Manufacturer: '',
        Serial: '',
        ServerHost: '',
      }),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: { window, screen: window, windowPhysicalPixels: {}, screenPhysicalPixels: {} },
      }),
    },
    SourceCode: { getConstants: () => ({ scriptURL: '' }) },
    I18nManager: {
      getConstants: () => ({ isRTL: false, doLeftAndRightSwapInRTL: true, localeIdentifier: 'en_US' }),
    },
    Appearance: {
      getColorScheme: () => 'light',
      getConstants: () => ({}),
      addListener() {},
      removeListeners() {},
    },
  };
  // Any other native module becomes an object whose methods do nothing; the launch screen must not
  // depend on native state, and this keeps module-level `getEnforcing` calls from throwing.
  const stubModule = (name: string) =>
    name in nativeModules
      ? nativeModules[name]
      : new Proxy(
          {},
          {
            get: (_, key) =>
              key === 'getConstants' ? () => ({}) : key === 'then' ? undefined : () => undefined,
          }
        );

  const fatalErrors: unknown[] = [];
  const reportedErrors: unknown[] = [];
  // The bundle runs in this Node context (the same evaluator web static rendering and RSC use,
  // with source maps and Metro's error formatting), so the globals it expects go on `globalThis`
  // for the duration of the render. React Native's runtime replaces `console` (and reports
  // `console.error` through `RN$handleException`), so logging goes through the original console.
  const originalConsole = console;
  const originalSetTimeout = setTimeout;
  const globals: Record<string, unknown> = {
    // Lets `SplashScreen.Exclude` render its box without its content.
    __EXPO_SPLASH_PRERENDER__: true,
    RN$Bridgeless: true,
    RN$registerCallableModule() {},
    RN$useAlwaysAvailableJSErrorHandling: true,
    RN$handleException: (error: unknown, isFatal: boolean) => {
      (isFatal ? fatalErrors : reportedErrors).push(error);
    },
    nativeFabricUIManager: fabricUIManager,
    __turboModuleProxy: (name: string) => stubModule(name),
    nativeModuleProxy: new Proxy({}, { get: (_, name) => stubModule(String(name)) }),
    nativeLoggingHook: (message: string, level: number) => {
      if (level >= 3) {
        originalConsole.warn(`expo-splash-screen prerender: ${message}`);
      }
    },
  };
  const touched = ['console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask', 'ErrorUtils', 'performance', 'fetch', 'XMLHttpRequest', 'navigator', 'process', '__r', '__d', '__c', '__registerSegment', ...Object.keys(globals)];
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const key of touched) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }
  for (const [key, value] of Object.entries(globals)) {
    (globalThis as any)[key] = value;
  }
  try {
    evalMetroNoHandling(projectRoot, code, filename, sourceMap);
    // React commits through the scheduler (timers), so give the event loop a moment.
    for (let i = 0; i < 200 && roots.size === 0 && fatalErrors.length === 0; i++) {
      await new Promise((resolve) => originalSetTimeout(resolve, 10));
    }
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        delete (globalThis as any)[key];
      }
    }
  }
  const childSet = roots.get(1);
  const failure = fatalErrors[0] ?? (!childSet || childSet.length === 0 ? reportedErrors[0] : undefined);
  if (failure !== undefined) {
    throw new Error(
      `expo-splash-screen: the prerender component failed to render: ${
        failure instanceof Error ? failure.stack ?? failure.message : String(failure)
      }`
    );
  }
  if (!childSet || childSet.length === 0) {
    throw new Error('expo-splash-screen: the prerender component did not render anything');
  }
  for (const reported of reportedErrors) {
    Log.warn(`expo-splash-screen prerender: ${reported instanceof Error ? reported.message : String(reported)}`);
  }

  const strip = ({ name, props, children }: RecordedNode): SplashPrerenderTemplate => ({
    name,
    props: JSON.parse(JSON.stringify(props)),
    children: children.map(strip),
  });
  return childSet.length === 1
    ? strip(childSet[0]!)
    : { name: 'RCTView', props: { flex: 1 }, children: childSet.map(strip) };
}

const CORE_COMPONENTS = new Set([
  'RCTView',
  'RCTText',
  'RCTVirtualText',
  'RCTRawText',
  'RCTImageView',
  'RCTScrollView',
  'RCTScrollContentView',
  'RCTSafeAreaView',
  'AndroidHorizontalScrollView',
  'AndroidHorizontalScrollContentView',
]);

function warnAboutUnknownComponents(template: SplashPrerenderTemplate) {
  const names = new Set<string>();
  const visit = (node: SplashPrerenderTemplate) => {
    if (!CORE_COMPONENTS.has(node.name)) {
      names.add(node.name);
    }
    node.children.forEach(visit);
  };
  visit(template);
  if (names.size > 0) {
    Log.warn(
      `expo-splash-screen prerender: the launch screen uses components outside React Native core (${[...names].join(', ')}). They render only if their native component is registered before React Native starts.`
    );
  }
}

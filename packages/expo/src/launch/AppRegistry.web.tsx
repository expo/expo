/**
 * Minimal AppRegistry for web, forked from react-native-web.
 * Original author: Nicolas Gallagher (Meta Platforms, Inc.)
 * Uses `react-dom/client` directly to avoid a hard dependency on react-native-web.
 */

import type { ComponentType, ReactNode } from 'react';

type ComponentProvider = () => ComponentType<any>;
type Runnable = {
  getApplication: (appParameters?: AppParameters) => {
    element: ReactNode;
    getStyleElement: (props?: Record<string, any>) => ReactNode;
  };
  run: (appParameters: AppParameters) => any;
};

type AppParameters = {
  rootTag?: HTMLElement | null;
  initialProps?: Record<string, any>;
  hydrate?: boolean;
  callback?: () => void;
};

const runnables: Record<string, Runnable> = {};

// TODO: Remove react-native-web optional integration once we have a standalone web stylesheet solution.
function tryRequireStyleSheet(): { getSheet?: () => { textContent: string; id: string } } | null {
  try {
    return require('react-native-web/dist/exports/StyleSheet');
  } catch {
    return null;
  }
}

function tryRequireCreateSheet(): ((root?: HTMLElement) => any) | null {
  try {
    const mod = require('react-native-web/dist/exports/StyleSheet/dom');
    return mod?.createSheet ?? null;
  } catch {
    return null;
  }
}

function registerComponent(appKey: string, componentProvider: ComponentProvider): string {
  runnables[appKey] = {
    getApplication: (appParameters?: AppParameters) => {
      const RootComponent = componentProvider();
      const initialProps = appParameters?.initialProps ?? {};
      const element = <RootComponent {...initialProps} />;

      const getStyleElement = (props?: Record<string, any>) => {
        const StyleSheet = tryRequireStyleSheet();
        if (!StyleSheet?.getSheet) {
          return <style {...props} />;
        }
        const sheet = StyleSheet.getSheet();
        return (
          <style {...props} dangerouslySetInnerHTML={{ __html: sheet.textContent }} id={sheet.id} />
        );
      };

      return { element, getStyleElement };
    },

    run: (appParameters: AppParameters) => {
      const { hydrate, initialProps = {}, rootTag, callback } = appParameters;

      if (!rootTag) {
        throw new Error(`"rootTag" was not provided for appKey "${appKey}".`);
      }

      const RootComponent = componentProvider();
      const element = <RootComponent {...initialProps} />;

      const createSheet = tryRequireCreateSheet();
      createSheet?.(rootTag);

      const { createRoot, hydrateRoot } = require('react-dom/client');

      if (hydrate) {
        const root = hydrateRoot(rootTag, element);
        if (callback) callback();
        return root;
      } else {
        const root = createRoot(rootTag);
        root.render(element);
        if (callback) callback();
        return root;
      }
    },
  };
  return appKey;
}

function getApplication(
  appKey: string,
  appParameters?: AppParameters
): { element: ReactNode; getStyleElement: (props?: Record<string, any>) => ReactNode } {
  const runnable = runnables[appKey];
  if (!runnable) {
    throw new Error(
      `Application "${appKey}" has not been registered. ` +
        'This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.'
    );
  }
  return runnable.getApplication(appParameters);
}

function runApplication(appKey: string, appParameters: AppParameters): any {
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const params = { ...appParameters, rootTag: `#${appParameters.rootTag?.id}` };
    console.log(
      `Running application "${appKey}" with appParams:\n`,
      params,
      `\nDevelopment-level warnings: ON.\nPerformance optimizations: OFF.`
    );
  }

  const runnable = runnables[appKey];
  if (!runnable) {
    throw new Error(
      `Application "${appKey}" has not been registered. ` +
        'This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.'
    );
  }

  return runnable.run(appParameters);
}

export default { registerComponent, getApplication, runApplication };

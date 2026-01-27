/**
 * Copyright (c) Expo.
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of AppRegistry with optional StyleSheet imports to allow for running without `react-native-web` installed.
 */

import React from 'react';
import type { ComponentType, Node } from 'react';
import { createRoot as domCreateRoot, hydrateRoot as domHydrateRoot } from 'react-dom/client';
import {
  unmountComponentAtNode,
  hydrate as domLegacyHydrate,
  render as domLegacyRender,
} from 'react-dom';

// TODO: Make these optional imports.
import StyleSheet from 'react-native-web/dist/exports/StyleSheet';
import { createSheet } from 'react-native-web/dist/exports/StyleSheet/dom';

function invariant(condition, message): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

type Application = {
  unmount: () => void;
};
type AppParams = object;
type Runnable = {
  getApplication?: (AppParams) => {
    element: Node;
    getStyleElement: (any) => Node;
  };
  run: (AppParams) => any;
};

type ComponentProvider = () => ComponentType<any>;

const runnables: { [appKey: string]: Runnable } = {};

export default class AppRegistry {
  static getApplication(
    appKey: string,
    appParameters?: AppParams
  ): { element: Node; getStyleElement: (any) => Node } {
    invariant(
      runnables[appKey] && runnables[appKey].getApplication,
      `Application ${appKey} has not been registered. ` +
        'This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.'
    );

    return runnables[appKey].getApplication(appParameters);
  }

  static registerComponent(appKey: string, componentProvider: ComponentProvider): string {
    runnables[appKey] = {
      getApplication({ initialProps = {} }: { initialProps?: any } = {}) {
        const RootComponent = componentProvider();
        return {
          element: <RootComponent {...initialProps} />,
          getStyleElement(props) {
            // Don't escape CSS text
            const sheet = StyleSheet.getSheet();
            return (
              <style
                {...props}
                dangerouslySetInnerHTML={{ __html: sheet.textContent }}
                id={sheet.id}
              />
            );
          },
        };
      },
      run(appParameters): Application {
        const RootComponent = componentProvider();
        const options = {
          hydrate: appParameters.hydrate || false,
          initialProps: appParameters.initialProps ?? {},
          mode: appParameters.mode || 'concurrent',
          rootTag: appParameters.rootTag,
        };

        const { hydrate, initialProps, mode, rootTag } = options;
        const renderFn = hydrate
          ? mode === 'concurrent'
            ? domHydrateRoot
            : hydrateLegacy
          : mode === 'concurrent'
            ? render
            : renderLegacy;

        invariant(rootTag, 'Expect to have a valid rootTag, instead got ' + rootTag);

        createSheet(rootTag);

        return renderFn(<RootComponent {...initialProps} />, rootTag);
      },
    };
    return appKey;
  }

  static runApplication(appKey: string, appParameters: object): Application {
    const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
    if (isDevelopment) {
      const params = { ...appParameters };
      params.rootTag = `#${params.rootTag.id}`;
    }

    invariant(
      runnables[appKey] && runnables[appKey].run,
      `Application "${appKey}" has not been registered. ` +
        'This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.'
    );

    return runnables[appKey].run(appParameters);
  }
}

function render(element, root) {
  const reactRoot = domCreateRoot(root);
  reactRoot.render(element);
  return reactRoot;
}

function hydrateLegacy(element, root, callback?: any) {
  domLegacyHydrate(element, root, callback);
  return {
    unmount: unmountComponentAtNode.bind(null, root),
  };
}

function renderLegacy(element, root, callback?: any) {
  domLegacyRender(element, root, callback);
  return {
    unmount: unmountComponentAtNode.bind(null, root),
  };
}

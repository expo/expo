/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { PropsWithChildren } from 'react';
import React from 'react';

import type { ServerDataLoaderData } from '../loaders/ServerDataLoaderContext';
import { ServerDataLoaderContext } from '../loaders/ServerDataLoaderContext';
import type { ServerContainerRef } from '../react-navigation/native';
import { ServerContainer } from '../react-navigation/native';

/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
export function ScrollViewStyleReset() {
  return (
    <style
      id="expo-reset"
      dangerouslySetInnerHTML={{
        __html: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`,
      }}
    />
  );
}

export function InnerRoot({
  children,
  loadedData,
}: PropsWithChildren<{ loadedData: ServerDataLoaderData }>) {
  // NOTE(@hassankhan): This ref seems to be unnecessary, double-check SSR/SSG code paths and remove
  const ref = React.createRef<ServerContainerRef>();

  return (
    <ServerDataLoaderContext value={loadedData}>
      <ServerContainer ref={ref}>{children}</ServerContainer>
    </ServerDataLoaderContext>
  );
}

/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ServerContainer, ServerContainerRef } from '@react-navigation/native';
import React, { PropsWithChildren } from 'react';

import { ServerDataLoaderContext } from '../loaders/ServerDataLoaderContext';

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

export function InnerRoot({ children, loadedData }: PropsWithChildren<{ loadedData: any }>) {
  const ref = React.createRef<ServerContainerRef>();

  return (
    <ServerDataLoaderContext value={loadedData}>
      <ServerContainer ref={ref}>{children}</ServerContainer>
    </ServerDataLoaderContext>
  );
}

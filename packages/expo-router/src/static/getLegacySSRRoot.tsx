/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ServerContainer } from './react-navigation';
import { ServerContainerRef } from '@react-navigation/native';
import React from 'react';
import LegacyExpoRoot from './legacy-client-root';
// import { AppRegistry } from 'react-native';

// import { ctx } from '../../_ctx';
// import { ExpoRoot } from '../ExpoRoot';
// import { Head } from '../head';

// AppRegistry.registerComponent('App', () => ExpoRoot);

export async function getRootReactComponent(location: URL): Promise<React.ReactElement> {
  //   const headContext: { helmet?: any } = {};

  //   const ref = React.createRef<ServerContainerRef>();

  //   const {
  //     // NOTE: The `element` that's returned adds two extra Views and
  //     // the seemingly unused `RootTagContext.Provider`.
  //     element,
  //     getStyleElement,
  //   } = AppRegistry.getApplication('App', {
  //     initialProps: {
  //       location,
  //       context: ctx,
  //       wrapper: ({ children }) => (
  //         // <Root>
  //         <div id="root">{children}</div>
  //         // {/* </Root> */}
  //       ),
  //     },
  //   });

  // const Root = getRootComponent();

  return <p>hate it here</p>;
  return (
    <ServerContainer>
      <LegacyExpoRoot location={location} />
    </ServerContainer>
  );
  //   return (
  //     <ServerContainer>
  //       <div id="root">
  //         <LegacyExpoRoot location={location} />
  //       </div>
  //     </ServerContainer>
  //   );
  //   return (
  //     <Head.Provider context={headContext}>
  //       <ServerContainer ref={ref}>{element}</ServerContainer>
  //     </Head.Provider>
  //   );
}

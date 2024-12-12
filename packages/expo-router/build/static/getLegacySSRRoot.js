"use strict";
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRootReactComponent = void 0;
const react_navigation_1 = require("./react-navigation");
const react_1 = __importDefault(require("react"));
const legacy_client_root_1 = __importDefault(require("./legacy-client-root"));
// import { AppRegistry } from 'react-native';
// import { ctx } from '../../_ctx';
// import { ExpoRoot } from '../ExpoRoot';
// import { Head } from '../head';
// AppRegistry.registerComponent('App', () => ExpoRoot);
async function getRootReactComponent(location) {
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
    return (<react_navigation_1.ServerContainer>
      <legacy_client_root_1.default location={location}/>
    </react_navigation_1.ServerContainer>);
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
exports.getRootReactComponent = getRootReactComponent;
//# sourceMappingURL=getLegacySSRRoot.js.map
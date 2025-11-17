"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollViewStyleReset = ScrollViewStyleReset;
exports.InnerRoot = InnerRoot;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const ServerDataLoaderContext_1 = require("../loaders/ServerDataLoaderContext");
/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
function ScrollViewStyleReset() {
    return (<style id="expo-reset" dangerouslySetInnerHTML={{
            __html: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`,
        }}/>);
}
function InnerRoot({ children, loadedData, }) {
    // NOTE(@hassankhan): This ref seems to be unnecessary, double-check SSR/SSG code paths and remove
    const ref = react_1.default.createRef();
    return (<ServerDataLoaderContext_1.ServerDataLoaderContext value={loadedData}>
      <native_1.ServerContainer ref={ref}>{children}</native_1.ServerContainer>
    </ServerDataLoaderContext_1.ServerDataLoaderContext>);
}
//# sourceMappingURL=html.js.map
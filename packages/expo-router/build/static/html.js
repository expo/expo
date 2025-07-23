"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScrollViewStyleReset = ScrollViewStyleReset;
exports.Html = Html;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const react_1 = __importDefault(require("react"));
/**
 * Root style-reset for full-screen React Native web apps with a root `<ScrollView />` should use the following styles to ensure native parity. [Learn more](https://necolas.github.io/react-native-web/docs/setup/#root-element).
 */
function ScrollViewStyleReset() {
    return (<style id="expo-reset" dangerouslySetInnerHTML={{
            __html: `#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}`,
        }}/>);
}
function Html({ children }) {
    return (<html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>);
}
//# sourceMappingURL=html.js.map
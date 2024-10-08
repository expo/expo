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
exports.App = void 0;
const react_1 = __importDefault(require("react"));
const client_1 = require("./router/client");
const root_wrap_1 = require("./router/root-wrap");
// Must be exported or Fast Refresh won't update the context
function App() {
    return (<root_wrap_1.RootWrap>
      <client_1.Router />
    </root_wrap_1.RootWrap>);
}
exports.App = App;
//# sourceMappingURL=entry.js.map
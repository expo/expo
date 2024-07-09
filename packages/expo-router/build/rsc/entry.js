/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const react_1 = __importDefault(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const client_1 = require("./router/client");
const ErrorBoundary_1 = require("../views/ErrorBoundary");
const Try_1 = require("../views/Try");
// Add root error recovery.
function RootErrorBoundary(props) {
    react_1.default.useEffect(() => {
        function refetchRoute() {
            if (props.error) {
                props.retry();
            }
        }
        // TODO: Only strip when not connected to a dev server.
        if (process.env.NODE_ENV === 'development') {
            globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
            const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(globalThis.__EXPO_REFETCH_ROUTE__);
            if (index !== -1) {
                globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
            }
            else {
                globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
            }
            globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
        }
    }, [props.error, props.retry]);
    return <ErrorBoundary_1.ErrorBoundary error={props.error} retry={props.retry}/>;
}
// Must be exported or Fast Refresh won't update the context
function App() {
    return (<react_native_safe_area_context_1.SafeAreaProvider>
      <Try_1.Try catch={RootErrorBoundary}>
        <client_1.Router />
      </Try_1.Try>
    </react_native_safe_area_context_1.SafeAreaProvider>);
}
exports.App = App;
//# sourceMappingURL=entry.js.map
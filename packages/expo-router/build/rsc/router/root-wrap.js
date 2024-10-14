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
exports.RootWrap = void 0;
const react_1 = __importDefault(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
// import { ErrorBoundary } from '../../views/ErrorBoundary';
// import { ErrorBoundaryProps, Try } from '../../views/Try';
// // Add root error recovery.
// function RootErrorBoundary(props: ErrorBoundaryProps) {
//   React.useEffect(() => {
//     function refetchRoute() {
//       if (props.error) {
//         props.retry();
//       }
//     }
//     // TODO: Only strip when not connected to a dev server.
//     if (process.env.NODE_ENV === 'development') {
//       globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
//       const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(
//         globalThis.__EXPO_REFETCH_ROUTE__
//       );
//       if (index !== -1) {
//         globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
//       } else {
//         globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
//       }
//       globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
//     }
//   }, [props.error, props.retry]);
//   return (
//     <ErrorBoundary
//       error={props.error}
//       retry={() => {
//         // TODO: Invalidate the cache automatically when the request fails.
//         // Invalidate the fetch cache so we can retry the request.
//         globalThis.__EXPO_REFETCH_ROUTE_NO_CACHE__?.();
//         return props.retry();
//       }}
//     />
//   );
// }
const isTestEnv = process.env.NODE_ENV === 'test';
const INITIAL_METRICS = process.env.EXPO_OS === 'web' || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }
    : undefined;
function RootWrap({ children }) {
    return (<react_native_safe_area_context_1.SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      {children}
      {/* <Try catch={RootErrorBoundary}>{children}</Try> */}
    </react_native_safe_area_context_1.SafeAreaProvider>);
}
exports.RootWrap = RootWrap;
//# sourceMappingURL=root-wrap.js.map
"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocalSearchParams = useLocalSearchParams;
const react_1 = __importDefault(require("react"));
const Route_1 = require("../Route");
const PreviewRouteContext_1 = require("../link/preview/PreviewRouteContext");
function useLocalSearchParams() {
    const params = react_1.default.use(Route_1.LocalRouteParamsContext) ?? {};
    const { params: previewParams } = (0, PreviewRouteContext_1.usePreviewInfo)();
    return Object.fromEntries(Object.entries(previewParams ?? params).map(([key, value]) => {
        // React Navigation doesn't remove "undefined" values from the params object, and you cannot remove them via
        // navigation.setParams as it shallow merges. Hence, we hide them here
        if (value === undefined) {
            return [key, undefined];
        }
        if (Array.isArray(value)) {
            return [
                key,
                value.map((v) => {
                    try {
                        return decodeURIComponent(v);
                    }
                    catch {
                        return v;
                    }
                }),
            ];
        }
        else {
            try {
                return [key, decodeURIComponent(value)];
            }
            catch {
                return [key, value];
            }
        }
    }));
}
//# sourceMappingURL=useLocalSearchParams.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentGlobalErrorOverlay = presentGlobalErrorOverlay;
exports.dismissGlobalErrorOverlay = dismissGlobalErrorOverlay;
const react_1 = __importDefault(require("react"));
const ContextActions_1 = require("./ContextActions");
const ContextPlatform_1 = require("./ContextPlatform");
const LogBoxData = __importStar(require("./Data/LogBoxData"));
const renderInShadowRoot_1 = require("./utils/renderInShadowRoot");
let currentRoot = null;
function presentGlobalErrorOverlay() {
    if (currentRoot) {
        return;
    }
    const { LogBoxInspectorContainer } = require('./overlay/Overlay');
    const ErrorOverlay = LogBoxData.withSubscription((0, ContextPlatform_1.withRuntimePlatform)((0, ContextActions_1.withActions)(LogBoxInspectorContainer, {
        onMinimize: () => {
            LogBoxData.setSelectedLog(-1);
            LogBoxData.setSelectedLog(-1);
        },
    }), { platform: process.env.EXPO_OS ?? 'web' }));
    currentRoot = (0, renderInShadowRoot_1.renderInShadowRoot)('error-overlay', react_1.default.createElement(ErrorOverlay));
}
function dismissGlobalErrorOverlay() {
    currentRoot?.unmount();
    currentRoot = null;
}

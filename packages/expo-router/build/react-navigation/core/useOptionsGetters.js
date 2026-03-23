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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptionsGetters = useOptionsGetters;
const React = __importStar(require("react"));
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
const NavigationStateContext_1 = require("./NavigationStateContext");
function useOptionsGetters({ key, options, navigation }) {
    const optionsRef = React.useRef(options);
    const optionsGettersFromChildRef = React.useRef({});
    const { onOptionsChange } = React.useContext(NavigationBuilderContext_1.NavigationBuilderContext);
    const { addOptionsGetter: parentAddOptionsGetter } = React.useContext(NavigationStateContext_1.NavigationStateContext);
    const optionsChangeListener = React.useCallback(() => {
        const isFocused = navigation?.isFocused() ?? true;
        const hasChildren = Object.keys(optionsGettersFromChildRef.current).length;
        if (isFocused && !hasChildren) {
            onOptionsChange(optionsRef.current ?? {});
        }
    }, [navigation, onOptionsChange]);
    React.useEffect(() => {
        optionsRef.current = options;
        optionsChangeListener();
        return navigation?.addListener('focus', optionsChangeListener);
    }, [navigation, options, optionsChangeListener]);
    const getOptionsFromListener = React.useCallback(() => {
        for (const key in optionsGettersFromChildRef.current) {
            if (key in optionsGettersFromChildRef.current) {
                const result = optionsGettersFromChildRef.current[key]?.();
                // null means unfocused route
                if (result !== null) {
                    return result;
                }
            }
        }
        return null;
    }, []);
    const getCurrentOptions = React.useCallback(() => {
        const isFocused = navigation?.isFocused() ?? true;
        if (!isFocused) {
            return null;
        }
        const optionsFromListener = getOptionsFromListener();
        if (optionsFromListener !== null) {
            return optionsFromListener;
        }
        return optionsRef.current;
    }, [navigation, getOptionsFromListener]);
    React.useEffect(() => {
        return parentAddOptionsGetter?.(key, getCurrentOptions);
    }, [getCurrentOptions, parentAddOptionsGetter, key]);
    const addOptionsGetter = React.useCallback((key, getter) => {
        optionsGettersFromChildRef.current[key] = getter;
        optionsChangeListener();
        return () => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete optionsGettersFromChildRef.current[key];
            optionsChangeListener();
        };
    }, [optionsChangeListener]);
    return {
        addOptionsGetter,
        getCurrentOptions,
    };
}
//# sourceMappingURL=useOptionsGetters.js.map
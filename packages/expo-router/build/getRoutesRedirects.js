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
exports.applyRedirects = applyRedirects;
exports.getRedirectModule = getRedirectModule;
exports.convertRedirect = convertRedirect;
exports.mergeVariablesWithPath = mergeVariablesWithPath;
const Linking = __importStar(require("expo-linking"));
const react_1 = require("react");
const getStateFromPath_forks_1 = require("./fork/getStateFromPath-forks");
const matchers_1 = require("./matchers");
const url_1 = require("./utils/url");
function applyRedirects(url, redirects) {
    if (typeof url !== 'string' || !redirects) {
        return url;
    }
    const nextUrl = (0, getStateFromPath_forks_1.cleanPath)(url);
    const redirect = redirects.find(([regex]) => regex.test(nextUrl));
    if (!redirect) {
        return url;
    }
    // If the redirect is external, open the URL
    if (redirect[2]) {
        let href = redirect[1].destination;
        if (href.startsWith('//') && process.env.EXPO_OS !== 'web') {
            href = `https:${href}`;
        }
        Linking.openURL(href);
        return href;
    }
    return applyRedirects(convertRedirect(url, redirect[1]), redirects);
}
function getRedirectModule(redirectConfig) {
    return {
        default: function RedirectComponent() {
            const pathname = require('./hooks').usePathname();
            const isExternal = (0, url_1.shouldLinkExternally)(redirectConfig.destination);
            (0, react_1.useEffect)(() => {
                if (isExternal) {
                    let href = redirectConfig.destination;
                    if (href.startsWith('//') && process.env.EXPO_OS !== 'web') {
                        href = `https:${href}`;
                    }
                    Linking.openURL(href);
                }
            }, []);
            if (isExternal) {
                return null;
            }
            const href = convertRedirect(pathname, redirectConfig);
            return (0, react_1.createElement)(require('./link/Link').Redirect, {
                href,
            });
        },
    };
}
function convertRedirect(path, config) {
    const params = {};
    const parts = path.split('/');
    const sourceParts = config.source.split('/');
    for (const [index, sourcePart] of sourceParts.entries()) {
        const dynamicName = (0, matchers_1.matchDynamicName)(sourcePart);
        if (!dynamicName) {
            continue;
        }
        else if (!dynamicName.deep) {
            params[dynamicName.name] = parts[index];
            continue;
        }
        else {
            params[dynamicName.name] = parts.slice(index);
            break;
        }
    }
    return mergeVariablesWithPath(config.destination, params);
}
function mergeVariablesWithPath(path, params) {
    return path
        .split('/')
        .map((part) => {
        const dynamicName = (0, matchers_1.matchDynamicName)(part);
        if (!dynamicName) {
            return part;
        }
        else {
            const param = params[dynamicName.name];
            delete params[dynamicName.name];
            return param;
        }
    })
        .filter(Boolean)
        .join('/');
}
//# sourceMappingURL=getRoutesRedirects.js.map
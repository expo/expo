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
exports.createComponentForStaticNavigation = createComponentForStaticNavigation;
exports.createPathConfigForStaticNavigation = createPathConfigForStaticNavigation;
const React = __importStar(require("react"));
// TODO(@ubax) - RN Migration: remove this dependency and just add this function to our codebase
const react_is_1 = require("react-is");
const useRoute_1 = require("./useRoute");
const MemoizedScreen = React.memo(({ component }) => {
    const route = (0, useRoute_1.useRoute)();
    const children = React.createElement(component, { route });
    return children;
});
MemoizedScreen.displayName = 'Memo(Screen)';
const getItemsFromScreens = (Screen, screens) => {
    return Object.entries(screens).map(([name, item]) => {
        let component;
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        let props = {};
        let useIf;
        let isNavigator = false;
        if ('screen' in item) {
            const { screen, if: _if, ...rest } = item;
            useIf = _if;
            props = rest;
            if ((0, react_is_1.isValidElementType)(screen)) {
                component = screen;
            }
            else if ('config' in screen) {
                isNavigator = true;
                component = createComponentForStaticNavigation(screen, `${name}Navigator`);
            }
        }
        else if ((0, react_is_1.isValidElementType)(item)) {
            component = item;
        }
        else if ('config' in item) {
            isNavigator = true;
            component = createComponentForStaticNavigation(item, `${name}Navigator`);
        }
        if (component == null) {
            throw new Error(`Couldn't find a 'screen' property for the screen '${name}'. This can happen if you passed 'undefined'. You likely forgot to export your component from the file it's defined in, or mixed up default import and named import when importing.`);
        }
        const element = isNavigator ? (React.createElement(component, {})) : (<MemoizedScreen component={component}/>);
        return () => {
            const shouldRender = useIf == null || useIf();
            if (!shouldRender) {
                return null;
            }
            return (<Screen key={name} name={name} {...props}>
          {() => element}
        </Screen>);
        };
    });
};
/**
 * Create a component that renders a navigator based on the static configuration.
 *
 * @param tree Static navigation config.
 * @param displayName Name of the component to be displayed in React DevTools.
 * @returns A component which renders the navigator.
 */
function createComponentForStaticNavigation(tree, displayName
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
) {
    const { Navigator, Group, Screen, config } = tree;
    const { screens, groups, ...rest } = config;
    if (screens == null && groups == null) {
        throw new Error("Couldn't find a 'screens' or 'groups' property. Make sure to define your screens under a 'screens' property in the configuration.");
    }
    const items = [];
    // Loop through the config to find screens and groups
    // So we add the screens and groups in the same order as they are defined
    for (const key in config) {
        if (key === 'screens' && screens) {
            items.push(...getItemsFromScreens(Screen, screens));
        }
        if (key === 'groups' && groups) {
            items.push(...Object.entries(groups).map(([key, { if: useIf, ...group }]) => {
                const groupItems = getItemsFromScreens(Screen, group.screens);
                return () => {
                    // Call unconditionally since screen configs may contain `useIf` hooks
                    const children = groupItems.map((item) => item());
                    const shouldRender = useIf == null || useIf();
                    if (!shouldRender) {
                        return null;
                    }
                    return (<Group key={key} navigationKey={key} {...group}>
                {children}
              </Group>);
                };
            }));
        }
    }
    const NavigatorComponent = () => {
        const children = items.map((item) => item());
        return <Navigator {...rest}>{children}</Navigator>;
    };
    NavigatorComponent.displayName = displayName;
    return NavigatorComponent;
}
/**
 * Create a path config object from a static navigation config for deep linking.
 *
 * @param tree Static navigation config.
 * @param options Additional options from `linking.config`.
 * @param auto Whether to automatically generate paths for leaf screens.
 * @returns Path config object to use in linking config.
 *
 * @example
 * ```js
 * const config = {
 *   screens: {
 *     Home: {
 *       screens: createPathConfigForStaticNavigation(HomeTabs),
 *     },
 *   },
 * };
 * ```
 */
function createPathConfigForStaticNavigation(tree, options, auto) {
    let initialScreenHasPath = false;
    let initialScreenConfig;
    const createPathConfigForTree = (t, o, 
    // If a screen is a leaf node, but inside a screen with path,
    // It should not be used for initial detection
    skipInitialDetection) => {
        const createPathConfigForScreens = (screens, initialRouteName) => {
            return Object.fromEntries(Object.entries(screens)
                // Re-order to move the initial route to the front
                // This way we can detect the initial route correctly
                .sort(([a], [b]) => {
                if (a === initialRouteName) {
                    return -1;
                }
                if (b === initialRouteName) {
                    return 1;
                }
                return 0;
            })
                .map(([key, item]) => {
                const screenConfig = {};
                if ('linking' in item) {
                    if (typeof item.linking === 'string') {
                        screenConfig.path = item.linking;
                    }
                    else {
                        Object.assign(screenConfig, item.linking);
                    }
                    if (typeof screenConfig.path === 'string') {
                        screenConfig.path = screenConfig.path
                            .replace(/^\//, '') // Remove extra leading slash
                            .replace(/\/$/, ''); // Remove extra trailing slash
                    }
                }
                let screens;
                const skipInitialDetectionInChild = skipInitialDetection || (screenConfig.path != null && screenConfig.path !== '');
                if ('config' in item) {
                    screens = createPathConfigForTree(item, undefined, skipInitialDetectionInChild);
                }
                else if ('screen' in item &&
                    'config' in item.screen &&
                    (item.screen.config.screens || item.screen.config.groups)) {
                    screens = createPathConfigForTree(item.screen, undefined, skipInitialDetectionInChild);
                }
                if (screens) {
                    screenConfig.screens = screens;
                }
                if (auto &&
                    !screenConfig.screens &&
                    // Skip generating path for screens that specify linking config as `undefined` or `null` explicitly
                    !('linking' in item && item.linking == null)) {
                    if (screenConfig.path != null) {
                        if (!skipInitialDetection) {
                            if (key === initialRouteName && screenConfig.path != null) {
                                initialScreenHasPath = true;
                            }
                            else if (screenConfig.path === '') {
                                // We encounter a leaf screen with empty path,
                                // Clear the initial screen config as it's not needed anymore
                                initialScreenConfig = undefined;
                            }
                        }
                    }
                    else {
                        if (!skipInitialDetection && initialScreenConfig == null) {
                            initialScreenConfig = screenConfig;
                        }
                        screenConfig.path = key
                            .replace(/([A-Z]+)/g, '-$1')
                            .replace(/^-/, '')
                            .toLowerCase();
                    }
                }
                return [key, screenConfig];
            })
                .filter(([, screen]) => Object.keys(screen).length > 0));
        };
        const screens = {};
        // Loop through the config to find screens and groups
        // So we add the screens and groups in the same order as they are defined
        for (const key in t.config) {
            if (key === 'screens' && t.config.screens) {
                Object.assign(screens, createPathConfigForScreens(t.config.screens, o?.initialRouteName ?? t.config.initialRouteName));
            }
            if (key === 'groups' && t.config.groups) {
                Object.entries(t.config.groups).forEach(([, group]) => {
                    Object.assign(screens, createPathConfigForScreens(group.screens, o?.initialRouteName ?? t.config.initialRouteName));
                });
            }
        }
        if (Object.keys(screens).length === 0) {
            return undefined;
        }
        return screens;
    };
    const screens = createPathConfigForTree(tree, options, false);
    if (auto && initialScreenConfig && !initialScreenHasPath) {
        initialScreenConfig.path = '';
    }
    return screens;
}
//# sourceMappingURL=StaticNavigation.js.map
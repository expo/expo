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
exports.createStaticNavigation = createStaticNavigation;
const React = __importStar(require("react"));
const core_1 = require("../core");
const NavigationContainer_1 = require("./NavigationContainer");
/**
 * Create a navigation component from a static navigation config.
 * The returned component is a wrapper around `NavigationContainer`.
 *
 * @param tree Static navigation config.
 * @returns Navigation component to use in your app.
 */
function createStaticNavigation(tree) {
    const Component = (0, core_1.createComponentForStaticNavigation)(tree, 'RootNavigator');
    function Navigation({ linking, ...rest }, ref) {
        const linkingConfig = React.useMemo(() => {
            const screens = (0, core_1.createPathConfigForStaticNavigation)(tree, { initialRouteName: linking?.config?.initialRouteName }, linking?.enabled === 'auto');
            if (!screens)
                return;
            return {
                path: linking?.config?.path,
                initialRouteName: linking?.config?.initialRouteName,
                screens,
            };
        }, [linking?.enabled, linking?.config?.path, linking?.config?.initialRouteName]);
        const memoizedLinking = React.useMemo(() => {
            if (!linking) {
                return undefined;
            }
            const enabled = typeof linking.enabled === 'boolean' ? linking.enabled : linkingConfig?.screens != null;
            return {
                ...linking,
                enabled,
                config: linkingConfig,
            };
        }, [linking, linkingConfig]);
        if (linking?.enabled === true && linkingConfig?.screens == null) {
            throw new Error('Linking is enabled but no linking configuration was found for the screens.\n\n' +
                'To solve this:\n' +
                "- Specify a 'linking' property for the screens you want to link to.\n" +
                "- Or set 'linking.enabled' to 'auto' to generate paths automatically.\n\n" +
                'See usage guide: https://reactnavigation.org/docs/static-configuration#linking');
        }
        return (<NavigationContainer_1.NavigationContainer {...rest} ref={ref} linking={memoizedLinking}>
        <Component />
      </NavigationContainer_1.NavigationContainer>);
    }
    return React.forwardRef(Navigation);
}
//# sourceMappingURL=createStaticNavigation.js.map
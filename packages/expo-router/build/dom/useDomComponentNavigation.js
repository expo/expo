"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDomComponentNavigation = useDomComponentNavigation;
const global_1 = require("expo/dom/global");
const react_1 = require("react");
const imperative_api_1 = require("../imperative-api");
const domEvents_1 = require("./domEvents");
function useDomComponentNavigation() {
    (0, react_1.useEffect)(() => {
        if (process.env.EXPO_OS === 'web') {
            return () => { };
        }
        return (0, global_1.addGlobalDomEventListener)(({ type, data }) => {
            switch (type) {
                case domEvents_1.ROUTER_LINK_TYPE:
                    imperative_api_1.router.linkTo(data.href, data.options);
                    break;
                case domEvents_1.ROUTER_DISMISS_ALL_TYPE:
                    imperative_api_1.router.dismissAll();
                    break;
                case domEvents_1.ROUTER_DISMISS_TYPE:
                    imperative_api_1.router.dismiss(data.count);
                    break;
                case domEvents_1.ROUTER_BACK_TYPE:
                    imperative_api_1.router.back();
                    break;
                case domEvents_1.ROUTER_SET_PARAMS_TYPE:
                    imperative_api_1.router.setParams(data.params);
                    break;
            }
        });
    }, []);
}
//# sourceMappingURL=useDomComponentNavigation.js.map
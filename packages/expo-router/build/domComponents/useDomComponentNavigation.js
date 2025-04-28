"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDomComponentNavigation = useDomComponentNavigation;
const global_1 = require("expo/dom/global");
const react_1 = __importDefault(require("react"));
const events_1 = require("./events");
const routing_1 = require("../global-state/routing");
function useDomComponentNavigation() {
    react_1.default.useEffect(() => {
        if (process.env.EXPO_OS === 'web') {
            return () => { };
        }
        return (0, global_1.addGlobalDomEventListener)(({ type, data }) => {
            switch (type) {
                case events_1.ROUTER_LINK_TYPE:
                    (0, routing_1.linkTo)(data.href, data.options);
                    break;
                case events_1.ROUTER_DISMISS_ALL_TYPE:
                    (0, routing_1.dismissAll)();
                    break;
                case events_1.ROUTER_DISMISS_TYPE:
                    (0, routing_1.dismiss)(data.count);
                    break;
                case events_1.ROUTER_BACK_TYPE:
                    (0, routing_1.goBack)();
                    break;
                case events_1.ROUTER_SET_PARAMS_TYPE:
                    (0, routing_1.setParams)(data.params);
                    break;
            }
        });
    }, []);
}
//# sourceMappingURL=useDomComponentNavigation.js.map
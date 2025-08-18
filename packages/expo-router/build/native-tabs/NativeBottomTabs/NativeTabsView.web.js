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
exports.NativeTabsView = NativeTabsView;
const react_tabs_1 = require("@radix-ui/react-tabs");
const react_1 = __importStar(require("react"));
const utils_1 = require("./utils");
const native_tabs_module_css_1 = __importDefault(require("../../../assets/native-tabs.module.css"));
function NativeTabsView(props) {
    const { builder, focusedIndex } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    const defaultTabName = (0, react_1.useMemo)(() => state.routes[focusedIndex]?.name ?? state.routes[0].name, []);
    const value = state.routes[focusedIndex]?.name ?? state.routes[0].name;
    const items = routes
        .filter(({ key }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map((route) => (<TabItem key={route.key} route={route} title={descriptors[route.key].options.title ?? route.name} badgeValue={descriptors[route.key].options.badgeValue}/>));
    const children = routes
        .filter(({ key }) => (0, utils_1.shouldTabBeVisible)(descriptors[key].options))
        .map((route) => {
        return (<react_tabs_1.TabsContent key={route.name} value={route.name} className={native_tabs_module_css_1.default.tabContent} forceMount>
          {descriptors[route.key].render()}
        </react_tabs_1.TabsContent>);
    });
    return (<react_tabs_1.Tabs className={native_tabs_module_css_1.default.nativeTabsContainer} defaultValue={defaultTabName} value={value} onValueChange={(value) => {
            navigation.dispatch({
                type: 'JUMP_TO',
                target: state.key,
                payload: {
                    name: value,
                },
            });
        }} style={convertNativeTabsPropsToStyleVars(props.style)}>
      <react_tabs_1.TabsList aria-label="Main" className={native_tabs_module_css_1.default.navigationMenuRoot}>
        {items}
      </react_tabs_1.TabsList>
      {children}
    </react_tabs_1.Tabs>);
}
function TabItem(props) {
    const { title, badgeValue, route } = props;
    const isBadgeEmpty = badgeValue === ' ';
    return (<react_tabs_1.TabsTrigger value={route.name} className={native_tabs_module_css_1.default.navigationMenuTrigger}>
      <span className={native_tabs_module_css_1.default.tabText}>{title}</span>
      {badgeValue && (<div className={`${native_tabs_module_css_1.default.tabBadge} ${isBadgeEmpty ? native_tabs_module_css_1.default.emptyTabBadge : ''}`}>
          {badgeValue}
        </div>)}
    </react_tabs_1.TabsTrigger>);
}
function convertNativeTabsPropsToStyleVars(style) {
    const vars = {};
    if (!style) {
        return vars;
    }
    if (style.fontFamily) {
        vars['--expo-router-tabs-font-family'] = String(style.fontFamily);
    }
    if (style.fontSize) {
        vars['--expo-router-tabs-font-size'] = String(style.fontSize);
    }
    if (style.fontWeight) {
        vars['--expo-router-tabs-font-weight'] = String(style.fontWeight);
    }
    if (style.fontStyle) {
        vars['--expo-router-tabs-font-style'] = String(style.fontStyle);
    }
    if (style.color) {
        vars['--expo-router-tabs-text-color'] = String(style.color);
    }
    if (style['&:active']?.color) {
        vars['--expo-router-tabs-active-text-color'] = String(style['&:active'].color);
    }
    else if (style.tintColor) {
        vars['--expo-router-tabs-active-text-color'] = String(style.tintColor);
    }
    if (style['&:active']?.fontSize) {
        vars['--expo-router-tabs-active-font-size'] = String(style['&:active'].fontSize);
    }
    if (style['&:active']?.indicatorColor) {
        vars['--expo-router-tabs-active-background-color'] = String(style['&:active'].indicatorColor);
    }
    if (style.backgroundColor) {
        vars['--expo-router-tabs-background-color'] = String(style.backgroundColor);
    }
    if (style.badgeBackgroundColor) {
        vars['--expo-router-tabs-badge-background-color'] = String(style.badgeBackgroundColor);
    }
    if (style.badgeTextColor) {
        vars['--expo-router-tabs-badge-text-color'] = String(style.badgeTextColor);
    }
    return vars;
}
//# sourceMappingURL=NativeTabsView.web.js.map
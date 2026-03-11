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
const native_tabs_module_css_1 = __importDefault(require("../../assets/native-tabs.module.css"));
function NativeTabsView(props) {
    const { tabs, focusedIndex } = props;
    const currentTab = tabs[focusedIndex];
    const defaultTab = (0, react_1.useMemo)(() => currentTab, 
    // We don't specify currentTab here, as we don't want to change the default tab when focusedIndex changes
    []);
    const value = currentTab.routeKey;
    const items = tabs.map((tab) => (<TabItem key={tab.routeKey} routeKey={tab.routeKey} title={tab.options.title ?? tab.name} badgeValue={tab.options.badgeValue}/>));
    const children = tabs.map((tab) => {
        return (<react_tabs_1.TabsContent key={tab.routeKey} value={tab.routeKey} className={native_tabs_module_css_1.default.tabContent} forceMount>
        {tab.contentRenderer()}
      </react_tabs_1.TabsContent>);
    });
    return (<react_tabs_1.Tabs className={native_tabs_module_css_1.default.nativeTabsContainer} defaultValue={defaultTab.routeKey} value={value} onValueChange={(value) => {
            props.onTabChange(value);
        }} style={convertNativeTabsPropsToStyleVars(props, currentTab.options)}>
      <react_tabs_1.TabsList aria-label="Main" className={native_tabs_module_css_1.default.navigationMenuRoot}>
        {items}
      </react_tabs_1.TabsList>
      {children}
    </react_tabs_1.Tabs>);
}
function TabItem(props) {
    const { title, badgeValue, routeKey } = props;
    const isBadgeEmpty = badgeValue === ' ';
    return (<react_tabs_1.TabsTrigger value={routeKey} className={native_tabs_module_css_1.default.navigationMenuTrigger}>
      <span className={native_tabs_module_css_1.default.tabText}>{title}</span>
      {badgeValue && (<div className={`${native_tabs_module_css_1.default.tabBadge} ${isBadgeEmpty ? native_tabs_module_css_1.default.emptyTabBadge : ''}`}>
          {badgeValue}
        </div>)}
    </react_tabs_1.TabsTrigger>);
}
function convertNativeTabsPropsToStyleVars(props, currentTabOptions) {
    const vars = {};
    if (!props) {
        return vars;
    }
    const optionsLabelStyle = currentTabOptions?.labelStyle;
    if (optionsLabelStyle?.fontFamily) {
        vars['--expo-router-tabs-font-family'] = String(optionsLabelStyle.fontFamily);
    }
    if (optionsLabelStyle?.fontSize) {
        vars['--expo-router-tabs-font-size'] = String(optionsLabelStyle.fontSize);
    }
    if (optionsLabelStyle?.fontWeight) {
        vars['--expo-router-tabs-font-weight'] = String(optionsLabelStyle.fontWeight);
    }
    if (optionsLabelStyle?.fontStyle) {
        vars['--expo-router-tabs-font-style'] = String(optionsLabelStyle.fontStyle);
    }
    if (optionsLabelStyle?.color) {
        vars['--expo-router-tabs-text-color'] = String(optionsLabelStyle.color);
    }
    if (currentTabOptions?.selectedLabelStyle?.color) {
        vars['--expo-router-tabs-active-text-color'] = String(currentTabOptions?.selectedLabelStyle?.color);
    }
    else if (props.tintColor) {
        vars['--expo-router-tabs-active-text-color'] = String(props.tintColor);
    }
    if (currentTabOptions?.selectedLabelStyle?.fontSize) {
        vars['--expo-router-tabs-active-font-size'] = String(currentTabOptions?.selectedLabelStyle?.fontSize);
    }
    if (currentTabOptions?.indicatorColor) {
        vars['--expo-router-tabs-active-background-color'] = String(currentTabOptions.indicatorColor);
    }
    if (currentTabOptions?.backgroundColor) {
        vars['--expo-router-tabs-background-color'] = String(currentTabOptions.backgroundColor);
    }
    if (currentTabOptions?.badgeBackgroundColor) {
        vars['--expo-router-tabs-badge-background-color'] = String(currentTabOptions.badgeBackgroundColor);
    }
    if (currentTabOptions?.badgeTextColor) {
        vars['--expo-router-tabs-badge-text-color'] = String(currentTabOptions.badgeTextColor);
    }
    return vars;
}
//# sourceMappingURL=NativeTabsView.web.js.map
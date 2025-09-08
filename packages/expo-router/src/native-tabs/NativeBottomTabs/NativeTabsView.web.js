import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import React, { useMemo } from 'react';
import { shouldTabBeVisible } from './utils';
import nativeTabsStyles from '../../../assets/native-tabs.module.css';
export function NativeTabsView(props) {
    const { builder, focusedIndex } = props;
    const { state, descriptors, navigation } = builder;
    const { routes } = state;
    const defaultTabName = useMemo(() => state.routes[focusedIndex]?.name ?? state.routes[0].name, []);
    const value = state.routes[focusedIndex]?.name ?? state.routes[0].name;
    const currentTabKey = state.routes[focusedIndex]?.key ?? state.routes[0].key;
    const items = routes
        .filter(({ key }) => shouldTabBeVisible(descriptors[key].options))
        .map((route) => (<TabItem key={route.key} route={route} title={descriptors[route.key].options.title ?? route.name} badgeValue={descriptors[route.key].options.badgeValue}/>));
    const children = routes
        .filter(({ key }) => shouldTabBeVisible(descriptors[key].options))
        .map((route) => {
        return (<TabsContent key={route.name} value={route.name} className={nativeTabsStyles.tabContent} forceMount>
          {descriptors[route.key].render()}
        </TabsContent>);
    });
    return (<Tabs className={nativeTabsStyles.nativeTabsContainer} defaultValue={defaultTabName} value={value} onValueChange={(value) => {
            navigation.dispatch({
                type: 'JUMP_TO',
                target: state.key,
                payload: {
                    name: value,
                },
            });
        }} style={convertNativeTabsPropsToStyleVars(props, descriptors[currentTabKey]?.options)}>
      <TabsList aria-label="Main" className={nativeTabsStyles.navigationMenuRoot}>
        {items}
      </TabsList>
      {children}
    </Tabs>);
}
function TabItem(props) {
    const { title, badgeValue, route } = props;
    const isBadgeEmpty = badgeValue === ' ';
    return (<TabsTrigger value={route.name} className={nativeTabsStyles.navigationMenuTrigger}>
      <span className={nativeTabsStyles.tabText}>{title}</span>
      {badgeValue && (<div className={`${nativeTabsStyles.tabBadge} ${isBadgeEmpty ? nativeTabsStyles.emptyTabBadge : ''}`}>
          {badgeValue}
        </div>)}
    </TabsTrigger>);
}
function convertNativeTabsPropsToStyleVars(props, currentTabOptions) {
    const vars = {};
    if (!props) {
        return vars;
    }
    const { labelStyle } = props;
    const optionsLabelStyle = currentTabOptions?.labelStyle;
    if (optionsLabelStyle?.fontFamily) {
        vars['--expo-router-tabs-font-family'] = String(optionsLabelStyle.fontFamily);
    }
    else if (labelStyle?.fontFamily) {
        vars['--expo-router-tabs-font-family'] = String(labelStyle.fontFamily);
    }
    if (optionsLabelStyle?.fontSize) {
        vars['--expo-router-tabs-font-size'] = String(optionsLabelStyle.fontSize);
    }
    else if (labelStyle?.fontSize) {
        vars['--expo-router-tabs-font-size'] = String(labelStyle.fontSize);
    }
    if (optionsLabelStyle?.fontWeight) {
        vars['--expo-router-tabs-font-weight'] = String(optionsLabelStyle.fontWeight);
    }
    else if (labelStyle?.fontWeight) {
        vars['--expo-router-tabs-font-weight'] = String(labelStyle.fontWeight);
    }
    if (optionsLabelStyle?.fontStyle) {
        vars['--expo-router-tabs-font-style'] = String(optionsLabelStyle.fontStyle);
    }
    else if (labelStyle?.fontStyle) {
        vars['--expo-router-tabs-font-style'] = String(labelStyle.fontStyle);
    }
    if (optionsLabelStyle?.color) {
        vars['--expo-router-tabs-text-color'] = String(optionsLabelStyle.color);
    }
    else if (labelStyle?.color) {
        vars['--expo-router-tabs-text-color'] = String(labelStyle.color);
    }
    if (currentTabOptions?.selectedLabelStyle?.color) {
        vars['--expo-router-tabs-active-text-color'] = String(currentTabOptions.selectedLabelStyle.color);
    }
    else if (props.tintColor) {
        vars['--expo-router-tabs-active-text-color'] = String(props.tintColor);
    }
    if (currentTabOptions?.selectedLabelStyle?.fontSize) {
        vars['--expo-router-tabs-active-font-size'] = String(currentTabOptions.selectedLabelStyle.fontSize);
    }
    if (currentTabOptions?.indicatorColor) {
        vars['--expo-router-tabs-active-background-color'] = String(currentTabOptions.indicatorColor);
    }
    else if (props.indicatorColor) {
        vars['--expo-router-tabs-active-background-color'] = String(props.indicatorColor);
    }
    if (currentTabOptions?.backgroundColor) {
        vars['--expo-router-tabs-background-color'] = String(currentTabOptions.backgroundColor);
    }
    else if (props.backgroundColor) {
        vars['--expo-router-tabs-background-color'] = String(props.backgroundColor);
    }
    if (currentTabOptions?.badgeBackgroundColor) {
        vars['--expo-router-tabs-badge-background-color'] = String(currentTabOptions.badgeBackgroundColor);
    }
    else if (props.badgeBackgroundColor) {
        vars['--expo-router-tabs-badge-background-color'] = String(props.badgeBackgroundColor);
    }
    if (currentTabOptions?.badgeTextColor) {
        vars['--expo-router-tabs-badge-text-color'] = String(currentTabOptions.badgeTextColor);
    }
    else if (props.badgeTextColor) {
        vars['--expo-router-tabs-badge-text-color'] = String(props.badgeTextColor);
    }
    return vars;
}
//# sourceMappingURL=NativeTabsView.web.js.map
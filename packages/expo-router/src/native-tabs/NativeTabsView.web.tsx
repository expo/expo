import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import React, { useMemo } from 'react';

import type { NativeTabOptions, NativeTabsViewProps } from './types';
import nativeTabsStyles from '../../assets/native-tabs.module.css';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { tabs, focusedIndex } = props;
  const currentTab = tabs[focusedIndex];
  const defaultTab = useMemo(
    () => currentTab,
    // We don't specify currentTab here, as we don't want to change the default tab when focusedIndex changes
    []
  );
  const value = currentTab.routeKey;

  const items = tabs.map((tab) => (
    <TabItem
      key={tab.routeKey}
      routeKey={tab.routeKey}
      title={tab.options.title ?? tab.name}
      badgeValue={tab.options.badgeValue}
    />
  ));
  const children = tabs.map((tab) => {
    return (
      <TabsContent
        key={tab.routeKey}
        value={tab.routeKey}
        className={nativeTabsStyles.tabContent}
        forceMount>
        {tab.contentRenderer()}
      </TabsContent>
    );
  });

  return (
    <Tabs
      className={nativeTabsStyles.nativeTabsContainer}
      defaultValue={defaultTab.routeKey}
      value={value}
      onValueChange={(value) => {
        props.onTabChange(value);
      }}
      style={convertNativeTabsPropsToStyleVars(props, currentTab.options)}>
      <TabsList aria-label="Main" className={nativeTabsStyles.navigationMenuRoot}>
        {items}
      </TabsList>
      {children}
    </Tabs>
  );
}

interface TabItemProps {
  title: string;
  badgeValue?: string;
  routeKey: string;
}

function TabItem(props: TabItemProps) {
  const { title, badgeValue, routeKey } = props;
  const isBadgeEmpty = badgeValue === ' ';

  return (
    <TabsTrigger value={routeKey} className={nativeTabsStyles.navigationMenuTrigger}>
      <span className={nativeTabsStyles.tabText}>{title}</span>
      {badgeValue && (
        <div
          className={`${nativeTabsStyles.tabBadge} ${isBadgeEmpty ? nativeTabsStyles.emptyTabBadge : ''}`}>
          {badgeValue}
        </div>
      )}
    </TabsTrigger>
  );
}

function convertNativeTabsPropsToStyleVars(
  props: NativeTabsViewProps | undefined,
  currentTabOptions: NativeTabOptions | undefined
): Record<string, string | undefined> {
  const vars: Record<`--expo-router-tabs-${string}`, string | undefined> = {};
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
    vars['--expo-router-tabs-active-text-color'] = String(
      currentTabOptions?.selectedLabelStyle?.color
    );
  } else if (props.tintColor) {
    vars['--expo-router-tabs-active-text-color'] = String(props.tintColor);
  }
  if (currentTabOptions?.selectedLabelStyle?.fontSize) {
    vars['--expo-router-tabs-active-font-size'] = String(
      currentTabOptions?.selectedLabelStyle?.fontSize
    );
  }
  if (currentTabOptions?.indicatorColor) {
    vars['--expo-router-tabs-active-background-color'] = String(currentTabOptions.indicatorColor);
  }
  if (currentTabOptions?.backgroundColor) {
    vars['--expo-router-tabs-background-color'] = String(currentTabOptions.backgroundColor);
  }
  if (currentTabOptions?.badgeBackgroundColor) {
    vars['--expo-router-tabs-badge-background-color'] = String(
      currentTabOptions.badgeBackgroundColor
    );
  }
  if (currentTabOptions?.badgeTextColor) {
    vars['--expo-router-tabs-badge-text-color'] = String(currentTabOptions.badgeTextColor);
  }
  return vars;
}

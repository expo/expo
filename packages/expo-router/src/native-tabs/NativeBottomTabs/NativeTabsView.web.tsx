import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import React, { useMemo } from 'react';

import type { NativeTabsViewProps } from './types';
import { shouldTabBeVisible } from './utils';
import nativeTabsStyles from '../../../assets/native-tabs.module.css';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder, focusedIndex } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;
  const defaultTabName = useMemo(
    () => state.routes[focusedIndex]?.name ?? state.routes[0].name,
    []
  );
  const value = state.routes[focusedIndex]?.name ?? state.routes[0].name;

  const items = routes
    .filter(({ key }) => shouldTabBeVisible(descriptors[key].options))
    .map((route) => (
      <TabItem
        key={route.key}
        route={route}
        title={descriptors[route.key].options.title ?? route.name}
        badgeValue={descriptors[route.key].options.badgeValue}
      />
    ));
  const children = routes
    .filter(({ key }) => shouldTabBeVisible(descriptors[key].options))
    .map((route) => {
      return (
        <TabsContent
          key={route.name}
          value={route.name}
          className={nativeTabsStyles.tabContent}
          forceMount>
          {descriptors[route.key].render()}
        </TabsContent>
      );
    });

  return (
    <Tabs
      className={nativeTabsStyles.nativeTabsContainer}
      defaultValue={defaultTabName}
      value={value}
      onValueChange={(value) => {
        navigation.dispatch({
          type: 'JUMP_TO',
          target: state.key,
          payload: {
            name: value,
          },
        });
      }}
      style={convertNativeTabsPropsToStyleVars(props)}>
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
  route: { name: string };
}

function TabItem(props: TabItemProps) {
  const { title, badgeValue, route } = props;
  const isBadgeEmpty = badgeValue === ' ';

  return (
    <TabsTrigger value={route.name} className={nativeTabsStyles.navigationMenuTrigger}>
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
  props: NativeTabsViewProps | undefined
): Record<string, string | undefined> {
  const vars: Record<`--expo-router-tabs-${string}`, string | undefined> = {};
  if (!props) {
    return vars;
  }
  const { labelStyle } = props;
  if (labelStyle?.fontFamily) {
    vars['--expo-router-tabs-font-family'] = String(labelStyle.fontFamily);
  }
  if (labelStyle?.fontSize) {
    vars['--expo-router-tabs-font-size'] = String(labelStyle.fontSize);
  }
  if (labelStyle?.fontWeight) {
    vars['--expo-router-tabs-font-weight'] = String(labelStyle.fontWeight);
  }
  if (labelStyle?.fontStyle) {
    vars['--expo-router-tabs-font-style'] = String(labelStyle.fontStyle);
  }
  if (labelStyle?.color) {
    vars['--expo-router-tabs-text-color'] = String(labelStyle.color);
  }
  if (props.tintColor) {
    vars['--expo-router-tabs-active-text-color'] = String(props.tintColor);
  }
  // if (activeStyle?.fontSize) {
  //   vars['--expo-router-tabs-active-font-size'] = String(activeStyle.fontSize);
  // }
  if (props.indicatorColor) {
    vars['--expo-router-tabs-active-background-color'] = String(props.indicatorColor);
  }
  if (props.backgroundColor) {
    vars['--expo-router-tabs-background-color'] = String(props.backgroundColor);
  }
  if (props.badgeBackgroundColor) {
    vars['--expo-router-tabs-badge-background-color'] = String(props.badgeBackgroundColor);
  }
  if (props.badgeTextColor) {
    vars['--expo-router-tabs-badge-text-color'] = String(props.badgeTextColor);
  }
  return vars;
}

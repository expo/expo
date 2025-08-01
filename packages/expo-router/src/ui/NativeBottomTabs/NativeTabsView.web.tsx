import { NavigationMenu } from 'radix-ui';
import React from 'react';
import { Text } from 'react-native';

import type { NativeTabsViewProps } from './types';
import { shouldTabBeVisible } from './utils';

export function NativeTabsView(props: NativeTabsViewProps) {
  const { builder } = props;
  const { state, descriptors, navigation } = builder;
  const { routes } = state;

  const items = routes
    .filter(({ key }) => shouldTabBeVisible(descriptors[key].options))
    .map((route, index) => (
      <TabItem
        key={route.key}
        isFocused={state.index === index}
        title={descriptors[route.key].options.title || route.name}
        onPress={() => {
          navigation.dispatch({
            type: 'JUMP_TO',
            target: state.key,
            payload: {
              name: route.name,
            },
          });
        }}
      />
    ));
  const children = routes
    .filter(({ key }, index) => !descriptors[key].options.hidden && state.index === index)
    .map((route, index) => {
      return (
        <div
          style={{
            flex: 1,
            display: 'flex',
          }}>
          {descriptors[route.key].render()}
        </div>
      );
    });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
      <NavigationMenu.Root
        style={{
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          position: 'fixed',
          zIndex: 10,
        }}>
        <NavigationMenu.List
          style={{
            display: 'flex',
            backgroundColor: '#272727',
            height: 40,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 5,
            boxSizing: 'border-box',
            margin: 0,
          }}>
          {items}
        </NavigationMenu.List>
      </NavigationMenu.Root>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 0,
          overflowY: 'auto',
        }}>
        {children}
      </div>
    </div>
  );
}

interface TabItemProps {
  isFocused: boolean;
  title: string;
  onPress: () => void;
}

function TabItem(props: TabItemProps) {
  const { isFocused, title, onPress } = props;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <NavigationMenu.Item
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        listStylePosition: 'inside',
        height: '100%',
      }}>
      <NavigationMenu.Trigger
        onClick={onPress}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isFocused ? '#444444' : 'transparent',
          border: 'none',
          margin: 0,
          height: '100%',
          borderRadius: 20,
          padding: '0 20px',
          cursor: 'pointer',
          outlineColor: '#444444',
        }}>
        <Text
          style={{
            color: isFocused ? 'white' : isHovered ? '#666666' : '#8b8b8b',
            fontWeight: 500,
            fontSize: 15,
          }}>
          {title}
        </Text>
      </NavigationMenu.Trigger>
    </NavigationMenu.Item>
  );
}

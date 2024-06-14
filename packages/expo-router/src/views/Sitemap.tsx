// Copyright © 2024 650 Industries.
'use client';

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React from 'react';
import { Image, StyleSheet, Text, View, ScrollView, Platform, StatusBar } from 'react-native';

import { Pressable } from './Pressable';
import { RouteNode } from '../Route';
import { useExpoRouter } from '../global-state/router-store';
import { router } from '../imperative-api';
import { Link } from '../link/Link';
import { matchDeepDynamicRouteName } from '../matchers';
import { hasViewControllerBasedStatusBarAppearance } from '../utils/statusbar';

const INDENT = 24;

export function getNavOptions(): NativeStackNavigationOptions {
  return {
    title: 'sitemap',
    headerShown: false,
    presentation: 'modal',
    headerLargeTitle: false,
    headerTitleStyle: {
      color: 'white',
    },
    headerTintColor: 'white',
    headerLargeTitleStyle: {
      color: 'white',
    },
    headerStyle: {
      backgroundColor: 'black',
      // @ts-expect-error: mistyped
      borderBottomColor: '#323232',
    },
    animation: 'default',
  };
}

export function Sitemap() {
  return (
    <View style={styles.container}>
      {!hasViewControllerBasedStatusBarAppearance && <StatusBar barStyle="light-content" />}
      <Text role="heading" aria-level={1} style={styles.title}>
        Sitemap
      </Text>
      <ScrollView contentContainerStyle={[styles.scroll]}>
        <FileSystemView />
      </ScrollView>
    </View>
  );
}

function FileSystemView() {
  const routes = useExpoRouter().getSortedRoutes();
  return routes.map((route) => (
    <View key={route.contextKey} style={styles.itemContainer}>
      <FileItem route={route} />
    </View>
  ));
}

function FileItem({
  route,
  level = 0,
  parents = [],
  isInitial = false,
}: {
  route: RouteNode;
  level?: number;
  parents?: string[];
  isInitial?: boolean;
}) {
  const disabled = route.children.length > 0;

  const segments = React.useMemo(
    () => [...parents, ...route.route.split('/')],
    [parents, route.route]
  );

  const href = React.useMemo(() => {
    return (
      '/' +
      segments
        .map((segment) => {
          // add an extra layer of entropy to the url for deep dynamic routes
          if (matchDeepDynamicRouteName(segment)) {
            return segment + '/' + Date.now();
          }
          // index must be erased but groups can be preserved.
          return segment === 'index' ? '' : segment;
        })
        .filter(Boolean)
        .join('/')
    );
  }, [segments, route.route]);

  const filename = React.useMemo(() => {
    const segments = route.contextKey.split('/');
    // join last two segments for layout routes
    if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
      return segments[segments.length - 2] + '/' + segments[segments.length - 1];
    }

    const routeSegmentsCount = route.route.split('/').length;

    // Join the segment count in reverse order
    // This presents files without layout routes as children with all relevant segments.
    return segments.slice(-routeSegmentsCount).join('/');
  }, [route]);

  const info = isInitial ? 'Initial' : route.generated ? 'Virtual' : '';

  return (
    <>
      {!route.internal && (
        <Link
          accessibilityLabel={route.contextKey}
          href={href}
          onPress={() => {
            if (Platform.OS !== 'web' && router.canGoBack()) {
              // Ensure the modal pops
              router.back();
            }
          }}
          disabled={disabled}
          asChild
          // Ensure we replace the history so you can't go back to this page.
          replace>
          <Pressable>
            {({ pressed, hovered }) => (
              <View
                style={[
                  styles.itemPressable,
                  {
                    paddingLeft: INDENT + level * INDENT,
                    backgroundColor: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                  },
                  pressed && { backgroundColor: 'rgba(255,255,255,0.15)' },
                  disabled && { opacity: 0.4 },
                ]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {route.children.length ? <PkgIcon /> : <FileIcon />}
                  <Text style={styles.filename}>{filename}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!!info && (
                    <Text style={[styles.virtual, !disabled && { marginRight: 8 }]}>{info}</Text>
                  )}
                  {!disabled && <ForwardIcon />}
                </View>
              </View>
            )}
          </Pressable>
        </Link>
      )}
      {route.children.map((child) => (
        <FileItem
          key={child.contextKey}
          route={child}
          isInitial={route.initialRouteName === child.route}
          parents={segments}
          level={level + (route.generated ? 0 : 1)}
        />
      ))}
    </>
  );
}

function FileIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/file.png')} />;
}

function PkgIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/pkg.png')} />;
}

function ForwardIcon() {
  return <Image style={styles.image} source={require('expo-router/assets/forward.png')} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
    alignItems: 'stretch',
  },
  title: {
    color: 'white',
    fontSize: 36,
    marginVertical: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scroll: {
    paddingHorizontal: '5%',
    ...Platform.select({
      ios: {
        paddingBottom: 24,
      },
      web: {
        width: '100%',
        maxWidth: 960,
        marginHorizontal: 'auto',
        paddingBottom: 24,
      },
      default: {
        paddingBottom: 12,
      },
    }),
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#323232',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemPressable: {
    paddingHorizontal: INDENT,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transitionDuration: '100ms',
      },
    }),
  },
  filename: { color: 'white', fontSize: 20, marginLeft: 12 },
  virtual: { textAlign: 'right', color: 'white' },
  image: { width: 24, height: 24, resizeMode: 'contain', opacity: 0.6 },
});

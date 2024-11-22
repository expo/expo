// Copyright © 2024 650 Industries.
'use client';

import { createURL } from 'expo-linking';
import React from 'react';
import { StyleSheet, Text, View, Platform, Image } from 'react-native';

import { usePathname, useRouter } from '../hooks';
import { Link } from '../link/Link';
import { useNavigation } from '../useNavigation';
import { Pressable } from '../views/Pressable';

const useLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : function () {};

/**
 * Default screen for unmatched routes.
 *
 * @hidden
 */
export function Unmatched() {
  const [render, setRender] = React.useState(false);

  const router = useRouter();
  const navigation = useNavigation();
  const pathname = usePathname();
  const url = createURL(pathname);

  React.useEffect(() => {
    setRender(true);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Not Found',
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <NotFoundAsset />
      <Text role="heading" aria-level={1} style={styles.title}>
        Unmatched Route
      </Text>
      <Text role="heading" aria-level={2} style={[styles.subtitle, styles.secondaryText]}>
        Page could not be found.
      </Text>
      {render ? (
        <Link href={pathname} replace {...Platform.select({ native: { asChild: true } })}>
          <Pressable>
            {({ hovered, pressed }) => (
              <Text
                style={[
                  styles.pageLink,
                  styles.secondaryText,
                  Platform.select({
                    web: {
                      transitionDuration: '200ms',
                      opacity: 1,
                    },
                  }),
                  hovered && {
                    opacity: 0.8,
                    textDecorationLine: 'underline',
                  },
                  pressed && {
                    opacity: 0.8,
                  },
                ]}>
                {url}
              </Text>
            )}
          </Pressable>
        </Link>
      ) : (
        <View style={[styles.pageLink, styles.placeholder]} />
      )}
      <View style={styles.linkContainer}>
        <Pressable>
          {({ hovered, pressed }) => (
            <Text
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              style={[
                styles.link,
                Platform.select({
                  web: {
                    transitionDuration: '200ms',
                    opacity: 1,
                  },
                }),
                hovered && {
                  opacity: 0.8,
                  textDecorationLine: 'underline',
                },
                pressed && {
                  opacity: 0.8,
                },
              ]}>
              Go back
            </Text>
          )}
        </Pressable>
        <Text style={[styles.linkSeparator, styles.secondaryText]}>•</Text>
        <Link href="/_sitemap" replace {...Platform.select({ native: { asChild: true } })}>
          <Pressable>
            {({ hovered, pressed }) => (
              <Text
                style={[
                  styles.link,
                  Platform.select({
                    web: {
                      transitionDuration: '200ms',
                      opacity: 1,
                    },
                  }),
                  hovered && {
                    opacity: 0.8,
                    textDecorationLine: 'underline',
                  },
                  pressed && {
                    opacity: 0.8,
                  },
                ]}>
                Sitemap
              </Text>
            )}
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

function NotFoundAsset() {
  return <Image source={require('expo-router/assets/unmatched.png')} style={styles.image} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 24,
    paddingBottom: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 270,
    height: 168,
    resizeMode: 'contain',
    marginBottom: 28,
  },
  title: {
    ...Platform.select({
      web: {
        fontSize: 64,
        lineHeight: 64,
      },
      default: {
        fontSize: 56,
        lineHeight: 56,
      },
    }),
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 34,
    marginTop: 4,
    marginBottom: 12,
    fontWeight: '200',
    textAlign: 'center',
  },
  pageLink: {
    minHeight: 20,
  },
  secondaryText: {
    color: '#9ba1a6',
  },
  placeholder: {
    backgroundColor: '#9ba1a644',
    minWidth: 180,
    borderRadius: 5,
  },
  linkContainer: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 12,
  },
  link: {
    fontSize: 20,
    textAlign: 'center',
    color: '#52a9ff',
  },
  linkSeparator: {
    fontSize: 20,
  },
});

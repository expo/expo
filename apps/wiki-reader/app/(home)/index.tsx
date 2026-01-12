import {
  Box,
  Host,
  HorizontalFloatingToolbar,
  Icon,
  IconButton,
  paddingAll,
  align,
  offset,
  PullToRefreshBox,
  fillMaxSize,
  SearchBar,
} from '@expo/ui/jetpack-compose';
import { DrawerActions } from '@react-navigation/native';
import { Stack, useNavigation } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ComposeWebView, type ComposeWebViewRef } from '../../modules/compose-webview';

const WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/Special:Random';

export default function Home() {
  const colorScheme = useColorScheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const webViewRef = useRef<ComposeWebViewRef>(null);

  const navigation = useNavigation();

  const shuffle = useCallback(() => {
    webViewRef.current?.loadUrl(WIKIPEDIA_URL);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Host matchContents>
              <IconButton onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                <Icon source={require('../../assets/symbols/menu.xml')} tintColor="black" />
              </IconButton>
            </Host>
          ),
          headerRight: () => (
            <Host matchContents>
              <IconButton variant="bordered" onPress={shuffle}>
                <Icon source={require('../../assets/symbols/shuffle.xml')} tintColor="#1d1b20" />
              </IconButton>
            </Host>
          ),
          headerTitle: () => (
            <Host
              style={{
                height: 56,
                marginHorizontal: 16,
              }}>
              <SearchBar />
            </Host>
          ),
          headerShadowVisible: false,
        }}
      />

      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <Box
          modifiers={[fillMaxSize(), paddingAll(8)]}
          floatingToolbarExitAlwaysScrollBehavior="bottom">
          <PullToRefreshBox
            modifiers={[fillMaxSize()]}
            isRefreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              await webViewRef.current?.reload();
              setIsRefreshing(false);
            }}>
            <ComposeWebView url={WIKIPEDIA_URL} ref={webViewRef} />
          </PullToRefreshBox>

          <HorizontalFloatingToolbar
            variant="vibrant"
            modifiers={[align('bottomCenter'), offset(0, -16)]}>
            <IconButton onPress={shuffle}>
              <Icon source={require('../../assets/symbols/shuffle.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('../../assets/symbols/translate.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('../../assets/symbols/share.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('../../assets/symbols/download.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('../../assets/symbols/upward.xml')} tintColor="#1d1b20" />
            </IconButton>
            <HorizontalFloatingToolbar.FloatingActionButton onPress={() => alert('Search')}>
              <Icon source={require('../../assets/symbols/search.xml')} tintColor="#1d1b20" />
            </HorizontalFloatingToolbar.FloatingActionButton>
          </HorizontalFloatingToolbar>
        </Box>
      </Host>
    </>
  );
}

import {
  Box,
  Host,
  HorizontalFloatingToolbar,
  Icon,
  IconButton,
  PullToRefreshBox,
  SearchBar,
  Text,
  Column,
  LinearProgress,
} from '@expo/ui/jetpack-compose';
import {
  paddingAll,
  align,
  offset,
  fillMaxSize,
  fillMaxWidth,
} from '@expo/ui/jetpack-compose/modifiers';
import { DrawerActions } from '@react-navigation/native';
import { Stack, useNavigation } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';

import { ComposeWebView, type ComposeWebViewRef } from '@/modules/compose-webview';

const WIKIPEDIA_URL = 'https://en.wikipedia.org/wiki/Special:Random';

export default function Home() {
  const colorScheme = useColorScheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const webViewRef = useRef<ComposeWebViewRef>(null);
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);

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
                <Icon source={require('@/assets/symbols/menu.xml')} tintColor="black" />
              </IconButton>
            </Host>
          ),
          headerRight: () => (
            <Host matchContents>
              <IconButton variant="bordered" onPress={shuffle}>
                <Icon source={require('@/assets/symbols/shuffle.xml')} tintColor="#1d1b20" />
              </IconButton>
            </Host>
          ),
          headerTitle: () => (
            <Host
              style={{
                height: 52,
                marginHorizontal: 16,
              }}>
              <SearchBar
                onSearch={(searchText) => {
                  alert(`search for: ${searchText}`);
                }}>
                <SearchBar.Placeholder>
                  <Column modifiers={[fillMaxWidth()]}>
                    <Text style={{ typography: 'bodyLarge' }}>Search wikipedia</Text>
                  </Column>
                </SearchBar.Placeholder>
                <SearchBar.ExpandedFullScreenSearchBar>
                  <Column modifiers={[fillMaxWidth()]}>
                    <Text style={{ typography: 'labelLarge' }}>Dummy search item</Text>
                  </Column>
                </SearchBar.ExpandedFullScreenSearchBar>
              </SearchBar>
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
            <ComposeWebView
              url={WIKIPEDIA_URL}
              ref={webViewRef}
              onLoadingProgressChanged={(progress) => setProgress(progress)}
            />
          </PullToRefreshBox>
          {progress > 0 && progress < 100 ? (
            <LinearProgress
              progress={progress / 100}
              modifiers={[fillMaxWidth(), align('topCenter')]}
            />
          ) : null}

          <HorizontalFloatingToolbar
            variant="vibrant"
            modifiers={[align('bottomCenter'), offset(0, -16)]}>
            <IconButton onPress={shuffle}>
              <Icon source={require('@/assets/symbols/shuffle.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('@/assets/symbols/translate.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('@/assets/symbols/share.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('@/assets/symbols/download.xml')} tintColor="#1d1b20" />
            </IconButton>
            <IconButton onPress={() => {}}>
              <Icon source={require('@/assets/symbols/upward.xml')} tintColor="#1d1b20" />
            </IconButton>
            <HorizontalFloatingToolbar.FloatingActionButton onPress={() => alert('Search')}>
              <Icon source={require('@/assets/symbols/search.xml')} tintColor="#1d1b20" />
            </HorizontalFloatingToolbar.FloatingActionButton>
          </HorizontalFloatingToolbar>
        </Box>
      </Host>
    </>
  );
}

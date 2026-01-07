import {
  Button,
  Box,
  Column,
  Host,
  HorizontalFloatingToolbar,
  Icon,
  IconButton,
  fillMaxWidth,
  paddingAll,
  align,
  offset,
} from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { RefreshControl, ScrollView, useColorScheme } from 'react-native';

export default function Home() {
  const colorScheme = useColorScheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <ScrollView
      contentContainerStyle={{ flex: 1, backgroundColor: 'white' }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => setIsRefreshing(true)} />
      }>
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <Box modifiers={[fillMaxWidth(), paddingAll(8)]}>
          <Column>
            <Button onPress={() => {}}>Search</Button>
          </Column>
          <HorizontalFloatingToolbar
            variant="vibrant"
            modifiers={[align('bottomCenter'), offset(0, -16)]}>
            <IconButton onPress={() => {}}>
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
    </ScrollView>
  );
}

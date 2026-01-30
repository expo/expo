import {
  Box,
  Column,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  Row,
  Spacer,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
import { Color, Stack } from 'expo-router';
import { useColorScheme, Linking } from 'react-native';

import { ClickableListItem, cornerRadii } from '@/components/ClickableListItem';

export default function About() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen options={{ title: 'About' }} />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <LazyColumn
          verticalArrangement={{ spacedBy: 2 }}
          contentPadding={{ start: 16, end: 16, top: 8, bottom: 16 }}>
          {/* App header */}
          <Column
            horizontalAlignment="center"
            modifiers={[
              clip(
                Shapes.RoundedCorner({
                  topStart: 20,
                  topEnd: 20,
                  bottomStart: 20,
                  bottomEnd: 20,
                })
              ),
              background(Color.android.dynamic.surfaceContainer),
              fillMaxWidth(),
              paddingAll(24),
            ]}>
            <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }}>
              <Icon
                source={require('@/assets/symbols/feed.xml')}
                size={40}
                tintColor={Color.android.dynamic.primary}
              />
              <Text style={{ typography: 'headlineSmall', fontWeight: 'bold' }}>Wiki Reader</Text>
            </Row>
            <Spacer modifiers={[height(4)]} />
            <Text style={{ typography: 'bodyMedium' }}>
              Expo UI clone of nsh07/WikiReader
            </Text>
          </Column>

          <Spacer modifiers={[height(8)]} />

          {/* App info group */}
          <ListItem
            headline="Version"
            supportingText="1.0.0 (expo-ui)"
            modifiers={[clip(Shapes.RoundedCorner(cornerRadii('leading')))]}>
            <ListItem.Leading>
              <Icon
                source={require('@/assets/symbols/outline_info.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ListItem.Leading>
          </ListItem>
          <ClickableListItem
            headline="Source Code"
            supportingText="expo/expo — apps/wiki-reader"
            onClick={() =>
              Linking.openURL('https://github.com/expo/expo/tree/main/apps/wiki-reader')
            }>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/function.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>
          <ClickableListItem
            headline="Original App"
            supportingText="nsh07/WikiReader on GitHub"
            onClick={() => Linking.openURL('https://github.com/nsh07/WikiReader')}>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/open_in_full.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>
          <ClickableListItem
            headline="License"
            supportingText="MIT"
            itemPosition="trailing"
            onClick={() =>
              Linking.openURL('https://github.com/expo/expo/blob/main/apps/wiki-reader/LICENSE')
            }>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/feed.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>

          {/* Built with */}
          <Text
            style={{ typography: 'titleSmall' }}
            color={Color.android.dynamic.primary}
            modifiers={[padding(32, 14, 32, 14)]}>
            Built with
          </Text>
          <ClickableListItem
            headline="@expo/ui"
            supportingText="Jetpack Compose components for React Native"
            itemPosition="leading"
            onClick={() =>
              Linking.openURL('https://docs.expo.dev/ui/expo-ui/introduction/')
            }>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/palette.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>
          <ClickableListItem
            headline="Expo Router"
            supportingText="File-based routing for React Native"
            itemPosition="trailing"
            onClick={() => Linking.openURL('https://docs.expo.dev/router/introduction/')}>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/share.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>

          {/* Credits */}
          <Text
            style={{ typography: 'titleSmall' }}
            color={Color.android.dynamic.primary}
            modifiers={[padding(32, 14, 32, 14)]}>
            Credits
          </Text>
          <ClickableListItem
            headline="Nishant Mishra"
            supportingText="Original WikiReader author"
            itemPosition="leading"
            onClick={() => Linking.openURL('https://github.com/nsh07')}>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/share.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>
          <ClickableListItem
            headline="Donate"
            supportingText="Support the original author"
            itemPosition="trailing"
            onClick={() => Linking.openURL('https://github.com/sponsors/nsh07')}>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/filled_info.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>

          {/* Wikipedia */}
          <Text
            style={{ typography: 'titleSmall' }}
            color={Color.android.dynamic.primary}
            modifiers={[padding(32, 14, 32, 14)]}>
            Wikipedia
          </Text>
          <ClickableListItem
            headline="Wikipedia"
            supportingText="The free encyclopedia"
            itemPosition="leading"
            onClick={() => Linking.openURL('https://wikipedia.org')}>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/language.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>
          <ClickableListItem
            headline="Support Wikipedia"
            supportingText="Donate to the Wikimedia Foundation"
            itemPosition="trailing"
            onClick={() => Linking.openURL('https://wikimediafoundation.org/support/')}>
            <ClickableListItem.Leading>
              <Icon
                source={require('@/assets/symbols/translate.xml')}
                tintColor={Color.android.dynamic.onSurfaceVariant}
              />
            </ClickableListItem.Leading>
          </ClickableListItem>

          <Spacer modifiers={[height(16)]} />
        </LazyColumn>
      </Host>
    </>
  );
}

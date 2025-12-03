import {
  background,
  Box,
  clip,
  fillMaxHeight,
  fillMaxSize,
  Host,
  // IconButton removed — replaced by wrapper
  padding,
  Row,
  Shape,
  size,
  weight,
} from '@expo/ui/jetpack-compose';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIconButton from '../components/AppIconButton';

const HEADER_HEIGHT = 60;

function LinkText({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <Text style={styles.link} onPress={() => Linking.openURL(url)}>
      {children}
    </Text>
  );
}

function SubscriptText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subscript}>{children}</Text>;
}

export default function Home() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
  };

  const contentContainerStyle = {
    paddingTop: insets.top + HEADER_HEIGHT + 24,
    paddingLeft: insets.left + 8,
    paddingRight: insets.right + 8,
    paddingBottom: insets.bottom,
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentInset={insets}
        contentContainerStyle={contentContainerStyle}>
        <Text style={styles.title}>Lavandula</Text>
        <Text style={styles.subtitle}>Genus of plants</Text>
        <Host style={{ width: '100%', aspectRatio: 3 / 2 }}>
          <Box modifiers={[fillMaxSize(), clip(Shape.Rectangle({ cornerRounding: 0.1 }))]}>
            {/* TODO: Add RNHost */}
            <Image
              source={{ uri: 'https://picsum.photos/1000/1000' }}
              style={{ width: 500, height: 500 }}
            />
          </Box>
        </Host>

        <Text style={styles.article}>
          <LinkText url="https://en.wikipedia.org/wiki/Lavandula">
            <Text style={{ fontWeight: '700' }}>Lavandula</Text>
          </LinkText>{' '}
          (common name <LinkText url="https://en.wikipedia.org/wiki/Lavender">lavender</LinkText>)
          is a genus of 47 known species of perennial flowering plants in the sage family{' '}
          <LinkText url="https://en.wikipedia.org/wiki/Lamiaceae">Lamiaceae</LinkText>
          <SubscriptText>1</SubscriptText>. It is native to the Old World, primarily found across
          the drier, warmer regions of the{' '}
          <LinkText url="https://en.wikipedia.org/wiki/Mediterranean_Basin">Mediterranean</LinkText>{' '}
          <SubscriptText>2</SubscriptText>, with an affinity for maritime breezes. Lavender is found
          on the Iberian Peninsula and around the entirety of the Mediterranean coastline (including
          the Adriatic coast, the Balkans, the Levant, and coastal North Africa), in parts of
          Eastern and Southern Africa and the Middle East, as well as in South Asia and on the
          Indian subcontinent <SubscriptText>3</SubscriptText>. Many members of the genus are
          cultivated extensively in temperate climates as ornamental plants for garden and landscape
          use, for use as culinary herbs, and also commercially for the extraction of essential oils
          <SubscriptText>4</SubscriptText>. Lavender is used in traditional medicine and as an
          ingredient in cosmetics. Lavender is used in traditional medicine and as an ingredient in
          cosmetics. Lavender is used in traditional medicine and as an ingredient in cosmetics.
        </Text>
      </ScrollView>
      <BottomFloatingTabBar />
    </View>
  );
}

function BottomFloatingTabBar() {
  return (
    <Host
      style={{
        position: 'absolute',
        bottom: 60,
        right: 60,
        height: 52,
        width: 300,
      }}>
      <Row modifiers={[fillMaxSize()]}>
        <Row
          modifiers={[
            weight(1),
            background('#555577'),
            clip(Shape.Rectangle({ cornerRounding: 1 })),
            fillMaxHeight(),
          ]}
          horizontalArrangement="spaceBetween"
          verticalAlignment="center">
          <AppIconButton
            icon="translate"
            modifiers={[size(40, 40), padding(6, 0, 0, 0)]}
            shape={Shape.Circle({ radius: 1 })}
          />
          <AppIconButton
            icon="share"
            modifiers={[size(40, 40), padding(0, 0, 6, 0)]}
            onPress={console.log}
            shape={Shape.Circle({ radius: 1 })}
          />
          <AppIconButton
            icon="download"
            modifiers={[size(40, 40), padding(0, 0, 6, 0)]}
            onPress={console.log}
            shape={Shape.Circle({ radius: 1 })}
          />
          <AppIconButton
            icon="upload"
            modifiers={[size(40, 40), padding(0, 0, 6, 0)]}
            onPress={console.log}
            shape={Shape.Circle({ radius: 1 })}
          />
          <AppIconButton
            icon="shuffle"
            size={24}
            modifiers={[size(40, 40), padding(0, 0, 6, 0)]}
            onPress={console.log}
            shape={Shape.Circle({ radius: 1 })}
          />
        </Row>
        <AppIconButton
          variant="bordered"
          icon="search"
          size={24}
          iconSize={52}
          modifiers={[size(52, 52), padding(6, 0, 0, 0)]}
          onPress={console.log}
          shape={Shape.Rectangle({ cornerRounding: 0.2, smoothing: 1 })}
        />
      </Row>
    </Host>
  );
}

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, Times, serif',
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF8FB',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
    color: '#222222',
    fontFamily: serifFont,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#8C8C8C',
    fontWeight: '400',
    marginBottom: 18,
  },
  article: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 24,
    color: '#222',
    marginBottom: 1000,
  },
  link: {
    color: '#724b7a',
    textDecorationLine: 'underline',
    textDecorationColor: '#d7b7e6',
  },
  subscript: {
    fontSize: 8,
    lineHeight: 8,
    color: '#8c8c8c',
    // doesn't work
    textAlignVertical: 'top',
  },
});

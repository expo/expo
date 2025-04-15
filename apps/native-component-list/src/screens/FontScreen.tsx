import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Font from 'expo-font';
import { useState } from 'react';
import { Button, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Page, Section } from '../components/Page';

export default function FontScreen() {
  const [preview, setPreview] = useState<string | null>(null);
  const toImageAsync = async (glyphs: string, options: any) => {
    const imageURL = await Font.renderToImageAsync(glyphs, options);
    setPreview(imageURL);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <Page>
        <Section title="loadAsync">
          <Text style={{ fontFamily: 'space-mono', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded from the web
          </Text>
          <Text style={{ fontFamily: 'Roboto', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded by providing remote uri as well.
          </Text>
          {Platform.OS === 'ios' && (
            <Text
              adjustsFontSizeToFit
              numberOfLines={2}
              style={{
                fontFamily: 'space-mono',
                fontSize: 420,
              }}>
              Custom font with `adjustsFontSizeToFit` on iOS
            </Text>
          )}
          {Platform.OS === 'ios' && (
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                fontFamily: 'Roboto',
                fontSize: 420,
              }}>
              Custom remote uri font with `adjustsFontSizeToFit` on iOS
            </Text>
          )}
        </Section>
        <Section title="Ionicons">
          <View style={styles.vectorIconsRow}>
            <Ionicons name="search-sharp" size={25} />
            <Ionicons name="share-outline" size={25} />
            <Ionicons name="thunderstorm-outline" size={25} />
            <Ionicons name="volume-medium" size={25} />
            <Ionicons name="wine-sharp" size={25} />
            <Ionicons name="newspaper-outline" size={25} />
          </View>
          <View style={styles.vectorIconsRow}>
            <Ionicons name="logo-facebook" size={25} />
            <Ionicons name="logo-apple" size={25} />
            <Ionicons name="logo-amazon" size={25} />
            <Ionicons name="logo-npm" size={25} />
            <Ionicons name="logo-google" size={25} />
            <Ionicons name="alarm" size={25} />
          </View>
        </Section>
        <Section title="FontAwesome5">
          <View style={styles.vectorIconsRow}>
            <FontAwesome5 name="laugh-wink" size={25} />
            <FontAwesome5 name="smile-beam" size={25} />
            <FontAwesome5 name="map" size={25} />
            <FontAwesome5 name="bacon" size={25} />
            <FontAwesome5 name="basketball-ball" size={25} />
            <FontAwesome5 name="biking" size={25} />
          </View>
          <View style={styles.vectorIconsRow}>
            <FontAwesome5 name="home" size={25} />
            <FontAwesome5 name="paw" size={25} />
            <FontAwesome5 name="map" size={25} solid />
            <FontAwesome5 name="camera" size={25} />
            <FontAwesome5 name="cat" size={25} />
            <FontAwesome5 name="horse" size={25} />
          </View>
          <View style={styles.vectorIconsRow}>
            <FontAwesome5 name="react" size={25} />
            <FontAwesome5 name="aws" size={25} />
            <FontAwesome5 name="swift" size={25} />
            <FontAwesome5 name="facebook" size={25} />
            <FontAwesome5 name="twitter" size={25} />
            <FontAwesome5 name="apple" size={25} />
          </View>
        </Section>
        <Section title="Custom Fonts">
          <View style={styles.customFonts}>
            <View style={{ flex: 1 }}>
              {/* Loaded from .otf files in asset directory */}
              <Text style={{ fontFamily: 'Inter-ThinItalic', fontSize: 16 }}>Inter-ThinItalic</Text>
              <Text style={{ fontFamily: 'Inter-BoldItalic', fontSize: 16 }}>Inter-BoldItalic</Text>
              <Text style={{ fontFamily: 'Inter-ExtraBoldItalic', fontSize: 16 }}>
                Inter-ExtraBoldItalic
              </Text>
              {/* Loaded from @expo-google-fonts/inter */}
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16 }}>Inter_500Medium</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
                Inter_600SemiBold
              </Text>
              <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 16 }}>
                Inter_800ExtraBold
              </Text>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }}>Inter_900Black</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'OpenSans_Condensed-SemiBold', fontSize: 16 }}>
                OpenSans_Condensed-SemiBold
              </Text>
              <Text style={{ fontFamily: 'OpenSans_Condensed-BoldItalic', fontSize: 16 }}>
                OpenSans_Condensed-BoldItalic
              </Text>
              <Text style={{ fontFamily: 'OpenSans-Light', fontSize: 16 }}>OpenSans-Light</Text>
              <Text style={{ fontFamily: 'OpenSans-Medium', fontSize: 16 }}>OpenSans-Medium</Text>
              <Text style={{ fontFamily: 'OpenSans-SemiBold', fontSize: 16 }}>
                OpenSans-SemiBold
              </Text>

              <Text style={{ fontFamily: 'OpenSans-ExtraBoldItalic', fontSize: 16 }}>
                OpenSans-ExtraBoldItalic
              </Text>
            </View>
          </View>
        </Section>
        <Section title="renderToImageAsync">
          <Button
            title="ABCD Inter-ThinItalic"
            onPress={() =>
              toImageAsync('ABCD', {
                fontFamily: 'Inter-BoldItalic',
                size: 172,
              })
            }
          />
          <Button
            title="React from FontAwesome5"
            onPress={() =>
              toImageAsync(String.fromCodePoint(62491), {
                fontFamily: 'FontAwesome5Free-Brand',
                color: '#61dafb',
                size: 172,
              })
            }
          />
          {preview && (
            <Image source={{ uri: preview }} style={{ height: 64 }} resizeMode="contain" />
          )}
        </Section>
      </Page>
    </ScrollView>
  );
}

FontScreen.navigationOptions = {
  title: 'Font',
};

const styles = StyleSheet.create({
  vectorIconsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1,
  },
  vectorIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
  },
  vectorIconsName: {
    margin: 15,
    fontSize: 22,
  },
  customFonts: {
    padding: 15,
    flex: 1,
    gap: 4,
    flexDirection: 'row',
  },
});

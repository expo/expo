import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from 'ThemeProvider';
import * as Font from 'expo-font';
import { RenderToImageResult } from 'expo-font';
import { Image } from 'expo-image';
import { useState, useEffect, Fragment } from 'react';
import { Platform, ScrollView, StyleSheet, View, Image as CoreImage } from 'react-native';

import { BodyText } from '../components/BodyText';
import { Page, Section } from '../components/Page';
import { ExpoVectorIconsCompatibilitySection } from './ExpoVectorIconsCompatibilitySection';

const round = (num: number) => Math.round(num * 100) / 100;

export default function FontScreen() {
  const { theme } = useTheme();
  const color = theme.text.default;

  const renderedFontAsImage = useLoadIcon(() =>
    Font.renderToImageAsync('ÅBÇD', {
      fontFamily: 'Inter-BoldItalic',
      size: 100,
    })
  );

  const renderedFontAsImageLineHeight100 = useLoadIcon(() =>
    Font.renderToImageAsync('ÅBÇD', {
      fontFamily: 'Inter-BoldItalic',
      size: 100,
      lineHeight: 100,
    })
  );

  const renderedFontAsImageLineHeight150 = useLoadIcon(() =>
    Font.renderToImageAsync('ÅBÇD', {
      fontFamily: 'Inter-BoldItalic',
      size: 100,
      lineHeight: 150,
    })
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <Page>
        <Section title="loadAsync">
          <BodyText style={{ fontFamily: 'space-mono', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded from the web
          </BodyText>
          <BodyText style={{ fontFamily: 'Roboto', fontSize: 16 }}>
            Font icons sets and other custom fonts can be loaded by providing remote uri as well.
          </BodyText>
          {Platform.OS === 'ios' && (
            <BodyText
              adjustsFontSizeToFit
              numberOfLines={2}
              style={{
                fontFamily: 'space-mono',
                fontSize: 420,
              }}>
              Custom font with `adjustsFontSizeToFit` on iOS
            </BodyText>
          )}
          {Platform.OS === 'ios' && (
            <BodyText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                fontFamily: 'Roboto',
                fontSize: 420,
              }}>
              Custom remote uri font with `adjustsFontSizeToFit` on iOS
            </BodyText>
          )}
        </Section>
        <Section title="Ionicons">
          <View style={styles.vectorIconsRow}>
            <Ionicons name="search-sharp" size={25} color={color} />
            <Ionicons name="share-outline" size={25} color={color} />
            <Ionicons name="thunderstorm-outline" size={25} color={color} />
            <Ionicons name="volume-medium" size={25} color={color} />
            <Ionicons name="wine-sharp" size={25} color={color} />
            <Ionicons name="newspaper-outline" size={25} color={color} />
          </View>
          <View style={styles.vectorIconsRow}>
            <Ionicons name="logo-facebook" size={25} color={color} />
            <Ionicons name="logo-apple" size={25} color={color} />
            <Ionicons name="logo-amazon" size={25} color={color} />
            <Ionicons name="logo-npm" size={25} color={color} />
            <Ionicons name="logo-google" size={25} color={color} />
            <Ionicons name="alarm" size={25} color={color} />
          </View>
        </Section>
        <Section title="Material Design Icons">
          <View style={styles.vectorIconsRow}>
            <MaterialCommunityIcons name="emoticon-wink" size={25} color={color} />
            <MaterialCommunityIcons name="map" size={25} color={color} />
            <MaterialCommunityIcons name="food-drumstick" size={25} color={color} />
            <MaterialCommunityIcons name="basketball" size={25} color={color} />
            <MaterialCommunityIcons name="bike" size={25} color={color} />
            <MaterialCommunityIcons name="home" size={25} color={color} />
          </View>
          <View style={styles.vectorIconsRow}>
            <MaterialCommunityIcons name="paw" size={25} color={color} />
            <MaterialCommunityIcons name="camera" size={25} color={color} />
            <MaterialCommunityIcons name="cat" size={25} color={color} />
            <MaterialCommunityIcons name="horse" size={25} color={color} />
            <MaterialCommunityIcons name="react" size={25} color={color} />
            <MaterialCommunityIcons name="apple" size={25} color={color} />
          </View>
        </Section>
        <ExpoVectorIconsCompatibilitySection color={color} />
        <Section title="Custom Fonts">
          <View style={styles.customFonts}>
            <View style={{ flex: 1 }}>
              {/* Loaded from .otf files in asset directory */}
              <BodyText style={{ fontFamily: 'Inter-ThinItalic', fontSize: 16 }}>
                Inter-ThinItalic
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter-BoldItalic', fontSize: 16 }}>
                Inter-BoldItalic
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter-ExtraBoldItalic', fontSize: 16 }}>
                Inter-ExtraBoldItalic
              </BodyText>
              {/* Loaded from @expo-google-fonts/inter */}
              <BodyText style={{ fontFamily: 'Inter_500Medium', fontSize: 16 }}>
                Inter_500Medium
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
                Inter_600SemiBold
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 16 }}>
                Inter_800ExtraBold
              </BodyText>
              <BodyText style={{ fontFamily: 'Inter_900Black', fontSize: 16 }}>
                Inter_900Black
              </BodyText>
            </View>
            <View style={{ flex: 1 }}>
              <BodyText style={{ fontFamily: 'OpenSans_Condensed-SemiBold', fontSize: 16 }}>
                OpenSans_Condensed-SemiBold
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans_Condensed-BoldItalic', fontSize: 16 }}>
                OpenSans_Condensed-BoldItalic
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans-Light', fontSize: 16 }}>
                OpenSans-Light
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans-Medium', fontSize: 16 }}>
                OpenSans-Medium
              </BodyText>
              <BodyText style={{ fontFamily: 'OpenSans-SemiBold', fontSize: 16 }}>
                OpenSans-SemiBold
              </BodyText>

              <BodyText style={{ fontFamily: 'OpenSans-ExtraBoldItalic', fontSize: 16 }}>
                OpenSans-ExtraBoldItalic
              </BodyText>
            </View>
          </View>
        </Section>
        {Platform.OS !== 'web' && <VectorIconSection />}

        {Platform.OS !== 'web' && (
          <Section title="renderToImageAsync" gap={5}>
            {renderedFontAsImage && (
              <>
                <BodyText>
                  Inter-BoldItalic rendered to image
                  {round(renderedFontAsImage.width)}x{round(renderedFontAsImage.height)}
                </BodyText>
                <Image
                  source={{ uri: renderedFontAsImage.uri }}
                  style={{
                    height: renderedFontAsImage.height,
                    width: renderedFontAsImage.width,
                    backgroundColor: 'grey',
                  }}
                  contentFit="cover"
                />
              </>
            )}
            {renderedFontAsImageLineHeight100 && (
              <>
                <BodyText>
                  Inter-BoldItalic rendered to image line-heigth: 100{' '}
                  {round(renderedFontAsImageLineHeight100.width)}x
                  {round(renderedFontAsImageLineHeight100.height)}
                </BodyText>
                <Image
                  source={{ uri: renderedFontAsImageLineHeight100.uri }}
                  style={{
                    height: renderedFontAsImageLineHeight100.height,
                    width: renderedFontAsImageLineHeight100.width,
                    backgroundColor: 'grey',
                  }}
                  contentFit="cover"
                />
                <BodyText>Image above should look the same as &lt;Text&gt;</BodyText>
                <BodyText
                  style={{
                    fontFamily: 'Inter-BoldItalic',
                    fontSize: 100,
                    lineHeight: 100,
                    backgroundColor: 'grey',
                  }}>
                  ÅBÇD
                </BodyText>
              </>
            )}
            {renderedFontAsImageLineHeight150 && (
              <>
                <BodyText>
                  Inter-BoldItalic rendered to image line-heigth: 150{' '}
                  {round(renderedFontAsImageLineHeight150.width)}x
                  {round(renderedFontAsImageLineHeight150.height)}
                </BodyText>
                <Image
                  source={{ uri: renderedFontAsImageLineHeight150.uri }}
                  style={{
                    height: renderedFontAsImageLineHeight150.height,
                    width: renderedFontAsImageLineHeight150.width,
                    backgroundColor: 'grey',
                  }}
                  contentFit="cover"
                />
                <BodyText>Image above should look the same as &lt;Text&gt;</BodyText>
                <BodyText
                  style={{
                    fontFamily: 'Inter-BoldItalic',
                    fontSize: 100,
                    lineHeight: 150,
                    backgroundColor: 'grey',
                  }}>
                  ÅBÇD
                </BodyText>
              </>
            )}
          </Section>
        )}

        <VariableFontSection />
      </Page>
    </ScrollView>
  );
}

// One file, loaded under one name, carrying a `wght` axis with a named instance per weight and a
// `slnt` axis giving each of them an italic. `fontWeight` and `fontStyle` pick between them — with
// a static font every row below would look identical.
const VARIABLE_FONT_FAMILY = 'RobotoFlex-variable';
const WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;

function VariableFontSection() {
  return (
    <Section title="variable fonts" gap={5}>
      <BodyText>
        Roboto Flex, loaded at runtime once under the name &quot;{VARIABLE_FONT_FAMILY}&quot;. Both
        columns should get steadily heavier, and the right one should slant — one file backing all
        of it.
      </BodyText>
      <View style={styles.variableFontRow}>
        <View style={styles.variableFontColumn}>
          {WEIGHTS.map((weight) => (
            <BodyText
              key={weight}
              style={{ fontFamily: VARIABLE_FONT_FAMILY, fontWeight: weight, fontSize: 20 }}>
              {weight} Hamburg
            </BodyText>
          ))}
        </View>
        <View style={styles.variableFontColumn}>
          {WEIGHTS.map((weight) => (
            <BodyText
              key={weight}
              style={{
                fontFamily: VARIABLE_FONT_FAMILY,
                fontWeight: weight,
                fontStyle: 'italic',
                fontSize: 20,
              }}>
              {weight} Hamburg
            </BodyText>
          ))}
        </View>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  variableFontRow: { flexDirection: 'row', columnGap: 12 },
  variableFontColumn: { flex: 1 },
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

const size = 100;

function useLoadIcon(getImage: () => Promise<RenderToImageResult | null>) {
  const [icon, setIcon] = useState<RenderToImageResult | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') {
      // result not used on web
      return;
    }
    const loadIcon = async () => {
      const icon = await getImage();
      if (icon) {
        setIcon(icon);
      } else {
        console.error('Failed to load icon');
      }
    };
    loadIcon();
  }, []);
  return icon;
}

function VectorIconSection() {
  const icons = [
    useLoadIcon(() => MaterialCommunityIcons.getImageSource('camera', size, 'yellow')),
    useLoadIcon(() => Ionicons.getImageSource('camera', size, 'yellow')),
  ];

  return (
    <Section title="vector icon to image">
      <BodyText>rendered in expo-image and RN-core Image</BodyText>
      <BodyText>
        To get the pixel size of an image, multiply `renderedImage.dimension * scale`
      </BodyText>

      {icons.map((icon) => {
        return (
          !!icon && (
            <Fragment key={icon.uri}>
              <BodyText>
                Icon rendered to image {round(icon.width)}x{round(icon.height)}, scale: {icon.scale}
              </BodyText>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Image
                  source={icon}
                  style={{
                    height: icon.height,
                    width: icon.width,
                    backgroundColor: 'lightgrey',
                  }}
                />
                <CoreImage
                  source={icon}
                  style={{
                    backgroundColor: 'lightgrey',
                  }}
                />
              </View>
            </Fragment>
          )
        );
      })}
    </Section>
  );
}

import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FoundationIcons from '@expo/vector-icons/Foundation';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Font from 'expo-font';
import { RenderToImageResult } from 'expo-font';
import { Image } from 'expo-image';
import { useState, useEffect, Fragment } from 'react';
import { Platform, ScrollView, StyleSheet, View, Image as CoreImage } from 'react-native';

import { Page, Section } from '../components/Page';
import { BodyText } from '../components/BodyText';
import { useTheme } from 'ThemeProvider';

const round = (num: number) => Math.round(num * 100) / 100;

export default function FontScreen() {
  const { theme } = useTheme();
  const color = theme.text.default;

  const renderedFontAwesomeImage = useLoadIcon(() =>
    Font.renderToImageAsync(String.fromCodePoint(62491), {
      fontFamily: 'FontAwesome5Free-Brand',
      color: '#61dafb',
      size: 172,
    })
  );

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
        <Section title="FontAwesome5">
          <View style={styles.vectorIconsRow}>
            <FontAwesome5 name="laugh-wink" size={25} color={color} />
            <FontAwesome5 name="smile-beam" size={25} color={color} />
            <FontAwesome5 name="map" size={25} color={color} />
            <FontAwesome5 name="bacon" size={25} color={color} />
            <FontAwesome5 name="basketball-ball" size={25} color={color} />
            <FontAwesome5 name="biking" size={25} color={color} />
          </View>
          <View style={styles.vectorIconsRow}>
            <FontAwesome5 name="home" size={25} color={color} />
            <FontAwesome5 name="paw" size={25} color={color} />
            <FontAwesome5 name="map" size={25} solid color={color} />
            <FontAwesome5 name="camera" size={25} color={color} />
            <FontAwesome5 name="cat" size={25} color={color} />
            <FontAwesome5 name="horse" size={25} color={color} />
          </View>
          <View style={styles.vectorIconsRow}>
            <FontAwesome5 name="react" size={25} color={color} />
            <FontAwesome5 name="aws" size={25} color={color} />
            <FontAwesome5 name="swift" size={25} color={color} />
            <FontAwesome5 name="facebook" size={25} color={color} />
            <FontAwesome5 name="twitter" size={25} color={color} />
            <FontAwesome5 name="apple" size={25} color={color} />
          </View>
        </Section>
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
        <VectorIconSection />

        <Section title="renderToImageAsync" gap={5}>
          {renderedFontAwesomeImage && (
            <>
              <BodyText>
                FontAwesome5Free rendered to image
                {round(renderedFontAwesomeImage.width)}x{round(renderedFontAwesomeImage.height)}
              </BodyText>
              <Image
                source={{ uri: renderedFontAwesomeImage.uri }}
                style={{
                  height: renderedFontAwesomeImage.height,
                  width: renderedFontAwesomeImage.width,
                  backgroundColor: 'grey',
                }}
                contentFit="cover"
              />
            </>
          )}
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

const size = 100;

function useLoadIcon(getImage: () => Promise<RenderToImageResult | null>) {
  const [icon, setIcon] = useState<RenderToImageResult | null>(null);
  useEffect(() => {
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
    useLoadIcon(() => MaterialIcons.getImageSource('camera', size, 'yellow')),
    useLoadIcon(() => FontAwesome.getImageSource('book', size, 'yellow')),
    useLoadIcon(() => Ionicons.getImageSource('camera', size, 'yellow')),
    useLoadIcon(() => FoundationIcons.getImageSource('book', size, 'yellow')),
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

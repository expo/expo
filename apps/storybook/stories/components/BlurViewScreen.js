import { BlurView } from 'expo-blur';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import image from '../../assets/roadster.jpg';
import UIExplorer, {
  AppText,
  Code,
  Description,
  DocItem,
  Section,
  storiesOf,
} from '../ui-explorer';

const Screen = () => (
  <UIExplorer title="Blur View">
    <Description>
      <AppText>
        A React component that renders a native blur view on iOS and falls back to a
        semi-transparent view on Android. A common usage of this is for navigation bars, tab bars,
        and modals.
      </AppText>
    </Description>
    <DocItem
      name="Importing the module"
      example={{
        code: `import { BlurView } from 'expo-blur';`,
      }}
    />
    <Section title="Props">
      <DocItem name="...View props" />

      <DocItem
        name="tint"
        label="Safari"
        typeInfo="'light' | 'default' | 'dark'"
        description="The filtered effect of the contents behind the BlurView. On Android and Chrome this is just the color of the low-opacity view."
        example={{
          render: () => (
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {['no blur', 'light', 'default', 'dark'].map(tint => (
                <View key={tint} style={{ alignItems: 'stretch', flex: 1 }}>
                  <Code style={{ textAlign: 'center' }}>{tint}</Code>

                  <View style={{ flex: 1, margin: 8, height: 200 }}>
                    <Image
                      source={image}
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: 'gray', resizeMode: 'cover' },
                      ]}
                    />
                    {tint !== 'no blur' && (
                      <BlurView style={{ flex: 1 }} intensity={100} tint={tint} />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ),
        }}
      />
      <DocItem
        name="intensity"
        label="Safari"
        typeInfo="number"
        description="A number from 1 to 100 to control the intensity of the blur effect."
        example={{
          render: () => (
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <Image
                source={image}
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: 'gray', bottom: 28, resizeMode: 'cover' },
                ]}
              />
              {[0, 33, 66, 100].map(intensity => (
                <View key={intensity} style={{ alignItems: 'stretch', flex: 1 }}>
                  <BlurView
                    style={{ flex: 1, margin: 8, minHeight: 200, maxHeight: 200 }}
                    intensity={intensity}
                  />
                  <Code style={{ textAlign: 'center' }}>{intensity}</Code>
                </View>
              ))}
            </View>
          ),
        }}
      />
    </Section>
  </UIExplorer>
);

storiesOf('Components', module).add('BlurView', Screen);

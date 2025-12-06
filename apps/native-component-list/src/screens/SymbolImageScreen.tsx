import { Image } from 'expo-image';
import {
  SymbolView,
  SymbolViewProps,
  SFSymbol,
  AndroidSymbol,
  unstable_getMaterialSymbolSourceAsync,
} from 'expo-symbols';
import bold from 'expo-symbols/androidWeights/bold';
import regular from 'expo-symbols/androidWeights/regular';
import thin from 'expo-symbols/androidWeights/thin';
import { useEffect, useState } from 'react';
import {
  PlatformColor,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Platform,
  type ImageSourcePropType,
} from 'react-native';

import { Symbols, AndroidSymbols } from '../constants';

type RowProps = { title?: string } & Partial<SymbolViewProps>;

function getRandomRow(data: string[], count: number = 8) {
  return new Array(count).fill('').map(() => {
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  });
}

const randomRow = getRandomRow(Platform.OS === 'ios' ? Symbols : AndroidSymbols);

function SymbolRow({ title, ...props }: RowProps) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ flexDirection: 'row' }}>
        {randomRow.map((symbol, index) => (
          <SymbolView
            {...props}
            name={{
              ios: symbol as SFSymbol,
              android: symbol as AndroidSymbol,
              web: symbol as AndroidSymbol,
            }}
            key={index}
            style={styles.symbol}
            resizeMode="scaleAspectFit"
          />
        ))}
      </View>
    </View>
  );
}

function SymbolWeights({ title, ...props }: RowProps) {
  const weights: SymbolViewProps['weight'][] = [
    { ios: 'black', android: bold },
    { ios: 'light', android: thin },
    { ios: 'regular', android: regular },
  ];

  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ flexDirection: 'row' }}>
        {randomRow.map((symbol, index) => {
          const weight = weights[index % weights.length];
          return (
            <View key={index} style={{ alignItems: 'center' }}>
              <SymbolView
                {...props}
                name={{ ios: symbol as SFSymbol, android: symbol as AndroidSymbol }}
                style={styles.symbol}
                weight={weight}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SymbolScales({ title, ...props }: RowProps) {
  const scales: SymbolViewProps['scale'][] = ['default', 'large', 'medium', 'small', 'unspecified'];

  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ flexDirection: 'row' }}>
        {randomRow.map((symbol, index) => {
          const scale = scales[index % scales.length];
          return (
            <View key={index} style={{ alignItems: 'center' }}>
              <SymbolView
                {...props}
                name={symbol as SFSymbol}
                style={styles.symbol}
                scale={scale}
              />
              <Text style={{ color: 'white', fontSize: 8 }}>{scale}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MaterialImageSourceExample({ name }: { name: AndroidSymbol }) {
  const [source, setSource] = useState<ImageSourcePropType | null>(null);
  useEffect(() => {
    unstable_getMaterialSymbolSourceAsync(name, 24, 'red').then((img) => {
      setSource(img);
    });
  }, []);
  return <Image source={source} style={{ width: 24, height: 24 }} />;
}

export default function SymbolImageScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 10, gap: 10 }}>
      <Text style={styles.title}>Use component directly</Text>
      <SymbolView
        name={{
          ios: 'pencil.tip.crop.circle.badge.plus',
          android: 'home_and_garden',
          web: 'home_and_garden',
        }}
        style={styles.symbol}
      />
      <Text style={styles.title}>Use fallback</Text>
      <SymbolView
        style={styles.symbol}
        name={{}}
        fallback={<View style={{ backgroundColor: 'red', width: 20, height: 20 }} />}
      />
      {process.env.EXPO_OS === 'android' && (
        <>
          <Text style={styles.title}>unstable_getMaterialSymbolSourceAsync</Text>
          <MaterialImageSourceExample name="home_and_garden" />
        </>
      )}
      <SymbolRow title="Monochrome (default)" type="monochrome" />
      {Platform.OS === 'ios' && (
        <>
          <SymbolRow
            title="Hierarchical"
            type="hierarchical"
            tintColor={PlatformColor('systemPurple')}
          />
          <SymbolRow title="Palette" colors={['red', 'green', 'blue']} type="palette" />
        </>
      )}
      <SymbolRow
        title="Palette RGB"
        colors={['rgb(40, 186, 54)', 'rgb(21, 186, 212)', 'rgb(184, 10, 44)']}
        type="palette"
      />
      <SymbolRow title="RGBA Color" tintColor="rgba(131, 8, 153, 0.9)" />
      <SymbolRow title="Multicolor" type="multicolor" />
      <SymbolWeights title="Weights" tintColor="yellow" />
      <SymbolScales title="Scales" tintColor="cyan" />
      <SymbolRow
        title="Bounce repeating"
        type="multicolor"
        tintColor="steelblue"
        animationSpec={{
          effect: {
            type: 'bounce',
            direction: 'up',
            wholeSymbol: true,
          },
          repeating: true,
        }}
      />
      <SymbolRow
        title="Pulse repeating"
        type="hierarchical"
        tintColor="tomato"
        animationSpec={{
          effect: {
            type: 'pulse',
            direction: 'down',
          },
          repeating: true,
        }}
      />
      <SymbolRow
        title="VariableColor"
        animationSpec={{
          variableAnimationSpec: {
            cumulative: true,
            dimInactiveLayers: true,
            reversing: true,
          },
        }}
      />
      <SymbolRow
        title="Bounce slow"
        tintColor="teal"
        animationSpec={{
          effect: {
            type: 'bounce',
            direction: 'up',
            wholeSymbol: true,
          },
          repeating: true,
          speed: 0.2,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black',
  },
  symbol: {
    width: 35,
    height: 35,
    margin: 5,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

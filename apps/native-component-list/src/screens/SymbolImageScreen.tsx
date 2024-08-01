import { SymbolView, SymbolViewProps, SFSymbol } from 'expo-symbols';
import { Text, View, StyleSheet, ScrollView } from 'react-native';

import { Symbols } from '../constants';

type RowProps = { title?: string } & Partial<SymbolViewProps>;

function getRandomRow(data: string[], count: number = 8) {
  return new Array(count).fill('').map(() => {
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  });
}

function SymbolRow({ title, ...props }: RowProps) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ flexDirection: 'row' }}>
        {getRandomRow(Symbols).map((symbol, index) => (
          <SymbolView
            {...props}
            name={symbol as SFSymbol}
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
    'black',
    'bold',
    'heavy',
    'medium',
    'light',
    'thin',
    'ultraLight',
    'unspecified',
  ];

  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ flexDirection: 'row' }}>
        {getRandomRow(Symbols).map((symbol, index) => {
          const weight = weights[index % weights.length];
          return (
            <View key={index} style={{ alignItems: 'center' }}>
              <SymbolView
                {...props}
                name={symbol as SFSymbol}
                style={styles.symbol}
                type="hierarchical"
                weight={weight}
              />
              <Text style={{ color: 'white', fontSize: 8 }}>{weight}</Text>
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
        {getRandomRow(Symbols).map((symbol, index) => {
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

export default function SymbolImageScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 10, gap: 10 }}>
      <Text style={styles.title}>Use component directly</Text>
      <SymbolView name="pencil.tip.crop.circle.badge.plus" style={styles.symbol} />
      <SymbolRow title="Monochrome (default)" type="monochrome" />
      <SymbolRow title="Hierarchical" type="hierarchical" tintColor="magenta" />
      <SymbolRow title="Palette" colors={['red', 'green', 'blue']} type="palette" />
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

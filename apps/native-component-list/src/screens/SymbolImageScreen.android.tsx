import { SymbolView, SymbolViewProps, AndroidSymbol } from 'expo-symbols';
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
  const data = Symbols.filter((symbol) =>
    symbol.includes(props.type || title?.toLowerCase() || '')
  );
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.title}>{title}</Text>
      <View style={{ flexDirection: 'row' }}>
        {getRandomRow(data)
          .filter((symbol) => symbol.includes(props.type || title?.toLowerCase() || ''))
          .map((symbol, index) => (
            <SymbolView
              {...props}
              androidName={symbol as AndroidSymbol}
              key={index}
              size={35}
              style={styles.symbol}
              resizeMode="scaleAspectFit"
            />
          ))}
      </View>
    </View>
  );
}

export default function SymbolImageScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 10, gap: 10 }}>
      <Text style={styles.title}>Use component directly</Text>
      <SymbolView androidName="filled.AcUnit" style={styles.symbol} />
      <SymbolRow title="Filled" tintColor="green" />
      <SymbolRow title="Outlined" tintColor="blue" />
      <SymbolRow title="Sharp" tintColor="magenta" />
      <SymbolRow title="Rounded" tintColor="red" />
      <SymbolRow title="TwoTone" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black',
  },
  symbol: {
    margin: 5,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

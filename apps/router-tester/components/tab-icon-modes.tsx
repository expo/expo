import { createContext, use } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ToggleRow } from './ToggleRow';
import { DemoScreen } from './demo-screen';

export const TabIconModesContext = createContext<{
  symbols: boolean;
  setSymbols: (symbols: boolean) => void;
}>({ symbols: false, setSymbols: () => {} });

export function TabIconModesScreen({ title, description }: { title: string; description: string }) {
  const { symbols, setSymbols } = use(TabIconModesContext);
  return (
    <DemoScreen title={title}>
      <Text style={styles.description}>{description}</Text>
      <ToggleRow
        label="Use symbols (SF Symbol on iOS, md on Android)"
        testID="tab-icon-modes-symbols-toggle"
        value={symbols}
        onValueChange={setSymbols}
      />
    </DemoScreen>
  );
}

const styles = StyleSheet.create({
  description: { fontSize: 16 },
});

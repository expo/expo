import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type DemoState = {
  rootHidden: boolean;
  setRootHidden: Dispatch<SetStateAction<boolean>>;
  largeTitle: boolean;
  setLargeTitle: Dispatch<SetStateAction<boolean>>;
  gestureEnabled: boolean;
  setGestureEnabled: Dispatch<SetStateAction<boolean>>;
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
  showSidebar: () => void;
  showMiddle: () => void;
};

export const DemoContext = createContext<DemoState | null>(null);

export function useDemoState() {
  const state = useContext(DemoContext);
  if (!state) {
    throw new Error('Split View Stack demo state is missing');
  }
  return state;
}

export function DemoControls() {
  const state = useDemoState();
  return (
    <View style={styles.controls}>
      <Text testID="swizzle-retained-state">Retained state: {state.count}</Text>
      <Control
        label="Increment retained state"
        onPress={() => state.setCount((count) => count + 1)}
      />
      <Control
        label={`Root hidden: ${state.rootHidden ? 'on' : 'off'}`}
        onPress={() => state.setRootHidden((value) => !value)}
      />
      <Control
        label={`Large title: ${state.largeTitle ? 'on' : 'off'}`}
        onPress={() => state.setLargeTitle((value) => !value)}
      />
      <Control
        label={`Gesture enabled: ${state.gestureEnabled ? 'on' : 'off'}`}
        onPress={() => state.setGestureEnabled((value) => !value)}
      />
      <Control label="Show sidebar" onPress={state.showSidebar} />
      <Control label="Show middle column" onPress={state.showMiddle} />
    </View>
  );
}

export function Control({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  controls: { gap: 8, marginVertical: 8 },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgb(11, 103, 175)',
  },
  buttonText: { color: '#fff' },
});

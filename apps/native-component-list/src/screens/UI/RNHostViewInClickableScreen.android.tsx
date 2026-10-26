import { Host, RNHostView, Row, Text } from '@expo/ui/jetpack-compose';
import { clickable, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text as RNText,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';

// Each row is a Compose `clickable` `Row` with React Native content hosted in an `RNHostView`.
// Plain hosted content passes a tap to the row. Hosted content that handles the press itself keeps it.
export default function RNHostViewInClickableScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ClickableRow name="view">
        <View style={styles.square} />
      </ClickableRow>
      <ClickableRow name="pointer-events-none">
        <View pointerEvents="none" style={styles.square} />
      </ClickableRow>
      <ClickableRow name="text">
        <RNText style={styles.icon}>›</RNText>
      </ClickableRow>
      <ClickableRow name="pressable">
        {(onInnerPress) => (
          <Pressable testID="pressable-target" onPress={onInnerPress} style={styles.square} />
        )}
      </ClickableRow>
      <ClickableRow name="text-on-press">
        {(onInnerPress) => (
          <RNText testID="text-on-press-target" onPress={onInnerPress} style={styles.icon}>
            Tap
          </RNText>
        )}
      </ClickableRow>
      <ClickableRow name="switch">
        {(onInnerPress) => <SwitchContent onChange={onInnerPress} />}
      </ClickableRow>
      <ClickableRow name="text-input">
        <TextInput testID="text-input-target" placeholder="Type" style={styles.input} />
      </ClickableRow>
    </ScrollView>
  );
}

function SwitchContent({ onChange }: { onChange: () => void }) {
  const [value, setValue] = React.useState(false);
  return (
    <Switch
      testID="switch-target"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange();
      }}
    />
  );
}

function ClickableRow({
  name,
  children,
}: {
  name: string;
  children: React.ReactElement | ((onInnerPress: () => void) => React.ReactElement);
}) {
  const [rowPresses, setRowPresses] = React.useState(0);
  const [innerPresses, setInnerPresses] = React.useState(0);
  const content =
    typeof children === 'function'
      ? children(() => setInnerPresses((count) => count + 1))
      : children;
  return (
    <View>
      <RNText testID={`${name}-counts`}>
        {name}: row {rowPresses}, inner {innerPresses}
      </RNText>
      <Host matchContents>
        <Row
          modifiers={[
            clickable(() => setRowPresses((count) => count + 1)),
            padding(12, 12, 12, 12),
          ]}>
          <Text>{`${name}  `}</Text>
          <RNHostView matchContents>
            <View testID={`${name}-hosted`}>{content}</View>
          </RNHostView>
        </Row>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  square: {
    width: 48,
    height: 48,
    backgroundColor: 'gray',
  },
  icon: {
    fontSize: 28,
    paddingHorizontal: 12,
  },
  input: {
    width: 120,
    height: 48,
    borderWidth: 1,
    borderColor: 'gray',
  },
});

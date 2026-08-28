// The adversarial screen the interaction commands are read against, live.
//
// @ref llp/0018-interaction-commands.rfc.md
// Every element here exists for one refusal band or one projection claim, and nothing here is
// decoration:
//
//  - `inc-btn` — the ordinary case: one element, one `onPress`, a visible effect.
//  - `disabled-btn` — `runtime:tap` must exit 20 with `disabledOn: "disabled"`, not tap it.
//  - `dup-btn` twice — two real elements under one testID, which must be `reason: "ambiguous"`
//    rather than a silent tap on the first, and must be distinguishable from one element spread
//    over several fibers.
//  - `plain-text` — a node with no handler anywhere above it: `reason: "no-handler"`.
//  - `counter-interp` vs `counter-str` — the pair that found F63. `count: {count}` has array
//    children and `{`count is ${count}`}` has a single string child; a text extractor that only
//    reads the second reports "nothing changed" for a tap that worked, which is the dangerous
//    direction. Both must appear in a `--verify` diff.
//  - `name-input` / `ro-input` — `runtime:type`'s two ends: a real `onChangeText`, and
//    `editable={false}`, which must be exit 20 with `disabledOn: "editable"`.
//
// The file is copied into a scratch project scaffolded by `@expo/agent-cli new`, so it imports only what
// that scaffold already depends on.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LabScreen() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text testID="counter-interp" style={styles.label}>
          count: {count}
        </Text>
        <Text testID="counter-str" style={styles.label}>{`count is ${count}`}</Text>

        <Pressable testID="inc-btn" style={styles.btn} onPress={() => setCount((c) => c + 1)}>
          <Text style={styles.btnText}>Increment</Text>
        </Pressable>

        <Pressable
          testID="disabled-btn"
          disabled
          style={styles.btn}
          onPress={() => setCount((c) => c + 100)}>
          <Text style={styles.btnText}>Disabled</Text>
        </Pressable>

        <Pressable testID="dup-btn" style={styles.btn} onPress={() => setCount((c) => c + 10)}>
          <Text style={styles.btnText}>Dup A</Text>
        </Pressable>
        <Pressable testID="dup-btn" style={styles.btn} onPress={() => setCount((c) => c + 20)}>
          <Text style={styles.btnText}>Dup B</Text>
        </Pressable>

        <Text testID="plain-text" style={styles.label}>
          no handler here
        </Text>

        <TextInput
          testID="name-input"
          style={styles.input}
          placeholder="type a name"
          value={name}
          onChangeText={setName}
        />
        <Text testID="echo-str" style={styles.label}>{`hello ${name}`}</Text>

        <TextInput
          testID="ro-input"
          style={styles.input}
          editable={false}
          placeholder="read only"
          value="cannot change"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, padding: 16, gap: 8 },
  label: { fontSize: 16 },
  btn: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
});

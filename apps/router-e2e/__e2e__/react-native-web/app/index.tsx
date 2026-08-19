import { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

const rows = Array.from({ length: 30 }, (_, index) => `Row ${index}`);

export default function ReactNativeWebCompatibility() {
  const [count, setCount] = useState(0);
  const [input, setInput] = useState('');
  const [listVisible, setListVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const [panDelta, setPanDelta] = useState('0,0');
  const [animationFinished, setAnimationFinished] = useState(false);
  const opacity = useRef(new Animated.Value(0.2)).current;
  const list = useRef<FlatList<string>>(null);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_event, gestureState) => {
        setPanDelta(`${Math.round(gestureState.dx)},${Math.round(gestureState.dy)}`);
      },
    })
  ).current;

  const animate = () => {
    setAnimationFinished(false);
    opacity.setValue(0.2);
    Animated.timing(opacity, {
      duration: 100,
      toValue: 1,
      useNativeDriver: false,
    }).start(({ finished }) => setAnimationFinished(finished));
  };

  return (
    <View style={styles.page}>
      <Text accessibilityRole="header" style={styles.heading} testID="heading">
        React Native Web compatibility
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => setCount((value) => value + 1)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text>Increment</Text>
      </Pressable>
      <Text testID="press-count">Press count: {count}</Text>

      <TextInput
        accessibilityLabel="Message"
        onChangeText={setInput}
        placeholder="Type a message"
        style={styles.input}
        value={input}
      />
      <Text testID="input-value">Input: {input}</Text>

      <Switch
        accessibilityLabel="Feature enabled"
        onValueChange={setSwitchEnabled}
        value={switchEnabled}
      />
      <Text testID="switch-value">Switch: {switchEnabled ? 'on' : 'off'}</Text>

      <Pressable accessibilityRole="button" onPress={animate} style={styles.button}>
        <Text>Animate</Text>
      </Pressable>
      <Animated.View style={[styles.animatedBox, { opacity }]} testID="animated-box" />
      <Text testID="animation-state">Animation: {animationFinished ? 'finished' : 'idle'}</Text>

      <View {...panResponder.panHandlers} style={styles.panTarget} testID="pan-target">
        <Text>Drag here</Text>
      </View>
      <Text testID="pan-delta">Pan: {panDelta}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => setModalVisible(true)}
        style={styles.button}>
        <Text>Open modal</Text>
      </Pressable>
      <Modal
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
        visible={modalVisible}>
        <View accessibilityViewIsModal style={styles.modal}>
          <Text accessibilityRole="header">RNW modal</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setModalVisible(false)}
            style={styles.button}>
            <Text>Close modal</Text>
          </Pressable>
        </View>
      </Modal>

      <Pressable
        accessibilityRole="button"
        onPress={() => setListVisible(true)}
        style={styles.button}>
        <Text>Mount list</Text>
      </Pressable>
      {listVisible && (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => list.current?.scrollToEnd({ animated: false })}
            style={styles.button}>
            <Text>Scroll list to end</Text>
          </Pressable>
          <FlatList
            data={rows}
            getItemLayout={(_data, index) => ({ index, length: 40, offset: 40 * index })}
            initialNumToRender={4}
            keyExtractor={(item) => item}
            ref={list}
            renderItem={({ item, index }) => (
              <View style={styles.row} testID={`row-${index}`}>
                <Text>{item}</Text>
              </View>
            )}
            style={styles.list}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
  },
  heading: {
    color: 'rgb(20, 40, 80)',
    fontSize: 24,
  },
  button: {
    backgroundColor: 'rgb(220, 230, 240)',
    borderRadius: 4,
    padding: 8,
  },
  pressed: {
    opacity: 0.5,
  },
  input: {
    borderColor: 'black',
    borderWidth: 1,
    padding: 4,
  },
  animatedBox: {
    backgroundColor: 'rgb(200, 20, 20)',
    height: 24,
    width: 24,
  },
  panTarget: {
    alignItems: 'center',
    backgroundColor: 'rgb(240, 240, 200)',
    height: 80,
    justifyContent: 'center',
    width: 160,
  },
  modal: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    borderWidth: 1,
    height: 120,
    width: 240,
  },
  row: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});

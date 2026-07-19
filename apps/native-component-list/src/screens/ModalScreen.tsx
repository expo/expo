import { useReducer } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import { Layout } from '../constants';

interface State {
  modalVisible: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

export default function ModalScreen() {
  const [state, setState] = useReducer((s: State, a: Partial<State>) => ({ ...s, ...a }), {
    modalVisible: false,
    animationType: 'none',
  });

  return (
    <View style={styles.container}>
      <Modal
        visible={false}
        onRequestClose={() => {
          setState({ modalVisible: false });
          alert('Modal has been closed.');
        }}>
        <View />
      </Modal>

      <Modal
        animationType={state.animationType}
        transparent={false}
        visible={state.modalVisible}
        onRequestClose={() => {
          setState({ modalVisible: false });
          alert('Modal has been closed.');
        }}>
        <View style={styles.modalContainer}>
          <View>
            <Text>Hello World!</Text>
            <Button
              style={styles.button}
              onPress={() => {
                setState({ modalVisible: false });
              }}
              title="Hide Modal"
            />
          </View>
        </View>
      </Modal>
      <Button
        style={styles.button}
        onPress={() => {
          setState({ modalVisible: true, animationType: 'slide' });
        }}
        title="Show modal (slide)"
      />

      {Layout.isSmallDevice && <View style={{ marginBottom: 10 }} />}

      <Button
        style={styles.button}
        onPress={() => {
          setState({ modalVisible: true, animationType: 'fade' });
        }}
        title="Show modal (fade)"
      />
    </View>
  );
}

ModalScreen.navigationOptions = {
  title: 'Modal',
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    padding: 10,
    flexDirection: Layout.isSmallDevice ? 'column' : 'row',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignSelf: 'flex-start',
    flexGrow: 0,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 3,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
  },
});

import * as React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import { Layout } from '../constants';

interface State {
  modalVisible: boolean;
  animationType?: 'none' | 'slide' | 'fade';
}

export default class ModalScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'Modal',
  };

  readonly state: State = {
    modalVisible: false,
    animationType: 'none',
  };

  render() {
    return (
      <View style={styles.container}>
        <Modal
          visible={false}
          onRequestClose={() => {
            this.setState({ modalVisible: false });
            alert('Modal has been closed.');
          }}>
          <View />
        </Modal>

        <Modal
          animationType={this.state.animationType}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.setState({ modalVisible: false });
            alert('Modal has been closed.');
          }}>
          <View style={styles.modalContainer}>
            <View>
              <Text>Hello World!</Text>
              <Button
                style={styles.button}
                onPress={() => {
                  this.setState({ modalVisible: false });
                }}
                title="Hide Modal"
              />
            </View>
          </View>
        </Modal>
        <Button
          style={styles.button}
          onPress={() => {
            this.setState({ modalVisible: true, animationType: 'slide' });
          }}
          title="Show modal (slide)"
        />

        {Layout.isSmallDevice && <View style={{ marginBottom: 10 }} />}

        <Button
          style={styles.button}
          onPress={() => {
            this.setState({ modalVisible: true, animationType: 'fade' });
          }}
          title="Show modal (fade)"
        />
      </View>
    );
  }
}

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

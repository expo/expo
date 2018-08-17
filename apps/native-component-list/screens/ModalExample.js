import React from 'react';
import { Modal, Text, View, StyleSheet } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { Colors, Layout } from '../constants';

export default class ModalExample extends React.Component {
  state = {
    modalVisible: false,
    animationType: 'none',
  };

  render() {
    return (
      <View style={styles.container}>
        <Modal
          visible={false}
          onRequestClose={() => {
            alert('Modal has been closed.');
          }}>
          <View />
        </Modal>

        <Modal
          animationType={this.state.animationType}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            alert('Modal has been closed.');
          }}>
          <View style={styles.modalContainer}>
            <View>
              <Text>Hello World!</Text>
              <Touchable
                style={styles.button}
                onPress={() => {
                  this.setState({ modalVisible: false });
                }}>
                <Text style={styles.buttonText}>Hide Modal</Text>
              </Touchable>
            </View>
          </View>
        </Modal>
        <Touchable
          style={styles.button}
          onPress={() => {
            this.setState({ modalVisible: true, animationType: 'slide' });
          }}>
          <Text style={styles.buttonText}>Show modal (slide)</Text>
        </Touchable>

        {Layout.isSmallDevice && <View style={{ marginBottom: 10 }} />}

        <Touchable
          style={styles.button}
          onPress={() => {
            this.setState({ modalVisible: true, animationType: 'fade' });
          }}>
          <Text style={styles.buttonText}>Show modal (fade)</Text>
        </Touchable>
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
    backgroundColor: Colors.tintColor,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
  },
});

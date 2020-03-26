import { CodedError } from '@unimodules/core';
import * as React from 'react';
import { StyleSheet, Button, View, SafeAreaView, Text, Modal } from 'react-native';

import FirebaseRecaptcha from './FirebaseRecaptcha';
import { IFirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';

interface Props extends Omit<React.ComponentProps<typeof FirebaseRecaptcha>, 'onVerify'> {
  title?: string;
  cancelLabel?: string;
}
interface State {
  token: string;
  visible: boolean;
  resolve?: (token: string) => void;
  reject?: (error: Error) => void;
}

export default class FirebaseRecaptchaVerifierModal extends React.Component<Props, State>
  implements IFirebaseAuthApplicationVerifier {
  static defaultProps = {
    title: 'reCAPTCHA',
    cancelLabel: 'Cancel',
  };

  state: State = {
    token: '',
    visible: false,
    resolve: undefined,
    reject: undefined,
  };

  get type(): string {
    return 'recaptcha';
  }

  async verify(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.setState({
        token: '',
        visible: true,
        resolve,
        reject,
      });
    });
  }

  private onVerify = (token: string) => {
    const { resolve } = this.state;
    if (resolve) {
      resolve(token);
    }
    this.setState({
      visible: false,
    });
  };

  cancel = () => {
    const { reject } = this.state;
    if (reject) {
      reject(new CodedError('ERR_FIREBASE_RECAPTCHA_CANCEL', 'Cancelled by user'));
    }
    this.setState({
      visible: false,
    });
  };

  render() {
    const { title, cancelLabel, ...otherProps } = this.props;
    const { visible } = this.state;
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={this.cancel}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.cancel}>
              <Button
                title={cancelLabel || FirebaseRecaptchaVerifierModal.defaultProps.cancelLabel}
                onPress={this.cancel}
              />
            </View>
          </View>
          <FirebaseRecaptcha style={styles.container} onVerify={this.onVerify} {...otherProps} />
        </SafeAreaView>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FBFBFB',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#CECECE',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: {
    position: 'absolute',
    left: 8,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
});

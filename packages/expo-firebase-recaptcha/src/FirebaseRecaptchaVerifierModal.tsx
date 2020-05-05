import { CodedError } from '@unimodules/core';
import * as React from 'react';
import {
  StyleSheet,
  Button,
  View,
  SafeAreaView,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';

import FirebaseRecaptcha from './FirebaseRecaptcha';
import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';

interface Props extends Omit<React.ComponentProps<typeof FirebaseRecaptcha>, 'onVerify'> {
  title?: string;
  cancelLabel?: string;
}
interface State {
  token: string;
  visible: boolean;
  loaded: boolean;
  resolve?: (token: string) => void;
  reject?: (error: Error) => void;
}

export default class FirebaseRecaptchaVerifierModal extends React.Component<Props, State>
  implements FirebaseAuthApplicationVerifier {
  static defaultProps = {
    title: 'reCAPTCHA',
    cancelLabel: 'Cancel',
  };

  state: State = {
    token: '',
    visible: false,
    loaded: false,
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
        loaded: false,
        resolve,
        reject,
      });
    });
  }

  private onLoad = () => {
    this.setState({
      loaded: true,
    });
  };

  private onError = () => {
    const { reject } = this.state;
    if (reject) {
      reject(new CodedError('ERR_FIREBASE_RECAPTCHA_ERROR', 'Failed to load reCAPTCHA'));
    }
    this.setState({
      visible: false,
    });
  };

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

  onDismiss = () => {
    // onDismiss should be called when the user dismisses the
    // modal using a swipe gesture. Due to a bug in RN this
    // unfortunately doesn't work :/
    //https://github.com/facebook/react-native/issues/26892
    if (this.state.visible) {
      this.cancel();
    }
  };

  render() {
    const { title, cancelLabel, ...otherProps } = this.props;
    const { visible, loaded } = this.state;
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={this.cancel}
        onDismiss={this.onDismiss}>
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
          <View style={styles.content}>
            <FirebaseRecaptcha
              style={styles.content}
              onLoad={this.onLoad}
              onError={this.onError}
              onVerify={this.onVerify}
              {...otherProps}
            />
            {!loaded ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" />
              </View>
            ) : (
              undefined
            )}
          </View>
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
  content: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});

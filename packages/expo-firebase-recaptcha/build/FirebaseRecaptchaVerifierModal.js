import { CodedError } from '@unimodules/core';
import * as React from 'react';
import { StyleSheet, Button, View, SafeAreaView, Text, Modal, ActivityIndicator, } from 'react-native';
import FirebaseRecaptcha from './FirebaseRecaptcha';
export default class FirebaseRecaptchaVerifierModal extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            token: '',
            visible: false,
            loaded: false,
            resolve: undefined,
            reject: undefined,
        };
        this.onLoad = () => {
            this.setState({
                loaded: true,
            });
        };
        this.onVerify = (token) => {
            const { resolve } = this.state;
            if (resolve) {
                resolve(token);
            }
            this.setState({
                visible: false,
            });
        };
        this.cancel = () => {
            const { reject } = this.state;
            if (reject) {
                reject(new CodedError('ERR_FIREBASE_RECAPTCHA_CANCEL', 'Cancelled by user'));
            }
            this.setState({
                visible: false,
            });
        };
    }
    get type() {
        return 'recaptcha';
    }
    async verify() {
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
    render() {
        const { title, cancelLabel, ...otherProps } = this.props;
        const { visible, loaded } = this.state;
        return (<Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={this.cancel}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.cancel}>
              <Button title={cancelLabel || FirebaseRecaptchaVerifierModal.defaultProps.cancelLabel} onPress={this.cancel}/>
            </View>
          </View>
          <View style={styles.content}>
            <FirebaseRecaptcha style={styles.content} onLoad={this.onLoad} onVerify={this.onVerify} {...otherProps}/>
            {!loaded ? (<View style={styles.loader}>
                <ActivityIndicator size="large"/>
              </View>) : (undefined)}
          </View>
        </SafeAreaView>
      </Modal>);
    }
}
FirebaseRecaptchaVerifierModal.defaultProps = {
    title: 'reCAPTCHA',
    cancelLabel: 'Cancel',
};
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
//# sourceMappingURL=FirebaseRecaptchaVerifierModal.js.map
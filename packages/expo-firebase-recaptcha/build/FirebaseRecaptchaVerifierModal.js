import { CodedError } from 'expo-modules-core';
import * as React from 'react';
import { StyleSheet, Button, View, SafeAreaView, Text, Modal, ActivityIndicator, } from 'react-native';
import FirebaseRecaptcha from './FirebaseRecaptcha';
export default class FirebaseRecaptchaVerifierModal extends React.Component {
    static defaultProps = {
        title: 'reCAPTCHA',
        cancelLabel: 'Cancel',
    };
    state = {
        visible: false,
        visibleLoaded: false,
        invisibleLoaded: false,
        invisibleVerify: false,
        invisibleKey: 1,
        resolve: undefined,
        reject: undefined,
    };
    static getDerivedStateFromProps(props, state) {
        if (!props.attemptInvisibleVerification && state.invisibleLoaded) {
            return {
                invisibleLoaded: false,
                invisibleVerify: false,
            };
        }
        return null;
    }
    get type() {
        return 'recaptcha';
    }
    async verify() {
        return new Promise((resolve, reject) => {
            if (this.props.attemptInvisibleVerification) {
                this.setState({
                    invisibleVerify: true,
                    resolve,
                    reject,
                });
            }
            else {
                this.setState({
                    visible: true,
                    visibleLoaded: false,
                    resolve,
                    reject,
                });
            }
        });
    }
    // see: https://github.com/expo/expo/issues/14780
    _reset(...args) { }
    onVisibleLoad = () => {
        this.setState({
            visibleLoaded: true,
        });
    };
    onInvisibleLoad = () => {
        this.setState({
            invisibleLoaded: true,
        });
    };
    onFullChallenge = async () => {
        this.setState({
            invisibleVerify: false,
            visible: true,
        });
    };
    onError = () => {
        const { reject } = this.state;
        if (reject) {
            reject(new CodedError('ERR_FIREBASE_RECAPTCHA_ERROR', 'Failed to load reCAPTCHA'));
        }
        this.setState({
            visible: false,
            invisibleVerify: false,
        });
    };
    onVerify = (token) => {
        const { resolve } = this.state;
        if (resolve) {
            resolve(token);
        }
        this.setState((state) => ({
            visible: false,
            invisibleVerify: false,
            invisibleLoaded: false,
            invisibleKey: state.invisibleKey + 1,
        }));
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
        const { title, cancelLabel, attemptInvisibleVerification, ...otherProps } = this.props;
        const { visible, visibleLoaded, invisibleLoaded, invisibleVerify, invisibleKey } = this.state;
        return (React.createElement(View, { style: styles.container },
            attemptInvisibleVerification && (React.createElement(FirebaseRecaptcha, { ...otherProps, key: `invisible${invisibleKey}`, style: styles.invisible, onLoad: this.onInvisibleLoad, onError: this.onError, onVerify: this.onVerify, onFullChallenge: this.onFullChallenge, invisible: true, verify: invisibleLoaded && invisibleVerify })),
            React.createElement(Modal, { visible: visible, animationType: "slide", presentationStyle: "pageSheet", onRequestClose: this.cancel, onDismiss: this.onDismiss },
                React.createElement(SafeAreaView, { style: styles.modalContainer },
                    React.createElement(View, { style: styles.header },
                        React.createElement(Text, { style: styles.title }, title),
                        React.createElement(View, { style: styles.cancel },
                            React.createElement(Button, { title: cancelLabel || FirebaseRecaptchaVerifierModal.defaultProps.cancelLabel, onPress: this.cancel }))),
                    React.createElement(View, { style: styles.content },
                        React.createElement(FirebaseRecaptcha, { ...otherProps, style: styles.content, onLoad: this.onVisibleLoad, onError: this.onError, onVerify: this.onVerify }),
                        !visibleLoaded ? (React.createElement(View, { style: styles.loader },
                            React.createElement(ActivityIndicator, { size: "large" }))) : undefined)))));
    }
}
const styles = StyleSheet.create({
    container: {
        width: 0,
        height: 0,
    },
    invisible: {
        width: 300,
        height: 300,
    },
    modalContainer: {
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
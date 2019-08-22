import { NativeModules, requireNativeComponent } from 'react-native';

const { RNCAppleAuthentication } = NativeModules;

const SignInWithAppleButton = requireNativeComponent('RNCSignInWithAppleButton');

export {
  RNCAppleAuthentication as SignInWithApple,
  SignInWithAppleButton,
};

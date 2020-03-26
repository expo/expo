import { IFirebaseOptions } from 'expo-firebase-core';
import * as React from 'react';
import { WebView } from 'react-native-webview';
interface Props extends React.ComponentProps<typeof WebView> {
    firebaseConfig?: IFirebaseOptions;
    firebaseVersion?: string;
    onVerify: (token: string) => any;
}
declare function FirebaseRecaptcha(props: Props): JSX.Element | null;
declare namespace FirebaseRecaptcha {
    var defaultProps: {
        firebaseConfig: void | IFirebaseOptions;
    };
}
export default FirebaseRecaptcha;

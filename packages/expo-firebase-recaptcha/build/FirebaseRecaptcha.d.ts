import { IFirebaseOptions } from 'expo-firebase-core';
import * as React from 'react';
import { WebView } from './WebView';
interface Props extends React.ComponentProps<typeof WebView> {
    firebaseConfig?: IFirebaseOptions;
    firebaseVersion?: string;
    appVerificationDisabledForTesting?: boolean;
    onLoad?: () => any;
    onError?: () => any;
    onVerify: (token: string) => any;
    onFullChallenge?: () => any;
    invisible?: boolean;
    verify?: boolean;
}
declare function FirebaseRecaptcha(props: Props): JSX.Element | null;
declare namespace FirebaseRecaptcha {
    var defaultProps: {
        firebaseConfig: void | IFirebaseOptions;
    };
}
export default FirebaseRecaptcha;

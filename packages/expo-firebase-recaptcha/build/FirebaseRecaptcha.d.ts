import { IFirebaseOptions } from 'expo-firebase-core';
import * as React from 'react';
import { WebView } from './WebView';
interface Props extends React.ComponentProps<typeof WebView> {
    firebaseConfig?: IFirebaseOptions;
    firebaseVersion?: string;
    appVerificationDisabledForTesting?: boolean;
    languageCode?: string;
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
        firebaseConfig: void | Partial<{
            appId: string;
            apiKey: string;
            databaseURL: string;
            trackingId: string;
            messagingSenderId: string;
            storageBucket: string;
            projectId: string;
            authDomain: string;
            measurementId: string;
        }>;
    };
}
export default FirebaseRecaptcha;

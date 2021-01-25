import * as React from 'react';
import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';
interface Props {
    attemptInvisibleVerification?: boolean;
    appVerificationDisabledForTesting?: boolean;
    innerRef: React.MutableRefObject<FirebaseAuthApplicationVerifier | null>;
}
declare const _default: React.ForwardRefExoticComponent<Pick<Props, "appVerificationDisabledForTesting" | "attemptInvisibleVerification"> & React.RefAttributes<unknown>>;
export default _default;

import 'firebase/compat/auth';
import * as React from 'react';
import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';
interface Props {
    attemptInvisibleVerification?: boolean;
    appVerificationDisabledForTesting?: boolean;
    languageCode?: string;
    innerRef: React.MutableRefObject<FirebaseAuthApplicationVerifier | null>;
}
declare const _default: React.ForwardRefExoticComponent<Omit<Props, "innerRef"> & React.RefAttributes<unknown>>;
export default _default;
//# sourceMappingURL=FirebaseRecaptchaVerifierModal.web.d.ts.map
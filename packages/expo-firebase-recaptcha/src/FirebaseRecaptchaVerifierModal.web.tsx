import { getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from "firebase/auth";
import * as React from 'react';

import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';

interface Props {
  attemptInvisibleVerification?: boolean;
  appVerificationDisabledForTesting?: boolean;
  languageCode?: string;
  innerRef: React.MutableRefObject<FirebaseAuthApplicationVerifier | null>;
}

class FirebaseRecaptchaVerifierModal extends React.Component<Props> {
  private verifier: FirebaseAuthApplicationVerifier | null = null;
  private auth = getAuth(getApp())

  private setRef = (ref: any) => {
    if (ref) {
      if (this.props.appVerificationDisabledForTesting !== undefined) {
       this.auth.settings.appVerificationDisabledForTesting =
          !!this.props.appVerificationDisabledForTesting;
      }
      if (this.props.languageCode) {
        this.auth.languageCode = this.props.languageCode;
      }
      this.verifier = new RecaptchaVerifier(ref, {
        size: this.props.attemptInvisibleVerification ? 'invisible' : 'normal',
      }, this.auth);
    } else {
      this.verifier = null;
    }
    if (this.props.innerRef) {
      this.props.innerRef.current = this.verifier;
    }
  };

  shouldComponentUpdate(nextProps: Props) {
    return (
      this.props.appVerificationDisabledForTesting !==
        nextProps.appVerificationDisabledForTesting ||
      this.props.attemptInvisibleVerification !== nextProps.attemptInvisibleVerification ||
      this.props.languageCode !== nextProps.languageCode
    );
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.innerRef !== prevProps.innerRef) {
      if (this.props.innerRef) {
        this.props.innerRef.current = this.verifier;
      }
    }
  }

  render() {
    const { attemptInvisibleVerification, appVerificationDisabledForTesting, languageCode } =
      this.props;
    return (
      <div
        style={styles.container}
        key={`${attemptInvisibleVerification ? 'invisible' : 'visible'}-${
          appVerificationDisabledForTesting ? 'testing' : 'regular'
        }-${languageCode ?? ''}`}
        id="recaptcha-container"
        ref={this.setRef}
        dangerouslySetInnerHTML={{ __html: '' }}
      />
    );
  }
}

export default React.forwardRef((props: Omit<Props, 'innerRef'>, ref: any) => (
  <FirebaseRecaptchaVerifierModal {...props} innerRef={ref} />
));

const styles = {
  // Ensure the reCAPTCHA badge is in front or other elements
  container: { zIndex: 1000 },
};

import firebase from 'firebase';
import * as React from 'react';

import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';

interface Props {
  attemptInvisibleVerification?: boolean;
  appVerificationDisabledForTesting?: boolean;
  innerRef: React.MutableRefObject<FirebaseAuthApplicationVerifier | null>;
}

class FirebaseRecaptchaVerifierModal extends React.Component<Props> {
  private verifier: FirebaseAuthApplicationVerifier | null = null;

  private setRef = (ref: any) => {
    if (ref) {
      if (this.props.appVerificationDisabledForTesting !== undefined) {
        firebase.auth().settings.appVerificationDisabledForTesting = !!this.props
          .appVerificationDisabledForTesting;
      }
      this.verifier = new firebase.auth.RecaptchaVerifier(ref, {
        size: this.props.attemptInvisibleVerification ? 'invisible' : 'normal',
      });
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
      this.props.attemptInvisibleVerification !== nextProps.attemptInvisibleVerification
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
    const { attemptInvisibleVerification, appVerificationDisabledForTesting } = this.props;
    return (
      <div
        style={styles.container}
        key={`${attemptInvisibleVerification ? 'invisible' : 'visible'}-${
          appVerificationDisabledForTesting ? 'testing' : 'regular'
        }`}
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

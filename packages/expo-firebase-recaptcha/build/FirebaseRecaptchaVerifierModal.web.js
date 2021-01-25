import firebase from 'firebase';
import * as React from 'react';
class FirebaseRecaptchaVerifierModal extends React.Component {
    constructor() {
        super(...arguments);
        this.verifier = null;
        this.setRef = (ref) => {
            if (ref) {
                if (this.props.appVerificationDisabledForTesting !== undefined) {
                    firebase.auth().settings.appVerificationDisabledForTesting = !!this.props
                        .appVerificationDisabledForTesting;
                }
                this.verifier = new firebase.auth.RecaptchaVerifier(ref, {
                    size: this.props.attemptInvisibleVerification ? 'invisible' : 'normal',
                });
            }
            else {
                this.verifier = null;
            }
            if (this.props.innerRef) {
                this.props.innerRef.current = this.verifier;
            }
        };
    }
    shouldComponentUpdate(nextProps) {
        return (this.props.appVerificationDisabledForTesting !==
            nextProps.appVerificationDisabledForTesting ||
            this.props.attemptInvisibleVerification !== nextProps.attemptInvisibleVerification);
    }
    componentDidUpdate(prevProps) {
        if (this.props.innerRef !== prevProps.innerRef) {
            if (this.props.innerRef) {
                this.props.innerRef.current = this.verifier;
            }
        }
    }
    render() {
        const { attemptInvisibleVerification, appVerificationDisabledForTesting } = this.props;
        return (React.createElement("div", { style: styles.container, key: `${attemptInvisibleVerification ? 'invisible' : 'visible'}-${appVerificationDisabledForTesting ? 'testing' : 'regular'}`, id: "recaptcha-container", ref: this.setRef, dangerouslySetInnerHTML: { __html: '' } }));
    }
}
export default React.forwardRef((props, ref) => (React.createElement(FirebaseRecaptchaVerifierModal, Object.assign({}, props, { innerRef: ref }))));
const styles = {
    // Ensure the reCAPTCHA badge is in front or other elements
    container: { zIndex: 1000 },
};
//# sourceMappingURL=FirebaseRecaptchaVerifierModal.web.js.map
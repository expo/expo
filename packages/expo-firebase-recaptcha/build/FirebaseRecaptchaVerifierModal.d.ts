import * as React from 'react';
import FirebaseRecaptcha from './FirebaseRecaptcha';
import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';
interface Props extends Omit<React.ComponentProps<typeof FirebaseRecaptcha>, 'onVerify' | 'invisible' | 'verify' | 'onVerify' | 'onLoad' | 'onError' | 'onFullChallenge'> {
    title?: string;
    cancelLabel?: string;
    attemptInvisibleVerification?: boolean;
}
interface State {
    visible: boolean;
    visibleLoaded: boolean;
    invisibleLoaded: boolean;
    invisibleVerify: boolean;
    invisibleKey: number;
    resolve?: (token: string) => void;
    reject?: (error: Error) => void;
}
export default class FirebaseRecaptchaVerifierModal extends React.Component<Props, State> implements FirebaseAuthApplicationVerifier {
    static defaultProps: {
        title: string;
        cancelLabel: string;
    };
    state: State;
    static getDerivedStateFromProps(props: Props, state: State): {
        invisibleLoaded: boolean;
        invisibleVerify: boolean;
    } | null;
    get type(): string;
    verify(): Promise<string>;
    _reset(...args: any): void;
    private onVisibleLoad;
    private onInvisibleLoad;
    private onFullChallenge;
    private onError;
    private onVerify;
    cancel: () => void;
    onDismiss: () => void;
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=FirebaseRecaptchaVerifierModal.d.ts.map
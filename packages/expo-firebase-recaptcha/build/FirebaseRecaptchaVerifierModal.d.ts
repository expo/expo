import * as React from 'react';
import FirebaseRecaptcha from './FirebaseRecaptcha';
import { FirebaseAuthApplicationVerifier } from './FirebaseRecaptcha.types';
interface Props extends Omit<React.ComponentProps<typeof FirebaseRecaptcha>, 'onVerify'> {
    title?: string;
    cancelLabel?: string;
}
interface State {
    token: string;
    visible: boolean;
    resolve?: (token: string) => void;
    reject?: (error: Error) => void;
}
export default class FirebaseRecaptchaVerifierModal extends React.Component<Props, State> implements FirebaseAuthApplicationVerifier {
    static defaultProps: {
        title: string;
        cancelLabel: string;
    };
    state: State;
    get type(): string;
    verify(): Promise<string>;
    private onVerify;
    cancel: () => void;
    render(): JSX.Element;
}
export {};

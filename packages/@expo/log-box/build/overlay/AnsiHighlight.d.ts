import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
export declare class Ansi extends React.Component<{
    text: string | undefined;
    style: StyleProp<TextStyle>;
}, {
    hasError: boolean;
}> {
    constructor(props: {
        text: string;
        style: StyleProp<TextStyle>;
    });
    static getDerivedStateFromError(_error: Error): {
        hasError: boolean;
    };
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): React.JSX.Element;
}
export declare function AnsiUnsafe({ text, style }: {
    text: string;
    style: StyleProp<TextStyle>;
}): React.JSX.Element;

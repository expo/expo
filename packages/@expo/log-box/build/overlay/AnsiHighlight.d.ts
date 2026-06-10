import React from 'react';
export declare class Ansi extends React.Component<{
    text: string | undefined;
    style: React.CSSProperties;
}, {
    hasError: boolean;
}> {
    constructor(props: {
        text: string;
        style: React.CSSProperties;
    });
    static getDerivedStateFromError(_error: Error): {
        hasError: boolean;
    };
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export declare function AnsiUnsafe({ text, style }: {
    text: string;
    style: React.CSSProperties;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnsiHighlight.d.ts.map
import React from 'react';
export default class KeepAwake extends React.PureComponent {
    static activate: (tag?: string | undefined) => void;
    static deactivate: (tag?: string | undefined) => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): null;
}
export declare function useKeepAwake(tag?: string): void;
export declare function activateKeepAwake(tag?: string): void;
export declare function deactivateKeepAwake(tag?: string): void;
export declare function activate(tag?: string): void;
export declare function deactivate(tag?: string): void;

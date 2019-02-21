import React from 'react';
export default class KeepAwake extends React.PureComponent {
    static activate: typeof activate;
    static deactivate: typeof deactivate;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): null;
}
export declare function activate(): void;
export declare function deactivate(): void;

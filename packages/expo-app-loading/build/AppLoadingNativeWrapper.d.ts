import React from 'react';
declare type Props = {
    autoHideSplash?: boolean;
};
export default class AppLoading extends React.Component<Props> {
    static defaultProps: {
        autoHideSplash: boolean;
    };
    constructor(props: Props);
    componentWillUnmount(): void;
    render(): null;
}
export {};

import React from 'react';
declare type Props = {
    autoHideSplash?: boolean;
};
export default class AppLoading extends React.Component<Props> {
    static defaultProps: {
        autoHideAsync: boolean;
    };
    constructor(props: Props);
    componentWillUnmount(): void;
    render(): null;
}
export {};

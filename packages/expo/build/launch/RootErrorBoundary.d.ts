import React from 'react';
declare type Props = {
    children: React.ReactNode;
};
declare type State = {
    error: Error | null;
};
export default class RootErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    _appLoadingIsMounted: boolean;
    _subscribeToGlobalErrors: () => void;
    _unsubscribeFromGlobalErrors: () => void;
    componentDidCatch(error: Error): void;
    render(): {} | null | undefined;
}
export {};

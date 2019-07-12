import React from 'react';
declare type Props = {
    children: React.ReactNode;
};
declare type State = {
    error: Error | null;
};
export default class RootErrorBoundary extends React.Component<Props, State> {
    state: {
        error: null;
    };
    static getDerivedStateFromError(error: any): {
        error: any;
    };
    render(): {} | null | undefined;
}
export {};

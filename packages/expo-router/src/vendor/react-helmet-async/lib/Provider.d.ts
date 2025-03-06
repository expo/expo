import type { PropsWithChildren } from 'react';
import React, { Component } from 'react';
import HelmetData from './HelmetData';
import type { HelmetServerState } from './types';
export declare const Context: React.Context<{}>;
interface ProviderProps {
    context?: {
        helmet?: HelmetServerState;
    };
}
export default class HelmetProvider extends Component<PropsWithChildren<ProviderProps>> {
    static canUseDOM: boolean;
    helmetData: HelmetData;
    constructor(props: PropsWithChildren<ProviderProps>);
    render(): React.JSX.Element;
}
export {};

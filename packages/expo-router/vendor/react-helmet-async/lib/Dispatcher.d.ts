import { Component } from 'react';
import type { HelmetServerState } from './types';
export interface DispatcherContextProp {
    setHelmet: (newState: HelmetServerState) => void;
    helmetInstances: {
        get: () => HelmetDispatcher[];
        add: (helmet: HelmetDispatcher) => void;
        remove: (helmet: HelmetDispatcher) => void;
    };
}
interface DispatcherProps {
    context: DispatcherContextProp;
}
export default class HelmetDispatcher extends Component<DispatcherProps> {
    rendered: boolean;
    shouldComponentUpdate(nextProps: DispatcherProps): boolean;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    emitChange(): void;
    init(): void;
    render(): any;
}
export {};

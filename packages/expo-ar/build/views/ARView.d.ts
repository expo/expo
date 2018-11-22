import * as React from 'react';
import { TrackingConfiguration } from '../commons';
interface Props {
    style: any;
    glviewStyle: any;
    shouldIgnoreSafeGaurds?: boolean;
    isAREnabled: boolean;
    isArRunningStateEnabled?: boolean;
    isArCameraStateEnabled?: boolean;
    isShadowsEnabled?: boolean;
    runningProps: any;
    cameraProps: any;
    ARTrackingConfiguration: TrackingConfiguration;
    onShouldReloadContext?: () => void;
    onError: (message: string | Error) => void;
    onResize: ({ x, y, width, height, pixelRatio }: {
        x: number;
        y: number;
        width: number;
        height: number;
        pixelRatio: number;
    }) => void;
    onRender: (delta: number) => void;
    onContextCreate: (gl: any, { width, height, pixelRatio, canvas }: {
        width: number;
        height: number;
        pixelRatio: number;
        canvas: number | null;
    }) => void;
}
export default class ARView extends React.Component<Props> {
    nativeRef?: number;
    gl?: any;
    rafID?: number;
    static defaultProps: {
        arRunningProps: {};
        arCameraProps: {};
        isShadowsEnabled: boolean;
        ARTrackingConfiguration: TrackingConfiguration;
        isAREnabled: boolean;
    };
    state: {
        appState: import("react-native").AppStateStatus;
        id: any;
        isReady: boolean;
        isARAvailable: undefined;
    };
    componentDidMount(): void;
    componentWillUnmount(): void;
    checkARAvailability: () => Promise<void>;
    destroy: () => void;
    handleAppStateChangeAsync: (nextAppState: any) => void;
    render(): JSX.Element | null;
    onLayout: ({ nativeEvent: { layout: { x, y, width, height } } }: {
        nativeEvent: {
            layout: {
                x: any;
                y: any;
                width: any;
                height: any;
            };
        };
    }) => void;
    onContextCreate: (gl: any) => Promise<void>;
}
export {};

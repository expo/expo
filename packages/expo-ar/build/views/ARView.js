import * as React from 'react';
import { AppState, PixelRatio, Platform, } from 'react-native';
import uuidv4 from 'uuid/v4';
import { GLView } from 'expo-gl';
import { TrackingConfiguration } from '../commons';
import { startAsync, stopAsync } from '../lifecycle';
import { isAvailable } from '../availibility';
export default class ARView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            appState: AppState.currentState,
            id: uuidv4(),
            isReady: false,
            isARAvailable: undefined,
        };
        this.checkARAvailability = async () => {
            try {
                const available = await isAvailable();
                this.setState({ isReady: true, isARAvailable: available });
            }
            catch ({ message }) {
                if (this.props.onError) {
                    this.props.onError(message);
                }
                else {
                    console.error(message);
                }
                this.setState({ isReady: true, isARAvailable: false });
            }
        };
        this.destroy = () => {
            stopAsync();
            this.gl = undefined;
            this.nativeRef = undefined;
            if (this.rafID) {
                cancelAnimationFrame(this.rafID);
            }
        };
        this.handleAppStateChangeAsync = nextAppState => {
            if (this.state.appState.match(/inactive|background/) &&
                nextAppState === 'active') {
                // console.log('App has come to the foreground!')
                const { onShouldReloadContext } = this.props;
                if (onShouldReloadContext && onShouldReloadContext()) {
                    this.destroy();
                    this.setState({ appState: nextAppState, id: uuidv4() });
                    return;
                }
            }
            this.setState({ appState: nextAppState });
        };
        this.onLayout = ({ nativeEvent: { layout: { x, y, width, height } } }) => {
            if (!this.gl) {
                return;
            }
            const pixelRatio = PixelRatio.get();
            if (this.props.onResize) {
                this.props.onResize({ x, y, width, height, pixelRatio });
            }
        };
        this.onContextCreate = async (gl) => {
            this.gl = gl;
            const { isShadowsEnabled, isAREnabled, ARTrackingConfiguration, onContextCreate, onRender, } = this.props;
            const pixelRatio = PixelRatio.get();
            if (Platform.OS === 'ios' && isShadowsEnabled) {
                this.gl.createRenderbuffer = () => ({});
            }
            if (isAREnabled) {
                // Start AR session
                await startAsync(this.nativeRef, ARTrackingConfiguration);
            }
            await onContextCreate(gl, {
                width: gl.drawingBufferWidth,
                height: gl.drawingBufferHeight,
                pixelRatio,
                canvas: null,
            });
            let lastFrameTime;
            const render = async () => {
                if (!this.gl) {
                    return;
                }
                const now = 0.001 * global.nativePerformanceNow();
                const delta = lastFrameTime !== undefined ? now - lastFrameTime : 0.16666;
                lastFrameTime = now;
                this.rafID = requestAnimationFrame(render);
                await onRender(delta);
                // NOTE: At the end of each frame, notify `Expo.GLView` with the below
                gl.endFrameEXP();
            };
            render();
        };
    }
    componentDidMount() {
        AppState.addEventListener('change', this.handleAppStateChangeAsync);
        this.checkARAvailability();
    }
    componentWillUnmount() {
        this.destroy();
        AppState.removeEventListener('change', this.handleAppStateChangeAsync);
    }
    render() {
        const { shouldIgnoreSafeGaurds, isAREnabled, } = this.props;
        const { isReady, isARAvailable, } = this.state;
        if (!isReady) {
            return null;
        }
        if (!shouldIgnoreSafeGaurds && isAREnabled && !isARAvailable) {
            return null;
        }
        return (<GLView key={this.state.id} style={{ flex: 1 }} nativeRef_EXPERIMENTAL={ref => (this.nativeRef = ref)} onLayout={this.onLayout} onContextCreate={this.onContextCreate}/>);
    }
}
ARView.defaultProps = {
    arRunningProps: {},
    arCameraProps: {},
    isShadowsEnabled: false,
    ARTrackingConfiguration: TrackingConfiguration.World,
    isAREnabled: true,
};
//# sourceMappingURL=ARView.js.map
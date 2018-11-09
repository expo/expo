declare global {
  namespace NodeJS {
    interface Global {
      nativePerformanceNow(): number;
    }
  }
}

import * as React from 'react';
import {
  AppState,
  findNodeHandle,
  PixelRatio,
  Platform,
} from 'react-native';
import uuidv4 from 'uuid/v4';
import { GLView } from 'expo-gl';

import {
  TrackingConfiguration,
} from '../enums';
import {
  startAsync,
  isAvailable,
  stopAsync,
} from '../functions';

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

  static defaultProps = {
    arRunningProps: {},
    arCameraProps: {},
    isShadowsEnabled: false,
    ARTrackingConfiguration: TrackingConfiguration.World,
    isAREnabled: true,
  };

  state = {
    appState: AppState.currentState,
    id: uuidv4(),
    isReady: false,
    isARAvailable: undefined,
  };

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChangeAsync);
    this.checkARAvailability();
  }

  componentWillUnmount() {
    this.destroy();
    AppState.removeEventListener('change', this.handleAppStateChangeAsync);
  }

  checkARAvailability = async () => {
    try {
      const available = await isAvailable();
      this.setState({ isReady: true, isARAvailable: available });
    } catch ({ message }) {
      if (this.props.onError) {
        this.props.onError(message);
      } else {
        console.error(message);
      }
      this.setState({ isReady: true, isARAvailable: false });
    }
  }

  destroy = () => {
    stopAsync();
    this.gl = undefined;
    this.nativeRef = undefined;
    if (this.rafID) {
      cancelAnimationFrame(this.rafID);
    }
  };

  handleAppStateChangeAsync = nextAppState => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
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

  render() {
    const {
      shouldIgnoreSafeGaurds,
      isAREnabled,
    } = this.props;

    const {
      isReady,
      isARAvailable,
    } = this.state;

    if (!isReady) {
      return null;
    }

    if (!shouldIgnoreSafeGaurds && isAREnabled && !isARAvailable) {
      return null;
    }

    return (
      <GLView
        key={this.state.id}
        style={{ flex: 1 }}
        nativeRef_EXPERIMENTAL={ref => (this.nativeRef = ref)}
        onLayout={this.onLayout}
        onContextCreate={this.onContextCreate}
      />
    );
  }

  onLayout = ({ nativeEvent: { layout: { x, y, width, height } } }) => {
    if (!this.gl) {
      return;
    }
    const pixelRatio = PixelRatio.get();
    if (this.props.onResize) {
      this.props.onResize({ x, y, width, height, pixelRatio });
    }
  };

  onContextCreate = async gl => {
    this.gl = gl;
    const {
      isShadowsEnabled,
      isAREnabled,
      ARTrackingConfiguration,
      onContextCreate,
      onRender,
    } = this.props;
    const pixelRatio = PixelRatio.get();

    if (Platform.OS === 'ios' && isShadowsEnabled) {
      this.gl.createRenderbuffer = () => ({});
    }

    if (isAREnabled) {
      // Start AR session
      await startAsync(this.nativeRef!, ARTrackingConfiguration);
    }

    await onContextCreate(
      gl,
      {
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

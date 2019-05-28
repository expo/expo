import * as React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  TapGestureHandler,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State as GHState,
  TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Carousel, {
  CarouselStatic,
} from 'react-native-snap-carousel';

import * as ExpoCamera from 'expo-camera2';

import {
  FlashModeIcon,
  AutofocusIcon,
  HDRIcon,
  PreviewSizeIcon,
} from './icons';
import ExpandableSelect from './ExpandableSelect';
import CameraActionButton from './CameraActionButton';
import ChangeFacingButton from './ChangeFacingButton';
import FocusMarker from './FocusMarker';

type PreviewSize =
  | { width: number, height: number }
  | StyleSheet.AbsoluteFillStyle;

interface NamedPreviewSize {
  name: string;
  previewSize: PreviewSize;
}

type TopAction = 'flashMode' | 'autofocus' | 'hdr' | 'previewSize';

interface Point {
  x: number;
  y: number;
}

interface State {
  operationMode: OperationMode;

  flashMode: ExpoCamera.FlashMode;
  autofocus: ExpoCamera.Autofocus;
  hdr: ExpoCamera.HDR;
  focusPoint?: Point;
  showBrightnessRuler?: boolean;
  /**
   * from `-1.0` to `1.0`
   */
  brightnessIndicator: number;

  topActionExpanded?: TopAction;
  previewSize: NamedPreviewSize;
  availablePreviewSizes: NamedPreviewSize[];
}

enum OperationMode {
  Photo = 'photo',
  Video = 'video',
}

interface OperationModeOptions {

}

const operationModesOptions: { [key in OperationMode]: OperationModeOptions } = {
  [OperationMode.Photo]: {},
  [OperationMode.Video]: {},
}

const initialNamedPreviewSizes: NamedPreviewSize[] = [
  { name: 'AbsoluteFill', previewSize: StyleSheet.absoluteFillObject },
]

export default class Camera extends React.PureComponent<{}, State> {
  readonly state: State = {
    operationMode: OperationMode.Photo,
    brightnessIndicator: 0.0,
    previewSize: initialNamedPreviewSizes[0],
    availablePreviewSizes: initialNamedPreviewSizes,

    flashMode: ExpoCamera.FlashMode.Auto,
    autofocus: ExpoCamera.Autofocus.Off,
    hdr: ExpoCamera.HDR.Off,
  }

  modeCarousel = React.createRef<CarouselStatic<OperationMode>>()

  handleOperationModeChange = (operationMode: OperationMode) => this.setState({ operationMode })
  handleFlashModeChange = (flashMode: ExpoCamera.FlashMode) => this.setState({ flashMode });
  handleAutofocusChange = (autofocus: ExpoCamera.Autofocus) => this.setState({ autofocus });
  handleHDRChange = (hdr: ExpoCamera.HDR) => this.setState({ hdr });
  handlePreviewSizeChange = (previewSize: NamedPreviewSize) => this.setState({ previewSize });

  handleTopActionExpanded = (topActionExpanded: TopAction) => this.setState({ topActionExpanded: this.state.topActionExpanded === topActionExpanded ? undefined : topActionExpanded });

  renderCarouselMode = ({ item, index }: { item: OperationMode, index: number }) => {
    return (
      <TouchableOpacity style={styles.modeCarouselItem} onPress={() => this.modeCarousel.current!.snapToItem(index)}>
        <Text style={[styles.modeCarouselItemText, this.state.operationMode === item && styles.modeCarouselActiveItemText]}>{item}</Text>
      </TouchableOpacity>
    );
  }

  handleSnapToMode = (modeIdx: number) => {
    this.setState({ operationMode: Object.values(OperationMode)[modeIdx] });
  }

  handleTapGestureStateChange = ({ nativeEvent: { state, x, y } }: TapGestureHandlerStateChangeEvent) => {
    if (state === GHState.ACTIVE) {
      this.waitAndClearFocusPoint();
      this.setState({ focusPoint: { x, y } });
    }
  }

  clearFocusPointTimeoutHandler?: number;
  waitAndClearFocusPoint = () => {
    if (this.clearFocusPointTimeoutHandler) {
      clearTimeout(this.clearFocusPointTimeoutHandler)
    }
    this.clearFocusPointTimeoutHandler = setTimeout(
      () => this.setState({ focusPoint: undefined, showBrightnessRuler: false, brightnessIndicator: 0.0 }),
      8000, // hold for 8 seconds
    );
  }

  handlePanGesture = ({ nativeEvent: { translationY }}: PanGestureHandlerGestureEvent) => {
    if (this.state.focusPoint) {
      if (Math.abs(translationY) > 10) {
        const bi = this.state.brightnessIndicator - translationY / 1000
        this.waitAndClearFocusPoint();
        this.setState({
          brightnessIndicator: bi > 1.0 ? 1.0 : bi < -1.0 ? -1.0 : bi,
          showBrightnessRuler: true,
        });
      }
    }
  }

  prepareAvailablePreviewSizes = (): NamedPreviewSize[] => {
    const dimensions = Dimensions.get('window')
    const dimensionsMultipliers = [0.8, 0.5, 0.2]
    const scaledPreviewSizes = dimensionsMultipliers
      .reduce<[number, number][]>((acc, current) => [...acc, ...dimensionsMultipliers.map<[number, number]>(dim => [dim, current])], [])
      .map(([widthScale, heightScale]) => ({
        previewSize: {
          width: widthScale * dimensions.width,
          height: heightScale * dimensions.height,
        },
        name: `${widthScale} x ${heightScale}`
    }))

    return [...initialNamedPreviewSizes, ...scaledPreviewSizes];
  }

  render() {
    const {
      flashMode,
      autofocus,
      hdr,
      topActionExpanded,
      focusPoint,
      showBrightnessRuler,
      brightnessIndicator,
      previewSize,
    } = this.state;

    const availablePreviewSizes = this.prepareAvailablePreviewSizes();

    return (
      <View style={styles.container}>
        <PanGestureHandler onGestureEvent={this.handlePanGesture}>
          <TapGestureHandler onHandlerStateChange={this.handleTapGestureStateChange}>
            <View style={styles.cameraViewContainer}>
              <ExpoCamera.View style={previewSize.previewSize} />
              {focusPoint && (
                <FocusMarker
                  style={styles.focusMarker}
                  point={focusPoint}
                  showBrightnessRuler={showBrightnessRuler}
                  brightnessIndicator={brightnessIndicator}
                />
              )}
            </View>
          </TapGestureHandler>
        </PanGestureHandler>
        <View style={[styles.actionsContainer, styles.topActionsContainer]}>
          <ExpandableSelect<ExpoCamera.FlashMode, "flashMode">
            name="flashMode"
            value={flashMode}
            onChange={this.handleFlashModeChange}
            data={Object.values(ExpoCamera.FlashMode)}
            icon={(<FlashModeIcon flashMode={flashMode}/>)}
            onClick={this.handleTopActionExpanded}
            expandedAction={topActionExpanded}
          />
          <ExpandableSelect<ExpoCamera.Autofocus, "autofocus">
            name="autofocus"
            value={autofocus}
            onChange={this.handleAutofocusChange}
            data={Object.values(ExpoCamera.Autofocus)}
            icon={(<AutofocusIcon autofocus={autofocus}/>)}
            onClick={this.handleTopActionExpanded}
            expandedAction={topActionExpanded}
          />
          <ExpandableSelect<ExpoCamera.HDR, "hdr">
            name="hdr"
            value={hdr}
            onChange={this.handleHDRChange}
            data={Object.values(ExpoCamera.HDR)}
            icon={(<HDRIcon hdr={hdr}/>)}
            onClick={this.handleTopActionExpanded}
            expandedAction={topActionExpanded}
          />
          <ExpandableSelect<NamedPreviewSize, "previewSize">
            name="previewSize"
            value={previewSize}
            onChange={this.handlePreviewSizeChange}
            data={availablePreviewSizes}
            labelExtractor={item => item.name}
            icon={(<PreviewSizeIcon />)}
            onClick={this.handleTopActionExpanded}
            expandedAction={topActionExpanded}
          />
        </View>
        <View style={[styles.actionsContainer, styles.bottomActionsContainer]}>
          <View style={styles.modeCarouselContainer}>
          <Carousel<OperationMode>
            // @ts-ignore
            ref={this.modeCarousel}
            data={[OperationMode.Photo]}
            renderItem={this.renderCarouselMode}
            onSnapToItem={this.handleSnapToMode}
            firstItem={0}
            itemWidth={100}
            sliderWidth={Dimensions.get('window').width}
          />
          </View>
          <View style={styles.cameraActionsContainer}>
            <CameraActionButton style={styles.cameraActionButton}/>
            <ChangeFacingButton style={styles.changeFacingButton}/>
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(0.0, 0.0, 0.0, 0.0)',
  },
  actionsContainer: {
    backgroundColor: 'rgba(50.0, 0.0, 0.0, 0.2)',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topActionsContainer: {
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomActionsContainer: {
    bottom: 0,
    paddingBottom: 15,
  },
  modeCarouselContainer: {
    flex: 1,
    marginBottom: 5,
  },
  modeCarouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  modeCarouselItemText: {
    color: 'white',
    fontWeight: '400',
    textTransform: 'uppercase',
  },
  modeCarouselActiveItemText: {
    color: 'rgb(220, 190, 40)',
  },
  cameraActionsContainer: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraActionButton: {},
  changeFacingButton: {
    position: 'absolute',
    right: 15,
  },
  cameraViewContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  focusMarker: {
    position: 'absolute',
  }
});

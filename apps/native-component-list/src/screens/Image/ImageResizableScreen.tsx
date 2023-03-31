import { ImageContentFit, ImageContentPosition, Image, ImageProps } from 'expo-image';
import React from 'react';
import {
  Dimensions,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { FunctionParameter, useArguments } from '../../components/FunctionDemo';
import Configurator from '../../components/FunctionDemo/Configurator';
import { Colors } from '../../constants';

type CustomViewProps = React.PropsWithChildren<object>;

type ContextType = {
  x: number;
  y: number;
};

const PADDING = 20;
const HANDLE_SIZE = 25;
const HANDLE_SLOP = 10;
const WINDOW_DIMENSIONS = Dimensions.get('window');
const MAX_WIDTH = WINDOW_DIMENSIONS.width - 2 * PADDING;
const MAX_HEIGHT = WINDOW_DIMENSIONS.height - 330;

const ResizableView: React.FC<CustomViewProps> = ({ children }) => {
  const width = useSharedValue(300);
  const height = useSharedValue(300);

  const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, context) => {
      context.x = width.value;
      context.y = height.value;
    },
    onActive: (event, context) => {
      width.value = Math.max(HANDLE_SIZE, Math.min(event.translationX + context.x, MAX_WIDTH));
      height.value = Math.max(HANDLE_SIZE, Math.min(event.translationY + context.y, MAX_HEIGHT));
    },
  });

  const canvasStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
      height: height.value,
    };
  }, [width, height]);

  const text = useDerivedValue(() => `${Math.round(width.value)}x${Math.round(height.value)}`);
  const animatedProps = useAnimatedProps(() => {
    return {
      text: text.value,
      // Here we use any because the text prop is not available in the type
    } as any;
  });
  const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

  return (
    <View>
      <AnimatedTextInput
        editable={false}
        value={text.value}
        underlineColorAndroid="transparent"
        style={styles.sizeText}
        {...{ animatedProps }}
      />
      <View style={styles.resizableView}>
        <Text style={styles.hintText}>
          Move the handle above to resize the image canvas and see how it lays out in different
          components, sizes and resize modes
        </Text>
        <Animated.View style={[styles.canvas, canvasStyle]}>
          {children}

          <PanGestureHandler onGestureEvent={panGestureEvent}>
            <Animated.View style={styles.resizeHandle}>
              <View style={styles.resizeHandleChild} />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </View>
    </View>
  );
};

const parameters: FunctionParameter[] = [
  {
    name: 'Use React Native Image',
    type: 'boolean',
    initial: false,
  },
  {
    name: 'Size',
    type: 'enum',
    values: [
      { name: '1500x1000', value: '1500/1000' },
      { name: '1000x1500', value: '1000/1500' },
      { name: '300x300', value: '300/300' },
      { name: '100x100', value: '100/100' },
    ],
  },
  {
    name: 'Content fit',
    type: 'enum',
    values: [
      { name: 'cover', value: 'cover' },
      { name: 'contain', value: 'contain' },
      { name: 'fill', value: 'fill' },
      { name: 'none', value: 'none' },
      { name: 'scale-down', value: 'scale-down' },
    ],
  },
  {
    name: 'Content position',
    type: 'enum',
    values: [
      { name: 'top 50%, left 50%', value: { top: '50%', left: '50%' } },
      { name: 'top 0, right 0', value: { top: 0, right: 0 } },
      { name: 'top 100, left 50', value: { top: 100, left: 50 } },
      { name: 'bottom 10%, right 25%', value: { bottom: '10%', right: '25%' } },
      { name: 'bottom 0, right 10', value: { bottom: 0, right: 10 } },
    ],
  },
  {
    name: 'Use responsive sources',
    type: 'boolean',
    initial: false,
  },
];

function mapContentFitToResizeMode(contentFit: ImageContentFit): ImageProps['resizeMode'] {
  if (!contentFit) {
    return 'cover';
  }
  switch (contentFit) {
    case 'cover':
    case 'contain':
      return contentFit;
    case 'fill':
      return 'stretch';
    case 'none':
    case 'scale-down':
      return 'center';
  }
}

export default function ImageResizableScreen() {
  const [seed] = React.useState(1 + Math.round(Math.random() * 10));
  const [args, updateArgument] = useArguments(parameters);
  const [showReactNativeComponent, size, contentFit, contentPosition, useResponsiveSources] =
    args as [boolean, string, ImageContentFit, ImageContentPosition, boolean];
  const ImageComponent: React.ElementType = showReactNativeComponent ? RNImage : Image;
  const source = useResponsiveSources
    ? [
        { uri: `https://picsum.photos/id/238/800/800`, width: 800, height: 800 },
        { uri: `https://picsum.photos/id/237/500/500`, width: 500, height: 500 },
        { uri: `https://picsum.photos/id/236/300/300`, width: 300, height: 300 },
      ]
    : { uri: `https://picsum.photos/seed/${seed}/${size}` };

  return (
    <ScrollView style={styles.container}>
      <ResizableView>
        <ImageComponent
          style={styles.image}
          source={source}
          contentFit={contentFit}
          contentPosition={contentPosition}
          resizeMode={mapContentFitToResizeMode(contentFit)}
        />
      </ResizableView>

      <View style={styles.configurator}>
        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resizableView: {
    margin: PADDING,
    width: MAX_WIDTH,
    height: MAX_HEIGHT,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#eef',
  },
  configurator: {
    flex: 1,
    paddingHorizontal: 15,
  },
  canvas: {
    margin: -1,
    minWidth: HANDLE_SIZE,
    minHeight: HANDLE_SIZE,
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    backgroundColor: '#00f2',
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: Colors.tintColor,
    borderRadius: 3,
  },
  resizeHandle: {
    padding: HANDLE_SLOP,
    position: 'absolute',
    bottom: -HANDLE_SIZE / 2 - HANDLE_SLOP,
    right: -HANDLE_SIZE / 2 - HANDLE_SLOP,
  },
  resizeHandleChild: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE,
    borderWidth: 3,
    borderColor: Colors.tintColor,
    backgroundColor: '#fff',
  },
  hintText: {
    color: Colors.secondaryText,
    textAlign: 'center',
    position: 'absolute',
    right: 10,
    left: 10,
    bottom: 16,
  },
  sizeText: {
    position: 'absolute',
    zIndex: 1,
    top: -PADDING + 8,
    right: PADDING - 4,
    color: Colors.secondaryText,
  },
  image: {
    flex: 1,
  },
});

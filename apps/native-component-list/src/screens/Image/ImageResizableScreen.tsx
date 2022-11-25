import { ImageResizeMode, Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import Configurator from '../../components/FunctionDemo/Configurator';
import { useArguments } from '../../components/FunctionDemo/FunctionDemo';

type CustomViewProps = React.PropsWithChildren<{
  initWidth: number;
  initHeight: number;
  boxWidth: number;
}>;

type ContextType = {
  x: number;
  y: number;
};

const ResizableView: React.FC<CustomViewProps> = ({
  initWidth,
  initHeight,
  boxWidth,
  children,
}) => {
  const x = useSharedValue(initWidth);
  const y = useSharedValue(initHeight);

  const panGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, ContextType>({
    onStart: (_, context) => {
      context.x = x.value;
      context.y = y.value;
    },
    onActive: (event, context) => {
      const newX = event.translationX + context.x;
      const newY = event.translationY + context.y;

      if (newX > boxWidth) {
        x.value = newX;
      }
      if (newY > boxWidth) {
        y.value = newY;
      }
    },
  });
  const panStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: x.value - boxWidth / 2,
        },
        {
          translateY: y.value - boxWidth / 2,
        },
      ],
    };
  }, [x, y]);
  const boxStyle = useAnimatedStyle(() => {
    return {
      width: x.value,
      height: y.value,
    };
  }, [x, y]);

  return (
    <View>
      <PanGestureHandler onGestureEvent={panGestureEvent}>
        <Animated.View
          style={[
            {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              zIndex: 1,
            },
            panStyle,
          ]}>
          <View
            style={[styles.box, { width: boxWidth, height: boxWidth, borderRadius: boxWidth / 5 }]}
          />
        </Animated.View>
      </PanGestureHandler>
      <Animated.View style={[{ backgroundColor: 'red' }, boxStyle]}>{children}</Animated.View>
    </View>
  );
};

const parameters = [
  {
    name: 'options',
    type: 'object',
    properties: [
      {
        name: 'resizeMode',
        type: 'enum',
        values: [
          { name: 'ImageResizeMode.CENTER', value: ImageResizeMode.CENTER },
          { name: 'ImageResizeMode.CONTAIN', value: ImageResizeMode.CONTAIN },
          { name: 'ImageResizeMode.COVER', value: ImageResizeMode.COVER },
          { name: 'ImageResizeMode.REPEAT', value: ImageResizeMode.REPEAT },
          { name: 'ImageResizeMode.STRETCH', value: ImageResizeMode.STRETCH },
        ],
      },
    ],
  },
];

const App = () => {
  const [args, updateArgument] = useArguments(parameters);
  const combindedArgs = args.reduce<object>(
    (previous, current) => ({ ...previous, ...current }),
    {}
  );

  return (
    <View style={styles.container}>
      <ResizableView initHeight={300} initWidth={300} boxWidth={50}>
        <Image
          style={{ flex: 1 }}
          source={{ uri: `https://source.unsplash.com/random/2137` }}
          {...combindedArgs}
        />
      </ResizableView>

      <View style={styles.cofigurator}>
        <Configurator parameters={parameters} onChange={updateArgument} value={args} />
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cofigurator: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#00f',
  },
});

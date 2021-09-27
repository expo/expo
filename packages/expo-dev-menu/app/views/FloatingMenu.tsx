import React, { Component } from 'react';
import { Animated, Dimensions, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import {
  BorderlessButton,
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

const MENU_WIDTH = 44;
const MENU_HEIGHT = MENU_WIDTH * 3;

const MARGIN_HORIZONTAL = 10;
const MARGIN_VERTICAL = 80;

const USE_NATIVE_DRIVER = true;

type Props = object;

export default class FloatingMenu extends Component<Props> {
  private drag: Animated.ValueXY;

  private spring?: Animated.CompositeAnimation;

  private onGestureEvent: (event: PanGestureHandlerGestureEvent) => void;

  constructor(props: Props) {
    super(props);

    this.state = { width: 0, height: 0, isDragging: false, event: {} };

    const { width, height } = Dimensions.get('window');
    this.drag = new Animated.ValueXY({ x: roundX(width, width), y: roundY(height, height) });

    this.onGestureEvent = Animated.event(
      [
        {
          nativeEvent: { absoluteX: this.drag.x, absoluteY: this.drag.y },
        },
      ],
      {
        useNativeDriver: USE_NATIVE_DRIVER,
      }
    );
  }
  private onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      this.spring?.stop();
    }
    if (event.nativeEvent.state === State.END) {
      const { height, width } = Dimensions.get('window');
      const x = roundX(event.nativeEvent.absoluteX, width);
      const y = roundY(event.nativeEvent.absoluteY, height);

      this.spring = Animated.spring(this.drag, {
        useNativeDriver: USE_NATIVE_DRIVER,
        toValue: { x, y },
        tension: 1,
        friction: 5,
      });
      this.spring.start();
    }
  };

  render() {
    return (
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <PanGestureHandler
          onGestureEvent={this.onGestureEvent}
          onHandlerStateChange={this.onHandlerStateChange}>
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateX: this.drag.x }, { translateY: this.drag.y }],
              },
            ]}>
            <IconButton icon={require('../../assets/refresh.png')} />
            <IconButton icon={require('../../assets/debug.png')} />
            <IconButton icon={require('../../assets/menu.png')} />
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  }
}

type IconButtonProps = { icon: ImageSourcePropType; onPress: () => void };

function IconButton(props: IconButtonProps) {
  return (
    <BorderlessButton style={styles.button} onPress={props.onPress}>
      <Image style={styles.icon} source={props.icon} />
    </BorderlessButton>
  );
}

function roundX(x: number, windowWidth: number) {
  if (x < windowWidth / 2) {
    return MARGIN_HORIZONTAL;
  } else {
    return windowWidth - MARGIN_HORIZONTAL - MENU_WIDTH;
  }
}

function roundY(y: number, windowHeight: number) {
  if (y < (1 / 3) * windowHeight) {
    return MARGIN_VERTICAL;
  } else if (y < (2 / 3) * windowHeight) {
    return windowHeight / 2 - MENU_HEIGHT / 2;
  } else {
    return windowHeight - MARGIN_VERTICAL - MENU_HEIGHT;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    width: MENU_WIDTH,
    height: MENU_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderRadius: MENU_WIDTH,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOpacity: 0.12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowRadius: 10,
    elevation: 10,
  },

  box: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    margin: 10,
    zIndex: 200,
  },

  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  icon: {
    width: 24,
    height: 24,
  },
});

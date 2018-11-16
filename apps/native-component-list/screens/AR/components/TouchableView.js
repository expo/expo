import React from 'react';
import { PanResponder, View } from 'react-native';
import { PropTypes } from 'prop-types';

export default class TouchableView extends React.Component {
  static propTypes = {
    onTouchesBegan: PropTypes.func.isRequired,
    onTouchesMoved: PropTypes.func.isRequired,
    onTouchesEnded: PropTypes.func.isRequired,
    onTouchesCancelled: PropTypes.func.isRequired,
  };
  static defaultProps = {
    onTouchesBegan: () => {},
    onTouchesMoved: () => {},
    onTouchesEnded: () => {},
    onTouchesCancelled: () => {},
  };

  constructor(props) {
    super(props);
    this.panResponder = this.buildPanResponder();
  }

  buildPanResponder = () =>
    PanResponder.create({
      onStartShouldSetResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: ({ nativeEvent }, gestureState) => {
        const event = this.transformEvent({ ...nativeEvent, gestureState });
        this.emit('touchstart', event);
        this.props.onTouchesBegan(event);
      },
      onPanResponderMove: ({ nativeEvent }, gestureState) => {
        const event = this.transformEvent({ ...nativeEvent, gestureState });
        this.emit('touchmove', event);
        this.props.onTouchesMoved(event);
      },
      onPanResponderRelease: ({ nativeEvent }, gestureState) => {
        const event = this.transformEvent({ ...nativeEvent, gestureState });
        this.emit('touchend', event);
        this.props.onTouchesEnded(event);
      },
      onPanResponderTerminate: ({ nativeEvent }, gestureState) => {
        const event = this.transformEvent({ ...nativeEvent, gestureState });
        this.emit('touchcancel', event);

        if (this.props.onTouchesCancelled) {
          this.props.onTouchesCancelled(event);
        } else {
          this.props.onTouchesEnded(event);
        }
      },
    });

  emit = (type, props) => {
    if (window.document && window.document.emitter) {
      window.document.emitter.emit(type, props);
    }
  };

  transformEvent = event => {
    event.preventDefault = event.preventDefault || (() => {});
    event.stopPropagation = event.stopPropagation || (() => {});
    if (this.width && this.height) {
      event.normalizedLocationX = event.locationX / this.width;
      event.normalizedLocationY = event.locationY / this.height;
      event.viewWidth = this.width;
      event.viewHeight = this.height;
    }
    return event;
  };

  onLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }) => {
    this.width = width;
    this.height = height;
  };

  render() {
    const { children, style, ...props } = this.props;
    return (
      <View {...props} style={[style]} {...this.panResponder.panHandlers} onLayout={this.onLayout}>
        {children}
      </View>
    );
  }
}

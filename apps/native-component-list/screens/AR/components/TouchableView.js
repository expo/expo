import React from 'react';
import { PanResponder, View } from 'react-native';
import { PropTypes } from 'prop-types';

export default class TouchableView extends React.Component {
  static propTypes = {
    onTouchesBegan: PropTypes.func.isRequired,
    onTouchesMoved: PropTypes.func.isRequired,
    onTouchesEnded: PropTypes.func.isRequired,
    onTouchesCancelled: PropTypes.func.isRequired,
    onStartShouldSetPanResponderCapture: PropTypes.func.isRequired,
  };
  static defaultProps = {
    onTouchesBegan: () => {},
    onTouchesMoved: () => {},
    onTouchesEnded: () => {},
    onTouchesCancelled: () => {},
    onStartShouldSetPanResponderCapture: () => true,
  };

  buildGestures = () =>
    PanResponder.create({
      // onResponderTerminate
      // onStartShouldSetResponder
      onResponderTerminationRequest: this.props.onResponderTerminationRequest,
      onStartShouldSetPanResponderCapture: this.props.onStartShouldSetPanResponderCapture,
      // onMoveShouldSetPanResponder:
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
          this.props.onTouchesCancelled(event)
        } else {
          this.props.onTouchesEnded(event);
        }
      },
    });

  componentWillMount() {
    this.panResponder = this.buildGestures();
  }

  emit = (type, props) => {
    if (window.document && window.document.emitter) {
      window.document.emitter.emit(type, props);
    }
  };

  transformEvent = event => {
    event.preventDefault = event.preventDefault || (() => {});
    event.stopPropagation = event.stopPropagation || (() => {});
    return event;
  };

  render() {
    const { children, style, ...props } = this.props;
    return (
      <View {...props} style={[style]} {...this.panResponder.panHandlers}>
        {children}
      </View>
    );
  }
}

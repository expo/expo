import React from 'react';
import cloneReferencedElement from 'react-clone-referenced-element';
import reactMixin from 'react-mixin';
import { Animated, StyleSheet, View } from 'react-native';
import TimerMixin from 'react-timer-mixin';

const onlyChild = React.Children.only;

export default class FadeIn extends React.Component {
  static defaultProps = {
    useNativeDriver: true,
  };

  state = {
    placeholderContainerOpacity: new Animated.Value(1),
  };

  render() {
    const image = cloneReferencedElement(onlyChild(this.props.children), {
      ref: component => {
        this._image = component;
      },
      onLoadEnd: this._onLoadEnd,
    });

    const safeImageProps = { ...StyleSheet.flatten(image.props.style) };
    delete safeImageProps.tintColor;
    delete safeImageProps.resizeMode;

    return (
      <View {...this.props}>
        {image}

        <Animated.View
          style={[
            styles.placeholderContainer,
            { opacity: this.state.placeholderContainerOpacity },
          ]}>
          <View style={[safeImageProps, styles.placeholder, this.props.placeholderStyle]}>
            {this.props.renderPlaceholderContent}
          </View>
        </Animated.View>
      </View>
    );
  }

  _onLoadEnd = () => {
    /* NOTE(brentvatne): If we animate in immediately when the onLoadEvent event
       fires, there are two unwanted consequences:
     1. Animation feels janky - not entirely sure why that is
       (handled with minimumWait)
     2. Many images finish loading in the same frame for some reason, and in my
       opinion it looks better when the images fade in separately
       (handled with staggerNonce) */

    const minimumWait = 100;
    const staggerNonce = 200 * Math.random();

    this.setTimeout(() => {
      Animated.timing(this.state.placeholderContainerOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: this.props.useNativeDriver,
      }).start();
    }, minimumWait + staggerNonce);
  };
}

reactMixin(FadeIn.prototype, TimerMixin);

let styles = StyleSheet.create({
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  placeholder: {
    backgroundColor: '#eee',
  },
});

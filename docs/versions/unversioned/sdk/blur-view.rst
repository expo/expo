.. _blur-view

********
BlurView
********

A React component that renders a native blur view on iOS and falls back to a
semi-transparent view on Android. A common usage of this is for navigation bars
and tab bars, like the following:

.. image:: img/nav-bar-blur.png
  :width: 400

Example: tint
'''''''''''''

.. image:: img/tint-effect-example.png
  :width: 100%

.. code-block:: javascript

  import React from 'react';
  import {
    Image,
    StyleSheet,
    View,
  } from 'react-native';
  import Exponent, {
    Components
  } from 'exponent';

  class BlurViewExample extends React.Component {
    render() {
      const uri = 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png';

      return (
        <View>
          <Image style={{width: 192, height: 192}} source={{uri}} />

          { /* Change tintEffect here to reproduce the above image */ }
          <Components.BlurView tint="light" style={StyleSheet.absoluteFill}>
            <Image style={{width: 96, height: 96}} source={{uri}} />
          </Components.BlurView>
        </View>
      );
    }
  }

  Exponent.registerRootComponent(BlurViewExample);

Example: blur strength with intensity
"""""""""""""""""""""""""""""""""""

You can change ``intensity`` prop on the component to change the strength of the
blur.

.. image:: img/blur-opacity-example.gif
   :width: 400

.. code-block:: javascript

  import React from 'react';
  import {
    Animated,
    Image,
    StyleSheet,
    View,
  } from 'react-native';
  import Exponent, {
    Components,
  } from 'exponent';

  const AnimatedBlurView = Animated.createAnimatedComponent(Components.BlurView);
  class BlurViewExample extends React.Component {
    state = {
      intensity: new Animated.Value(0),
    }

    componentDidMount() {
      this._animate();
    }

    _animate = () => {
      let { intensity } = this.state;
      Animated.timing(intensity, {duration: 2500, toValue: 100}).start((value) => {
        Animated.timing(intensity, {duration: 2500, toValue: 0}).start(this._animate);
      });
    }

    render() {
      const uri = 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png';

      return (
        <View style={{flex: 1, padding: 50, alignItems: 'center', justifyContent: 'center'}}>
          <Image style={{width: 180, height: 180}} source={{uri}} />

          <AnimatedBlurView
            tint="default"
            intensity={this.state.intensity}
            style={StyleSheet.absoluteFill} />
        </View>
      );
    }
  }

  Exponent.registerRootComponent(BlurViewExample);

props
'''''

.. attribute:: tint

   A string: ``light``, ``default``, or ``dark``.

.. attribute:: intensity

   A number from 1 to 100 to control the intensity of the blur effect.

.. _blur-view

********
BlurView
********

A React component that renders a native blur view on iOS and falls back to a
semi-transparent view on Android. A common usage of this is for navigation bars
and tab bars, like the following:

.. image:: img/nav-bar-blur.png
  :width: 400

Example
'''''''

.. image:: img/tint-effect-example.png
  :width: 100%

.. code-block:: javascript

  import React from 'react';
  import {
    Image,
    StyleSheet,
    View,
  } from 'react-native';
  import {
    Components
  } from 'exponent';

  export default class BlurViewExample extends React.Component {
    render() {
      const uri = 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png';

      return (
        <View>
          <Image style={{width: 192, height: 192}} source={{uri}} />

          <Components.BlurView tintEffect="light" style={StyleSheet.absoluteFill}>
            <Image style={{width: 96, height: 96}} source={{uri}} />
          </Components.BlurView>
        </View>
      );
    }
  }


props
'''''

.. attribute:: tintEffect

   A string: ``light``, ``default``, or ``dark`` that specifies 

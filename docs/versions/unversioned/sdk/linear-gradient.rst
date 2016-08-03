.. _linear-gradient:

**************
LinearGradient
**************

A React component that renders a native gradient view.

Example
'''''''

.. image:: img/gradient-button-example.png
  :width: 400

.. code-block:: javascript

  import React from 'react';
  import {
    Text,
    StyleSheet,
  } from 'react-native';
  import {
    Components
  } from 'exponent';

  export default class FacebookButton extends React.Component {
    render() {
      return (
        <Components.LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={{padding: 15, alignItems: 'center', borderRadius: 5}}>
          <Text style={{backgroundColor: 'transparent', fontSize: 15, color: '#fff'}}>
            Sign in with Facebook
          </Text>
        </Components.LinearGradient>
      );
    }
  }


props
'''''

.. attribute:: colors

  An array of colors that represent stops in the gradient. At least two colors
  are required (otherwise it's not a gradient, it's just a fill!).

.. attribute:: start

  An array of ``[x, y]`` where x and y are floats. They represent the position that
  the gradient starts at, as a fraction of the overall size of the gradient. For
  example, ``[0.1, 0.1]`` means that the gradient will start 10% from the top and 10%
  from the left.

.. attribute:: end

  Same as start but for the end of the gradient.

.. attribute:: locations

  An array of the same lenth as ``colors``, where each element is a float with the
  same meaning as the ``start`` and ``end`` values, but instead they indicate where
  the color at that index should be.

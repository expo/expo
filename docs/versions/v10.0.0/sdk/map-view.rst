MapView
=======

A Map component that uses Apple Maps on iOS and Google Maps on Android. Built by Airbnb at
`airbnb/react-native-maps <https://github.com/airbnb/react-native-maps>`_.

.. image:: img/maps.png
  :width: 100%

.. code-block:: javascript

  import React from 'react';
  import { Components } from 'exponent';

  export default class HomeScreen extends React.Component {
    static route = {
      navigationBar: {
        visible: false,
      },
    }

    render() {
      return (
        <Components.MapView
          style={{flex: 1}}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      );
    }
  }

.. attribute:: Exponent.Components.MapView

   See full documentation at `airbnb/react-native-maps <https://github.com/airbnb/react-native-maps>`_.

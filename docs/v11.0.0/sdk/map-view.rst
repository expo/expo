MapView
=======

A Map component that uses Apple Maps on iOS and Google Maps on Android. Built by Airbnb at
`airbnb/react-native-maps <https://github.com/airbnb/react-native-maps>`_. No setup
required for use within the Exponent app, or within a standalone app for iOS.
See below for instructions on how to configure for deployment as a standalone
app on Android.

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

Deploying to a standalone app on Android
""""""""""""""""""""""""""""""""""""""""

1. Build your app, take note of your Android package name (eg: ca.brentvatne.growlerprowler)
2. Go to https://console.developers.google.com/apis/credentials and create a new project.
3. Once it's created, go to the project and enable the Google Maps Android API
4. Click Go to Credentials
5. Create a key, click Restrict Key
6. Choose Android apps as key restriction, give the key a name if you want to
7. Click Add package name and fingerprint
8. Run ``keytool -list -printcert -jarfile growler.apk | grep SHA1 | awk '{ print $2 }'`` where ``growler.apk`` is the path to the apk you built in step 1.
9. Take the output from step 8 and insert it in the "SHA-1 certificate fingerprint" field
10. Add the package name (eg: ca.brentvatne.growlerprowler) to the Package name field. Press save.
11. Open ``exp.json`` and add the api key to the ``android.config.googleMaps.apiKey`` field. `See an example diff <https://github.com/brentvatne/growler-prowler/commit/3496e69b14adb21eb2025ef9e0719c2edbef2aa2>`_.
12. Rebuild the app like in step 1.

Deploying to a standalone app on iOS
""""""""""""""""""""""""""""""""""""

No special configuration required.

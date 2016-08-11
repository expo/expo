.. _app-loading:

**********
AppLoading
**********

A React component that tells Exponent to keep the app loading screen open if
it is the first and only component rendered in your app. When it is removed,
the loading screen will disappear and your app will be visible.

This is incredibly useful to let you download and cache fonts, logo and icon
images and other assets that you want to be sure the user has on their device
for an optimal experience before rendering they start using the app.

Example
'''''''

.. code-block:: javascript

  import React from 'react';
  import {
    AppRegistry,
    Image,
    Text,
    View,
  } from 'react-native';
  import {
    Asset,
    Components,
  } from 'exponent';

  class App extends React.Component {
    state = {
      isReady: false,
    };

    componentWillMount() {
      this._cacheResourcesAsync();
    }

    render() {
      if (!this.state.isReady) {
        return <Components.AppLoading />;
      }

      return (
        <View>
          <Image source={require('./assets/images/exponent-icon.png')} />
          <Image source={require('./assets/images/slack-icon.png')} />
        </View>
      );
    }

    async _cacheResourcesAsync() {
      const images = [
        require('./assets/images/exponent-icon.png'),
        require('./assets/images/slack-icon.png'),
      ];

      for (let image of images) {
        await Asset.fromModule(image).downloadAsync();
      }

      this.setState({isReady: true});
    }
  }

  AppRegistry.registerComponent('main', () => App);

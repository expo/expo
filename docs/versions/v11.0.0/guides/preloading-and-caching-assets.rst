.. _all-about-assets:

***************************
Preloading & Caching Assets
***************************

In order to keep the loading screen visible while we cache our assets, we
render :ref:`Exponent.Components.AppLoading <app-loading>` and only that
component until everything is ready.

For images that we have saved to our local filesytem, we can use
``Exponent.Asset.fromModule(image).downloadAsync()`` to download and cache
the image. For web images, we can use ``Image.prefetch(image)``.

Fonts are preloaded using ``Exponent.Font.loadAsync(font)``. The ``font``
argument in this case is an object such as the following: ``{OpenSans:
require('./assets/fonts/OpenSans.ttf}``. ``@exponent/vector-icons`` provides
a helpful shortcut for this object, which you see below as ``FontAwesome.font``.

.. code-block:: javascript

  import Exponent from 'Exponent';

  function cacheImages(images) {
    return images.map(image => {
      if (typeof image === 'string') {
        return Image.prefetch(image);
      } else {
        return Exponent.Asset.fromModule(image).downloadAsync();
      }
    });
  }

  function cacheFonts(fonts) {
    return fonts.map(font => Exponent.Font.loadAsync(font));
  }

  class AppContainer extends React.Component {
    state = {
      appIsReady: false,
    }

    componentWillMount() {
      this._loadAssetsAsync();
    }

    render() {
      if (!this.state.appIsReady) {
        return <Components.AppLoading />;
      }

      return <MyApp />;
    }

    async _loadAssetsAsync() {
      const imageAssets = cacheImages([
        require('./assets/images/exponent-wordmark.png'),
        'http://www.google.com/logo.png',
      ]);

      const fontAssets = cacheFonts([
        FontAwesome.font,
      ]);

      await Promise.all([
        ...imageAssets,
        ...fontAssets,
      ]);

      this.setState({appIsReady: true});
    }
  }

See a full working example in `github/exponentjs/new-project-template <https://github.com/exponentjs/new-project-template/blob/9c5f99efa9afcbefdadefe752ea350cc378c0f0d/main.js>`_.

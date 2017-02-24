---
title: Assets
old_permalink: /versions/v10.0.0/guides/assets.html
previous___FILE: ./debugging.md
next___FILE: ./icons.md
---

Images, fonts, videos, sounds, any other file that your app depends on that is not JavaScript is considered to be an _asset_. Just as on the web, assets are fetched or streamed over HTTP on demand. This is different from your typical mobile app, where assets are bundled with your application binary. Let's look at how your assets go from your local machine to a fast, persistent home on the web, and how you can download & cache assets that are important to properly rendering your app and available offline.

## Where assets live

### In development

While you're working on a local copy of your project, assets are served from your local filesystem and are integrated with the JavaScript module system. So if I want to include an image I can `require` it, like I would if it were JavaScript code: `require('./assets/images/example.png')`. The only difference here is that we need to specify an extension -- without an extension, the module system will assume it is a JavaScript file. This statement evaluates at compile time to an object that includes metadata about the asset that can be consumed by the `Image` component to fetch it and render it: `<Image source={require('./assets/images/example.png')} />`

### In production

Each time you publish your app, Exponent will upload your assets to Amazon CloudFront, a blazing fast CDN. It does this in an intelligent way to ensure your deploys remain fast: if an asset has not changed since your previous deploy, it is skipped. You don't have to do anything for this to work, it is all automatically handled by Exponent.

## Preloading & caching assets

Some assets are too important to start your app without. Fonts often fall into this category. On the web the font loading problem is known by several acronyms: FOUT, FOIT, and FOFT, which stand for Flash of Unstyled Text, Flash of Invisible Text, and Flash of Faux Text ([read more here](https://css-tricks.com/fout-foit-foft/)). The default behaviour with the icon-font-powered [@exponent/vector-icons](icons.html#icons) icons is a FOIT on first load, and on subsequent loads the font will be automatically cached. Users have higher standards for mobile than web, so you might want to take it a step further by preloading and caching the font and important images during the initial loading screen.

In order to keep the loading screen visible while we cache our assets, we render [Exponent.Components.AppLoading](../sdk/app-loading.html#app-loading) and only that component until everything is ready.

```javascript
import * as Exponent from 'Exponent';

function cacheImages(images) {
  return images.map(image => Exponent.Asset.fromModule(image).downloadAsync());
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
      require('./assets/images/exponent-icon.png'),
      require('./assets/images/slack-icon.png'),
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
```

See a full working example in [github/exponent/new-project-template](https://github.com/exponent/new-project-template/blob/9c5f99efa9afcbefdadefe752ea350cc378c0f0d/main.js).

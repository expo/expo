import { Image } from 'react-native';
import type AssetSourceResolver from 'react-native/Libraries/Image/AssetSourceResolver';

// @ts-expect-error: addCustomSourceTransformer type is not exported
if (typeof Image.resolveAssetSource.addCustomSourceTransformer === 'function') {
  // @ts-expect-error: addCustomSourceTransformer type is not exported
  Image.resolveAssetSource.addCustomSourceTransformer((resolver: AssetSourceResolver) => {
    if (
      process.env.EXPO_OS === 'android' &&
      resolver.asset.type === 'xml' &&
      resolver.serverUrl != null &&
      resolver.serverUrl !== ''
    ) {
      // react-native's resolveAssetSource doesn't allow xml assets to be resolved from the server.
      // We support material symbols using compose PathParser because material symbols are mainly paths.
      // We have to patch the resolver to allow xml assets to be resolved from the server.
      // https://github.com/facebook/react-native/blob/758a3db449d770214883ba8d15da4856ca997bff/packages/react-native/Libraries/Image/AssetSourceResolver.js#L69-L85
      return resolver.assetServerURL();
    }
    return resolver.defaultAsset();
  });
}

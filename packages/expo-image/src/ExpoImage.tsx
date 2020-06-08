import React from 'react';
import { Image, requireNativeComponent, StyleSheet, Platform, processColor } from 'react-native';

import { ImageProps } from './Image';

type NativeExpoImageProps = ImageProps;

const NativeExpoImage = requireNativeComponent<NativeExpoImageProps>('ExpoImage');

export default function ExpoImage({ source, style, ...props }: ImageProps) {
  const resolvedSource = Image.resolveAssetSource(source ?? {});
  const resolvedStyle = StyleSheet.flatten([style]);

  // When possible, pass through the intrinsic size of the asset to the Yoga layout
  // system. While this is also possible in native code, doing it here is more efficient
  // as the yoga node gets initialized with the correct size from the start.
  // In native code, there is a separation between the layout (shadow) nodes and
  // actual views. Views that update the intrinsic content-size in Yoga trigger
  // additional layout passes, which we want to prevent.
  if (!Array.isArray(resolvedSource)) {
    const { width, height } = resolvedSource;
    resolvedStyle.width = resolvedStyle.width ?? width;
    resolvedStyle.height = resolvedStyle.height ?? height;
  }

  // Shadows behave different on iOS, Android & Web.
  // Android uses the `elevation` prop, whereas iOS
  // and web use the regular `shadow...` props.
  let hasShadows = false;
  if (Platform.OS === 'android') {
    delete resolvedStyle.shadowColor;
    delete resolvedStyle.shadowOffset;
    delete resolvedStyle.shadowOpacity;
    delete resolvedStyle.shadowRadius;
    hasShadows = !!resolvedStyle.elevation;
  } else {
    delete resolvedStyle.elevation;
    hasShadows = !!resolvedStyle.shadowColor;
  }

  // Shadows are rendered quite differently on iOS, Android and web.
  // - iOS renders the shadow along the transparent contours of the image.
  // - Android renders an underlay which extends to the inside of the bounds.
  // - Web renders the shadow only on the outside of the bounds.
  // To achieve a consistent appearance on all platforms, it is highly recommended
  // to set a background-color on the Image when using shadows. This will ensure
  // consistent rendering on all platforms and mitigate Androids drawing artefacts.
  if (hasShadows) {
    const bkColor = resolvedStyle.backgroundColor ? processColor(resolvedStyle.backgroundColor) : 0;
    const alpha = bkColor >> 24;
    if (alpha !== -1 && alpha !== 255) {
      // To silence this warning, set background-color to a fully transparent color
      console.warn(
        `"expo-image" Shadows may not be rendered correctly for the transparent parts of images. Set "backgroundColor" to a non-transparent color when using a shadow.`
      );
    }
  }

  return <NativeExpoImage {...props} source={resolvedSource} style={resolvedStyle} />;
}

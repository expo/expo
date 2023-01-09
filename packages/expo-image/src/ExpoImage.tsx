import { requireNativeViewManager, requireNativeModule } from 'expo-modules-core';
import React from 'react';
import { NativeSyntheticEvent, StyleSheet, Platform, processColor } from 'react-native';

import {
  ImageErrorEventData,
  ImageLoadEventData,
  ImageNativeProps,
  ImageProgressEventData,
} from './Image.types';

const NativeExpoImage = requireNativeViewManager('ExpoImage');

const ExpoImageModule = requireNativeModule('ExpoImage');

function withDeprecatedNativeEvent<NativeEvent>(
  event: NativeSyntheticEvent<NativeEvent>
): NativeEvent {
  Object.defineProperty(event.nativeEvent, 'nativeEvent', {
    get() {
      console.warn(
        '[expo-image]: Accessing event payload through "nativeEvent" is deprecated, it is now part of the event object itself'
      );
      return event.nativeEvent;
    },
  });
  return event.nativeEvent;
}

class ExpoImage extends React.PureComponent<ImageNativeProps> {
  onLoadStart = () => {
    this.props.onLoadStart?.();
  };

  onLoad = (event: NativeSyntheticEvent<ImageLoadEventData>) => {
    this.props.onLoad?.(withDeprecatedNativeEvent(event));
    this.onLoadEnd();
  };

  onProgress = (event: NativeSyntheticEvent<ImageProgressEventData>) => {
    this.props.onProgress?.(withDeprecatedNativeEvent(event));
  };

  onError = (event: NativeSyntheticEvent<ImageErrorEventData>) => {
    this.props.onError?.(withDeprecatedNativeEvent(event));
    this.onLoadEnd();
  };

  onLoadEnd = () => {
    this.props.onLoadEnd?.();
  };

  render() {
    const { style, ...props } = this.props;
    const resolvedStyle = StyleSheet.flatten(style);

    // Shadows behave different on iOS, Android & Web.
    // Android uses the `elevation` prop, whereas iOS
    // and web use the regular `shadow...` props.
    if (Platform.OS === 'android') {
      delete resolvedStyle.shadowColor;
      delete resolvedStyle.shadowOffset;
      delete resolvedStyle.shadowOpacity;
      delete resolvedStyle.shadowRadius;
    } else {
      // @ts-expect-error
      delete resolvedStyle.elevation;
    }

    // @ts-ignore
    const backgroundColor = processColor(resolvedStyle.backgroundColor);
    // On Android, we have to set the `backgroundColor` directly on the correct component.
    // So we have to remove it from styles. Otherwise, the background color won't take into consideration the border-radius.
    if (Platform.OS === 'android') {
      delete resolvedStyle.backgroundColor;
    }

    const tintColor = processColor(resolvedStyle.tintColor);

    const borderColor = processColor(resolvedStyle.borderColor);
    // @ts-ignore
    const borderStartColor = processColor(resolvedStyle.borderStartColor);
    // @ts-ignore
    const borderEndColor = processColor(resolvedStyle.borderEndColor);
    // @ts-ignore
    const borderLeftColor = processColor(resolvedStyle.borderLeftColor);
    // @ts-ignore
    const borderRightColor = processColor(resolvedStyle.borderRightColor);
    // @ts-ignore
    const borderTopColor = processColor(resolvedStyle.borderTopColor);
    // @ts-ignore
    const borderBottomColor = processColor(resolvedStyle.borderBottomColor);

    return (
      <NativeExpoImage
        {...props}
        {...resolvedStyle}
        style={resolvedStyle}
        onLoadStart={this.onLoadStart}
        onLoad={this.onLoad}
        onProgress={this.onProgress}
        onError={this.onError}
        // @ts-ignore
        tintColor={tintColor}
        borderColor={borderColor}
        borderLeftColor={borderLeftColor}
        borderRightColor={borderRightColor}
        borderTopColor={borderTopColor}
        borderBottomColor={borderBottomColor}
        borderStartColor={borderStartColor}
        borderEndColor={borderEndColor}
        backgroundColor={backgroundColor}
      />
    );
  }
}

export { ExpoImageModule };
export default ExpoImage;

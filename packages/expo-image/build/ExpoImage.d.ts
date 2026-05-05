import React from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import type { ImageErrorEventData, ImageLoadEventData, ImageNativeProps, ImageProgressEventData } from './Image.types';
declare class ExpoImage extends React.PureComponent<ImageNativeProps> {
    startAnimating: () => Promise<unknown> | unknown;
    stopAnimating: () => Promise<unknown> | unknown;
    lockResourceAsync: () => Promise<void>;
    unlockResourceAsync: () => Promise<void>;
    reloadAsync: () => Promise<void>;
    onLoadStart: () => void;
    onLoad: (event: NativeSyntheticEvent<ImageLoadEventData>) => void;
    onProgress: (event: NativeSyntheticEvent<ImageProgressEventData>) => void;
    onError: (event: NativeSyntheticEvent<ImageErrorEventData>) => void;
    onLoadEnd: () => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default ExpoImage;
//# sourceMappingURL=ExpoImage.d.ts.map
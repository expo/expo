import React from 'react';
import { NativeSyntheticEvent } from 'react-native';
import { ImageErrorEventData, ImageLoadEventData, ImageNativeProps, ImageProgressEventData } from './Image.types';
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
    render(): React.JSX.Element;
}
export default ExpoImage;
//# sourceMappingURL=ExpoImage.d.ts.map
import React from 'react';
import { ImageContentFit } from './Image.types';
import { resolveContentFit, resolveContentPosition } from './utils';
const resolveAssetSource = (source) => {
    if (source === null || source === undefined)
        return undefined;
    if (typeof source === 'string') {
        return { uri: source };
    }
    return source;
};
const getObjectFitFromContentFit = (contentFit) => {
    switch (contentFit) {
        case ImageContentFit.CONTAIN:
            return 'contain';
        case ImageContentFit.COVER:
            return 'cover';
        case ImageContentFit.FILL:
            return 'fill';
        case ImageContentFit.SCALE_DOWN:
            return 'scale-down';
        case ImageContentFit.NONE:
            return 'none';
        default:
            return 'fill';
    }
};
const ensureUnit = (value) => {
    const trimmedValue = String(value).trim();
    if (trimmedValue.endsWith('%'))
        return trimmedValue;
    return `${trimmedValue}px`;
};
const getObjectPositionFromContentPosition = (contentPosition) => {
    const resolvedPosition = typeof contentPosition === 'string' ? resolveContentPosition(contentPosition) : contentPosition;
    if (!resolvedPosition)
        return undefined;
    if (!('top' in resolvedPosition || 'bottom' in resolvedPosition)) {
        resolvedPosition.top = '50%';
    }
    if (!('left' in resolvedPosition || 'right' in resolvedPosition)) {
        contentPosition.left = '50%';
    }
    return ['top', 'bottom', 'left', 'right']
        .map((key) => {
        if (key in resolvedPosition) {
            return `${key} ${ensureUnit(resolvedPosition[key])}`;
        }
        return '';
    })
        .join(' ');
};
export default function ExpoImage({ source, defaultSource, loadingIndicatorSource, contentPosition, onLoad, onLoadStart, onLoadEnd, onError, ...props }) {
    const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
    const resolvedSource = resolveAssetSource(source);
    return (React.createElement(React.Fragment, null,
        React.createElement("picture", { style: {
                overflow: 'hidden',
                ...style,
            } },
            React.createElement("source", { srcSet: resolvedSource?.uri }),
            React.createElement("img", { src: resolvedSource?.uri, alt: "Flowers", style: {
                    width: '100%',
                    height: '100%',
                    aspectRatio: String(aspectRatio),
                    backgroundColor: backgroundColor?.toString(),
                    transform: transform?.toString(),
                    borderColor: borderColor?.toString(),
                    objectFit: getObjectFitFromContentFit(resolveContentFit(props.contentFit, props.resizeMode)),
                    objectPosition: getObjectPositionFromContentPosition(contentPosition),
                } }))));
}
//# sourceMappingURL=ExpoImage.web.js.map
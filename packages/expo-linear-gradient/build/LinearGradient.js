// Copyright © 2024 650 Industries.
'use client';
import { Component } from 'react';
import { Platform, processColor } from 'react-native';
import NativeLinearGradient from './NativeLinearGradient';
/**
 * Renders a native view that transitions between multiple colors in a linear direction.
 */
export class LinearGradient extends Component {
    render() {
        const { colors, locations, start, end, dither, ...props } = this.props;
        let resolvedLocations = locations;
        if (locations && colors.length !== locations.length) {
            console.warn('LinearGradient colors and locations props should be arrays of the same length');
            resolvedLocations = locations.slice(0, colors.length);
        }
        return (<NativeLinearGradient {...props} colors={Platform.select({
                web: colors,
                default: colors.map(processColor),
            })} dither={Platform.select({ android: dither })} locations={resolvedLocations} startPoint={_normalizePoint(start)} endPoint={_normalizePoint(end)}/>);
    }
}
function _normalizePoint(point) {
    if (!point) {
        return undefined;
    }
    if (Array.isArray(point) && point.length !== 2) {
        console.warn('start and end props for LinearGradient must be of the format [x,y] or {x, y}');
        return undefined;
    }
    return Array.isArray(point) ? point : [point.x, point.y];
}
//# sourceMappingURL=LinearGradient.js.map
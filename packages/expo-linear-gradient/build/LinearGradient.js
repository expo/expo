import * as React from 'react';
import { Platform, processColor } from 'react-native';
import NativeLinearGradient from './NativeLinearGradient';
export var GradientDirection;
(function (GradientDirection) {
    GradientDirection["UP"] = "up";
    GradientDirection["TOP_RIGHT"] = "top-right";
    GradientDirection["RIGHT"] = "right";
    GradientDirection["BOTTOM_RIGHT"] = "bottom-right";
    GradientDirection["DOWN"] = "down";
    GradientDirection["BOTTOM_LEFT"] = "bottom-left";
    GradientDirection["LEFT"] = "left";
    GradientDirection["TOP_LEFT"] = "top-left";
})(GradientDirection || (GradientDirection = {}));
/**
 * Renders a native view that transitions between multiple colors in a linear direction.
 */
export class LinearGradient extends React.Component {
    render() {
        const { colors, locations, start, end, gradientDirection, ...props } = this.props;
        let resolvedLocations = locations;
        let startPoint = gradientDirection
            ? directionValues[gradientDirection].start
            : _normalizePoint(start);
        let endPoint = gradientDirection
            ? directionValues[gradientDirection].end
            : _normalizePoint(end);
        if (locations && colors.length !== locations.length) {
            console.warn('LinearGradient colors and locations props should be arrays of the same length');
            resolvedLocations = locations.slice(0, colors.length);
        }
        // Specifying 'start' or 'end' properties will override the 'gradientDirection' property
        if (gradientDirection !== undefined && (start !== undefined || end !== undefined)) {
            startPoint = _normalizePoint(start);
            endPoint = _normalizePoint(end);
        }
        return (React.createElement(NativeLinearGradient, { ...props, colors: Platform.select({
                web: colors,
                default: colors.map(processColor),
            }), locations: resolvedLocations, startPoint: startPoint, endPoint: endPoint }));
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
const directionValues = {
    [GradientDirection.UP]: {
        start: [1, 1],
        end: [1, 0],
    },
    [GradientDirection.TOP_RIGHT]: {
        start: [0, 1],
        end: [1, 0],
    },
    [GradientDirection.RIGHT]: {
        start: [0, 0],
        end: [1, 0],
    },
    [GradientDirection.BOTTOM_RIGHT]: {
        start: [0, 0],
        end: [1, 1],
    },
    [GradientDirection.DOWN]: {
        start: [0, 0],
        end: [0, 1],
    },
    [GradientDirection.BOTTOM_LEFT]: {
        start: [1, 0],
        end: [0, 1],
    },
    [GradientDirection.LEFT]: {
        start: [1, 0],
        end: [0, 0],
    },
    [GradientDirection.TOP_LEFT]: {
        start: [1, 1],
        end: [0, 0],
    },
};
//# sourceMappingURL=LinearGradient.js.map
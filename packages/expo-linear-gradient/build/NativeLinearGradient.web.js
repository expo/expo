import * as React from 'react';
import { View } from 'react-native';
import { normalizeColor } from './normalizeColor';
export default function NativeLinearGradient({ colors, locations, startPoint, endPoint, ...props }) {
    const [{ height, width }, setLayout] = React.useState({
        height: 1,
        width: 1,
    });
    // TODO(Bacon): In the future we could consider adding `backgroundRepeat: "no-repeat"`. For more
    // browser support.
    const linearGradientBackgroundImage = React.useMemo(() => {
        return getLinearGradientBackgroundImage(colors, locations, startPoint, endPoint, width, height);
    }, [colors, locations, startPoint, endPoint, width, height]);
    return (React.createElement(View, { ...props, style: [
            props.style,
            // @ts-ignore: [ts] Property 'backgroundImage' does not exist on type 'ViewStyle'.
            { backgroundImage: linearGradientBackgroundImage },
        ], onLayout: (event) => {
            const { width, height } = event.nativeEvent.layout;
            setLayout((oldLayout) => {
                // don't set new layout state unless the layout has actually changed
                if (width !== oldLayout.width || height !== oldLayout.height) {
                    return { height, width };
                }
                return oldLayout;
            });
            if (props.onLayout) {
                props.onLayout(event);
            }
        } }));
}
/**
 * Extracted to a separate function in order to be able to test logic independently.
 */
export function getLinearGradientBackgroundImage(colors, locations, startPoint, endPoint, width = 1, height = 1) {
    const gradientColors = calculateGradientColors(colors, locations);
    const angle = calculatePseudoAngle(width, height, startPoint, endPoint);
    return `linear-gradient(${angle}deg, ${gradientColors.join(', ')})`;
}
function calculatePseudoAngle(width, height, startPoint, endPoint) {
    const getControlPoints = () => {
        let correctedStartPoint = [0, 0];
        if (Array.isArray(startPoint)) {
            correctedStartPoint = [
                startPoint[0] != null ? startPoint[0] : 0.0,
                startPoint[1] != null ? startPoint[1] : 0.0,
            ];
        }
        let correctedEndPoint = [0.0, 1.0];
        if (Array.isArray(endPoint)) {
            correctedEndPoint = [
                endPoint[0] != null ? endPoint[0] : 0.0,
                endPoint[1] != null ? endPoint[1] : 1.0,
            ];
        }
        return [correctedStartPoint, correctedEndPoint];
    };
    const [start, end] = getControlPoints();
    start[0] *= width;
    end[0] *= width;
    start[1] *= height;
    end[1] *= height;
    const py = end[1] - start[1];
    const px = end[0] - start[0];
    return 90 + (Math.atan2(py, px) * 180) / Math.PI;
}
function calculateGradientColors(colors, locations) {
    return colors.map((color, index) => {
        const output = normalizeColor(color);
        if (locations && locations[index]) {
            const location = Math.max(0, Math.min(1, locations[index]));
            // Convert 0...1 to 0...100
            const percentage = location * 100;
            return `${output} ${percentage}%`;
        }
        return output;
    });
}
//# sourceMappingURL=NativeLinearGradient.web.js.map
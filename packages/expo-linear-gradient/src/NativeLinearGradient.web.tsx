import React, { FunctionComponent, useEffect, useState } from 'react';
import { LayoutRectangle, View } from 'react-native';
import normalizeColor from 'react-native-web/src/modules/normalizeColor';

type Props = {
  colors: number[];
  locations?: number[] | null;
  startPoint?: Point | null;
  endPoint?: Point | null;
  onLayout?: Function;
} & React.ComponentProps<typeof View>;

type Point = [number, number];

const NativeLinearGradient: FunctionComponent<Props> = ({
  colors,
  locations,
  startPoint,
  endPoint,
  ...props
}: Props) => {
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const [gradientColors, setGradientColors] = useState<string[]>([]);
  const [pseudoAngle, setPseudoAngle] = useState<number>(0);

  const { width = 1, height = 1 } = layout ?? {};
  useEffect(() => {
    const getControlPoints = (): Point[] => {
      let correctedStartPoint: Point = [0, 0];
      if (Array.isArray(startPoint)) {
        correctedStartPoint = [
          startPoint[0] != null ? startPoint[0] : 0.0,
          startPoint[1] != null ? startPoint[1] : 0.0,
        ];
      }
      let correctedEndPoint: Point = [0.0, 1.0];
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

    setPseudoAngle(90 + (Math.atan2(py, px) * 180) / Math.PI);
  }, [width, height, startPoint, endPoint]);

  useEffect(() => {
    const nextGradientColors = colors.map((color: number, index: number): string => {
      const hexColor = normalizeColor(color);
      let output = hexColor;
      if (locations && locations[index]) {
        const location = Math.max(0, Math.min(1, locations[index]));
        // Convert 0...1 to 0...100
        const percentage = location * 100;
        output += ` ${percentage}%`;
      }
      return output;
    });

    setGradientColors(nextGradientColors);
  }, [colors, locations]);

  const colorStyle = gradientColors.join(',');
  const backgroundImage = `linear-gradient(${pseudoAngle}deg, ${colorStyle})`;
  // TODO: Bacon: In the future we could consider adding `backgroundRepeat: "no-repeat"`. For more
  // browser support.
  return (
    <View
      {...props}
      style={[
        props.style,
        // @ts-ignore: [ts] Property 'backgroundImage' does not exist on type 'ViewStyle'.
        { backgroundImage },
      ]}
      onLayout={event => {
        setLayout(event.nativeEvent.layout);
        if (props.onLayout) {
          props.onLayout(event);
        }
      }}
    />
  );
};

export default NativeLinearGradient;

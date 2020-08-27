import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  initialHorRadius,
  maxHorRadius,
  initialVertRadius,
  maxVertRadius,
  initialSideWidth,
} from './WeaveHelpers';

const { width, height } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default ({ centerY, progress, isBack, children }: any) => {
  const sideWidth = useDerivedValue(() => {
    const p1 = 0.2;
    const p2 = 0.8;
    if (progress.value <= p1) {
      return initialSideWidth;
    }
    if (progress.value >= p2) {
      return width;
    }
    return initialSideWidth + ((width - initialSideWidth) * (progress.value - p1)) / (p2 - p1);
  });

  const horRadius = useDerivedValue(() => {
    if (progress.value <= 0) {
      return initialHorRadius;
    }
    if (progress.value >= 1) {
      return 0;
    }
    const p1 = 0.4;
    if (progress.value <= p1) {
      return isBack.value
        ? initialHorRadius + (progress.value / p1) * initialHorRadius
        : initialHorRadius + (progress.value / p1) * (maxHorRadius - initialHorRadius);
    }
    const t = (progress.value - p1) / (1.0 - p1);
    const A = isBack ? 2 * initialHorRadius : maxHorRadius;
    const r = 40;
    const m = 9.8;
    const beta = r / (2 * m);
    const k = 50;
    const omega0 = k / m;
    const omega = Math.pow(-Math.pow(beta, 2) + Math.pow(omega0, 2), 0.5);

    return A * Math.exp(-beta * t) * Math.cos(omega * t);
  });

  const vertRadius = useDerivedValue(() => {
    const p1 = 0.4;
    if (progress.value <= 0) {
      return initialVertRadius;
    }
    if (progress.value >= p1) {
      return maxVertRadius;
    }
    return initialVertRadius + ((maxVertRadius - initialVertRadius) * progress.value) / p1;
  });

  const props = useAnimatedProps(() => {
    const curveStartY = centerY.value + vertRadius.value;
    const maskWidth = width - sideWidth.value;

    const commands = `
        M${maskWidth} ${0}
        L${0} ${0}
        L${0} ${height}
        L${maskWidth} ${height}
        L${maskWidth} ${curveStartY}
        C${maskWidth} ${curveStartY - horRadius.value * 0.1346194756}
        ${maskWidth - horRadius.value * 0.05341339583} ${curveStartY -
      vertRadius.value * 0.2412779634}
        ${maskWidth - horRadius.value * 0.1561501458} ${curveStartY -
      vertRadius.value * 0.3322374268}
        C${maskWidth - horRadius.value * 0.2361659167} ${curveStartY -
      vertRadius.value * 0.4030805244}
        ${maskWidth - horRadius.value * 0.3305285625} ${curveStartY -
      vertRadius.value * 0.4561193293}
        ${maskWidth - horRadius.value * 0.5012484792} ${curveStartY -
      vertRadius.value * 0.5350576951}
        C${maskWidth - horRadius.value * 0.515878125} ${curveStartY -
      vertRadius.value * 0.5418222317}
        ${maskWidth - horRadius.value * 0.5664134792} ${curveStartY -
      vertRadius.value * 0.5650349878}
        ${maskWidth - horRadius.value * 0.574934875} ${curveStartY -
      vertRadius.value * 0.5689655122}
        C${maskWidth - horRadius.value * 0.7283715208} ${curveStartY -
      vertRadius.value * 0.6397387195}
        ${maskWidth - horRadius.value * 0.8086618958} ${curveStartY -
      vertRadius.value * 0.6833456585}
        ${maskWidth - horRadius.value * 0.8774032292} ${curveStartY -
      vertRadius.value * 0.7399037439}
        C${maskWidth - horRadius.value * 0.9653464583} ${curveStartY -
      vertRadius.value * 0.8122605122}
        ${maskWidth - horRadius.value} ${curveStartY - vertRadius.value * 0.8936183659}
        ${maskWidth - horRadius.value} ${curveStartY - vertRadius.value}
        C${maskWidth - horRadius.value} ${curveStartY - vertRadius.value * 1.100142878}
        ${maskWidth - horRadius.value * 0.9595746667} ${curveStartY -
      vertRadius.value * 1.1887991951}
        ${maskWidth - horRadius.value * 0.8608411667} ${curveStartY -
      vertRadius.value * 1.270484439}
        C${maskWidth - horRadius.value * 0.7852123333} ${curveStartY -
      vertRadius.value * 1.3330544756}
        ${maskWidth - horRadius.value * 0.703382125} ${curveStartY -
      vertRadius.value * 1.3795848049}
        ${maskWidth - horRadius.value * 0.5291125625} ${curveStartY -
      vertRadius.value * 1.4665102805}
        C${maskWidth - horRadius.value * 0.5241858333} ${curveStartY -
      vertRadius.value * 1.4689677195}
        ${maskWidth - horRadius.value * 0.505739125} ${curveStartY -
      vertRadius.value * 1.4781625854}
        ${maskWidth - horRadius.value * 0.5015305417} ${curveStartY -
      vertRadius.value * 1.4802616098}
        C${maskWidth - horRadius.value * 0.3187486042} ${curveStartY -
      vertRadius.value * 1.5714239024}
        ${maskWidth - horRadius.value * 0.2332057083} ${curveStartY -
      vertRadius.value * 1.6204116463}
        ${maskWidth - horRadius.value * 0.1541165417} ${curveStartY - vertRadius.value * 1.687403}
        C${maskWidth - horRadius.value * 0.0509933125} ${curveStartY -
      vertRadius.value * 1.774752061}
        ${maskWidth} ${curveStartY - vertRadius.value * 1.8709256829}
        ${maskWidth} ${curveStartY - vertRadius.value * 2}
        L${maskWidth} ${0}
        Z
      `;
    return {
      d: commands,
    };
  });

  const maskElement = (
    <Svg {...{ width, height }}>
      <AnimatedPath animatedProps={props} fill="black" />
    </Svg>
  );
  return (
    <MaskedView style={StyleSheet.absoluteFill} maskElement={maskElement}>
      {children}
    </MaskedView>
  );
};

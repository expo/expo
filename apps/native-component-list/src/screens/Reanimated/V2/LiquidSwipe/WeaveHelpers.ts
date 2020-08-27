import { Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export const initialVertRadius = 82;
export const maxVertRadius = height * 0.9;

export const initialHorRadius = 48;
export const maxHorRadius = width * 0.8;

export const initialSideWidth = 15;

export const initialWaveCenter = height * 0.5;

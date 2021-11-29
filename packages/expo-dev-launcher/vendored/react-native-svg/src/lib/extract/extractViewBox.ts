import { NumberProp } from './types';

export const meetOrSliceTypes: {
  [meetOrSlice: string]: number;
} = {
  meet: 0,
  slice: 1,
  none: 2,
};

export const alignEnum: { [align: string]: string } = [
  'xMinYMin',
  'xMidYMin',
  'xMaxYMin',
  'xMinYMid',
  'xMidYMid',
  'xMaxYMid',
  'xMinYMax',
  'xMidYMax',
  'xMaxYMax',
  'none',
].reduce((prev: { [align: string]: string }, name) => {
  prev[name] = name;
  return prev;
}, {});

const spacesRegExp = /\s+/;

export default function extractViewBox(props: {
  viewBox?: string | NumberProp[];
  preserveAspectRatio?: string;
}) {
  const { viewBox, preserveAspectRatio } = props;

  if (!viewBox) {
    return null;
  }

  const params = (Array.isArray(viewBox)
    ? viewBox
    : viewBox.trim().split(spacesRegExp)
  ).map(Number);

  if (params.length !== 4 || params.some(isNaN)) {
    console.warn('Invalid `viewBox` prop:' + viewBox);
    return null;
  }

  const modes = preserveAspectRatio
    ? preserveAspectRatio.trim().split(spacesRegExp)
    : [];
  const align = modes[0];
  const meetOrSlice = modes[1];

  return {
    minX: params[0],
    minY: params[1],
    vbWidth: params[2],
    vbHeight: params[3],
    align: alignEnum[align] || 'xMidYMid',
    meetOrSlice: meetOrSliceTypes[meetOrSlice] || 0,
  };
}

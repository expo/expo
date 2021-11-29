import { NumberProp } from './types';

export default function extractPolyPoints(points: string | NumberProp[]) {
  const polyPoints = Array.isArray(points) ? points.join(',') : points;
  return polyPoints
    .replace(/[^e]-/, ' -')
    .split(/(?:\s+|\s*,\s*)/g)
    .join(' ');
}

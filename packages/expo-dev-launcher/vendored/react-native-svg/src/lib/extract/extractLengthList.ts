import { NumberProp } from './types';

const spaceReg = /\s+/;
const commaReg = /,/g;

export default function extractLengthList(
  lengthList?: NumberProp[] | NumberProp,
): NumberProp[] {
  if (Array.isArray(lengthList)) {
    return lengthList;
  } else if (typeof lengthList === 'number') {
    return [lengthList];
  } else if (typeof lengthList === 'string') {
    return lengthList
      .trim()
      .replace(commaReg, ' ')
      .split(spaceReg);
  } else {
    return [];
  }
}

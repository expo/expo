import extractBrush from './extractBrush';
import extractOpacity from './extractOpacity';
import { colorNames } from './extractColor';
import { extractedProps, FillProps } from './types';

const fillRules: { evenodd: number; nonzero: number } = {
  evenodd: 0,
  nonzero: 1,
};

const defaultFill = colorNames.black;

export default function extractFill(
  o: extractedProps,
  props: FillProps,
  inherited: string[],
) {
  const { fill, fillRule, fillOpacity } = props;
  if (fill != null) {
    inherited.push('fill');
    o.fill =
      !fill && typeof fill !== 'number' ? defaultFill : extractBrush(fill);
  }
  if (fillOpacity != null) {
    inherited.push('fillOpacity');
    o.fillOpacity = extractOpacity(fillOpacity);
  }
  if (fillRule != null) {
    inherited.push('fillRule');
    o.fillRule = fillRule && fillRules[fillRule] === 0 ? 0 : 1;
  }
}

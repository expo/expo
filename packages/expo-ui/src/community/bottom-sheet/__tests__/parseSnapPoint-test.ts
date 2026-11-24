import { parseSnapPoint } from '../types';

describe('parseSnapPoint', () => {
  it('should parse a percentage string as a fraction of container height', () => {
    expect(parseSnapPoint('25%')).toEqual({ type: 'fraction', value: 0.25 });
  });

  it('should parse a 50% snap point as half of container height', () => {
    expect(parseSnapPoint('50%')).toEqual({ type: 'fraction', value: 0.5 });
  });

  it('should parse a number as a pixel height', () => {
    expect(parseSnapPoint(200)).toEqual({ type: 'height', value: 200 });
  });

  it('should parse a numeric string without a percent suffix as a pixel height', () => {
    expect(parseSnapPoint('200')).toEqual({ type: 'height', value: 200 });
  });
});

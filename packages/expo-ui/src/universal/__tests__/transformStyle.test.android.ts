import {
  alpha,
  background,
  clickable,
  height,
  paddingAll,
  width,
} from '../../jetpack-compose/modifiers';
import { transformToModifiers } from '../transformStyle';

describe('transformToModifiers (Android)', () => {
  it('drops a style-derived modifier when the user supplies the same type', () => {
    expect(transformToModifiers({ opacity: 0.5 }, {}, [alpha(0.8)])).toEqual([alpha(0.8)]);
  });

  it('keeps style-derived modifiers of types the user did not supply', () => {
    expect(
      transformToModifiers({ backgroundColor: 'red', padding: 8 }, {}, [paddingAll(4)])
    ).toEqual([background('red'), paddingAll(4)]);
  });

  it('keeps the hidden alpha even when the user supplies an alpha modifier', () => {
    expect(transformToModifiers(undefined, { hidden: true }, [alpha(0.8)])).toEqual([
      alpha(0),
      alpha(0.8),
    ]);
  });

  it('keeps the onPress clickable when the user supplies their own clickable', () => {
    const onPress = jest.fn();
    const userClick = clickable(jest.fn());
    expect(transformToModifiers(undefined, { onPress }, [userClick])).toEqual([
      clickable(onPress),
      userClick,
    ]);
  });

  it('emits width() for a numeric width', () => {
    expect(transformToModifiers({ width: 100 }, {})).toEqual([width(100)]);
  });

  it('emits height() for a numeric height', () => {
    expect(transformToModifiers({ height: 200 }, {})).toEqual([height(200)]);
  });

  it('emits width() and height() for numeric width and height', () => {
    expect(transformToModifiers({ width: 100, height: 200 }, {})).toEqual([
      width(100),
      height(200),
    ]);
  });

  // String values are not accepted — warn in dev, emit no modifier.
  it('warns and emits no modifier for a string width', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(transformToModifiers({ width: '100%' as any }, {})).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('width does not accept string values')
    );
    warn.mockRestore();
  });

  it('warns and emits no modifier for a string height', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(transformToModifiers({ height: '100%' as any }, {})).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('height does not accept string values')
    );
    warn.mockRestore();
  });

  it('warns for string width but still emits height() when height is numeric', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(transformToModifiers({ width: 'auto' as any, height: 200 }, {})).toEqual([height(200)]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('width does not accept string values')
    );
    warn.mockRestore();
  });
});

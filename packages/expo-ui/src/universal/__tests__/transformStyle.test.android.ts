import {
  alpha,
  background,
  clickable,
  fillMaxHeight,
  fillMaxSize,
  fillMaxWidth,
  height,
  paddingAll,
  size,
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

  // Percentage width/height — these must never reach the native bridge as strings
  // because the native WidthParams/HeightParams fields expect Int and throw a
  // FieldCastException when they receive a string value.
  it('converts width "100%" to fillMaxWidth(1)', () => {
    expect(transformToModifiers({ width: '100%' }, {})).toEqual([fillMaxWidth(1)]);
  });

  it('converts height "100%" to fillMaxHeight(1)', () => {
    expect(transformToModifiers({ height: '100%' }, {})).toEqual([fillMaxHeight(1)]);
  });

  it('converts width "50%" to fillMaxWidth(0.5)', () => {
    expect(transformToModifiers({ width: '50%' }, {})).toEqual([fillMaxWidth(0.5)]);
  });

  it('converts width "100%" and height "100%" to fillMaxSize(1)', () => {
    expect(transformToModifiers({ width: '100%', height: '100%' }, {})).toEqual([fillMaxSize(1)]);
  });

  it('converts width "50%" and height "100%" to fillMaxWidth + fillMaxHeight', () => {
    expect(transformToModifiers({ width: '50%', height: '100%' }, {})).toEqual([
      fillMaxWidth(0.5),
      fillMaxHeight(1),
    ]);
  });

  it('converts width "100%" with numeric height to fillMaxWidth + height', () => {
    expect(transformToModifiers({ width: '100%', height: 200 }, {})).toEqual([
      fillMaxWidth(1),
      height(200),
    ]);
  });

  it('converts numeric width with height "100%" to width + fillMaxHeight', () => {
    expect(transformToModifiers({ width: 100, height: '100%' }, {})).toEqual([
      width(100),
      fillMaxHeight(1),
    ]);
  });

  it('keeps numeric width and height as size()', () => {
    expect(transformToModifiers({ width: 100, height: 200 }, {})).toEqual([size(100, 200)]);
  });
});

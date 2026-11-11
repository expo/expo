import type { ColorValue } from 'react-native';

import {
  background,
  border,
  contentShape,
  disabled,
  font,
  frame,
  onTapGesture,
  padding,
  shapes,
} from '../../swift-ui/modifiers';
import { transformToModifiers } from '../transformStyle';

function universalLayout(dimensions: {
  widthPoints?: number;
  widthFraction?: number;
  heightPoints?: number;
  heightFraction?: number;
}) {
  return {
    $type: 'universalLayout',
    widthPoints: undefined,
    widthFraction: undefined,
    heightPoints: undefined,
    heightFraction: undefined,
    ...dimensions,
  };
}

describe('transformToModifiers (iOS)', () => {
  it('drops a style-derived modifier when the user supplies the same type', () => {
    expect(transformToModifiers({ backgroundColor: 'red' }, {}, [background('blue')])).toEqual([
      background('blue'),
    ]);
  });

  it('keeps style-derived modifiers of types the user did not supply', () => {
    expect(
      transformToModifiers({ backgroundColor: 'red', padding: 8 }, {}, [padding({ top: 4 })])
    ).toEqual([background('red'), padding({ top: 4 })]);
  });

  it('forwards object colors untouched, so PlatformColor values survive', () => {
    const nativeColor = { semantic: ['systemBackground'] } as unknown as ColorValue;
    expect(
      transformToModifiers(
        { backgroundColor: nativeColor, borderColor: nativeColor, borderWidth: 1 },
        {}
      )
    ).toEqual([background(nativeColor), border({ content: nativeColor, width: 1 })]);
  });

  it('drops textStyle-derived modifiers the user overrides', () => {
    expect(
      transformToModifiers(undefined, {}, [font({ textStyle: 'largeTitle' })], {
        textStyle: { fontSize: 20 },
      })
    ).toEqual([font({ textStyle: 'largeTitle' })]);
  });

  it('keeps the onPress tap gesture when the user supplies their own onTapGesture', () => {
    const onPress = jest.fn();
    const userTap = onTapGesture(jest.fn());
    expect(transformToModifiers(undefined, { onPress }, [userTap])).toEqual([
      contentShape(shapes.rectangle()),
      onTapGesture(onPress),
      userTap,
    ]);
  });

  it('keeps behavior modifiers when the user supplies the same type', () => {
    expect(transformToModifiers(undefined, { disabled: true }, [disabled(false)])).toEqual([
      disabled(true),
      disabled(false),
    ]);
  });

  it('emits a fixed size as a frame and as a layout value', () => {
    expect(transformToModifiers({ width: 12, height: 8 }, {})).toEqual([
      frame({ width: 12, height: 8, alignment: undefined }),
      universalLayout({ widthPoints: 12, heightPoints: 8 }),
    ]);
  });

  it('emits a percentage as a layout value without a frame', () => {
    expect(transformToModifiers({ width: '25%' }, {})).toEqual([
      universalLayout({ widthFraction: 0.25 }),
    ]);
  });

  it('keeps the style width when a user frame sets only the height', () => {
    const userFrame = frame({ height: 12 });
    expect(transformToModifiers({ width: 30, height: 40 }, {}, [userFrame])).toEqual([
      frame({ width: 30, height: undefined, alignment: undefined }),
      universalLayout({ widthPoints: 30 }),
      userFrame,
    ]);
  });
});

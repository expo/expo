import type { ColorValue } from 'react-native';

import {
  background,
  border,
  contentShape,
  disabled,
  font,
  onTapGesture,
  padding,
  shapes,
} from '../../swift-ui/modifiers';
import { transformToModifiers } from '../transformStyle';

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

  // String dimensions are not accepted — warn in dev, emit no frame modifier.
  it('warns and emits no modifier for a string width on iOS', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(transformToModifiers({ width: '100%' as any }, {})).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('width does not accept string values')
    );
    warn.mockRestore();
  });

  it('warns and emits no modifier for a non-percentage string width on iOS', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(transformToModifiers({ width: 'auto' as any }, {})).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('width does not accept string values')
    );
    warn.mockRestore();
  });

  it('warns and emits no modifier for a string height on iOS', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(transformToModifiers({ height: '100%' as any }, {})).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('height does not accept string values')
    );
    warn.mockRestore();
  });
});

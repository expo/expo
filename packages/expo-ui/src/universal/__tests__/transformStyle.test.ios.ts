import { background, disabled, font, onTapGesture, padding } from '../../swift-ui/modifiers';
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
});

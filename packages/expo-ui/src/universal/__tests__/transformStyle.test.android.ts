import { alpha, background, clickable, paddingAll } from '../../jetpack-compose/modifiers';
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
});

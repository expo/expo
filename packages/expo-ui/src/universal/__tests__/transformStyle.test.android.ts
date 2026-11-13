import {
  alpha,
  background,
  clickable,
  height,
  paddingAll,
  size,
  weight,
  width,
} from '../../jetpack-compose/modifiers';
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

  it('emits a fixed size as size() and as parent data', () => {
    expect(transformToModifiers({ width: 12, height: 8 }, {})).toEqual([
      universalLayout({ widthPoints: 12, heightPoints: 8 }),
      size(12, 8),
    ]);
  });

  it('emits a percentage as parent data without a width modifier', () => {
    expect(transformToModifiers({ width: '50%' }, {})).toEqual([
      universalLayout({ widthFraction: 0.5 }),
    ]);
  });

  it('lets a user width replace the style width and keeps the style height', () => {
    expect(transformToModifiers({ width: '50%', height: 10 }, {}, [width(4)])).toEqual([
      universalLayout({ heightPoints: 10 }),
      height(10),
      width(4),
    ]);
  });

  it('keeps a percentage when the user modifier is weight', () => {
    expect(transformToModifiers({ height: '100%' }, {}, [weight(1)])).toEqual([
      universalLayout({ heightFraction: 1 }),
      weight(1),
    ]);
  });
});

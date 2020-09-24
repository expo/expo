import interpolate from './interpolate';
import AnimatedValue from '../core/AnimatedValue';

jest.mock('../ReanimatedEventEmitter');
jest.mock('../ReanimatedModule');

const value = new AnimatedValue(0);

it('throws if inputRange or outputRange does not contain at least 2 elements', () => {
  expect(() =>
    interpolate(value, {
      inputRange: [0],
      outputRange: [0, 1],
    })
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    interpolate(value, {
      inputRange: [0, 1],
      outputRange: [0],
    })
  ).toThrowErrorMatchingSnapshot();
});

it('throws if inputRange and outputRange are not the same length', () => {
  expect(() =>
    interpolate(value, {
      inputRange: [0, 1, 2],
      outputRange: [0, 1, 2, 3],
    })
  ).toThrowErrorMatchingSnapshot();
});

it('throws if inputRange or outputRange contains an invalid value', () => {
  expect(() =>
    interpolate(value, {
      inputRange: [0, 1, Infinity],
      outputRange: [0, 1, 2],
    })
  ).toThrowErrorMatchingSnapshot();
  expect(() =>
    interpolate(value, {
      inputRange: [0, 1, 2],
      outputRange: [0, 1, NaN],
    })
  ).toThrowErrorMatchingSnapshot();
});

it('throws if inputRange is not monotonically non-decreasing', () => {
  expect(() =>
    interpolate(value, {
      inputRange: [0, 1, 0],
      outputRange: [0, 1, 2],
    })
  ).toThrowErrorMatchingSnapshot();
});

import {
  lessThan,
  multiply,
  sub,
  add,
  divide,
  greaterThan,
  lessOrEq,
  eq,
} from '../operators';
import invariant from 'invariant';

import AnimatedNode from '../core/AnimatedNode';
import { createAnimatedCond as cond } from '../core/AnimatedCond';
import { createAnimatedFunction as proc } from '../core/AnimatedFunction';

const interpolateInternalSingleProc = proc(function (
  value,
  inS,
  inE,
  outS,
  outE
) {
  const progress = divide(sub(value, inS), sub(inE, inS));
  // logic below was made in order to provide a compatibility witn an Animated API
  const resultForNonZeroRange = add(outS, multiply(progress, sub(outE, outS)));
  const result = cond(
    eq(inS, inE),
    cond(lessOrEq(value, inS), outS, outE),
    resultForNonZeroRange
  );
  return result;
});

function interpolateInternalSingle(value, inputRange, outputRange, offset) {
  const inS = inputRange[offset];
  const inE = inputRange[offset + 1];
  const outS = outputRange[offset];
  const outE = outputRange[offset + 1];
  return interpolateInternalSingleProc(value, inS, inE, outS, outE);
}

function interpolateInternal(value, inputRange, outputRange, offset = 0) {
  if (inputRange.length - offset === 2) {
    return interpolateInternalSingle(value, inputRange, outputRange, offset);
  }
  return cond(
    lessThan(value, inputRange[offset + 1]),
    interpolateInternalSingle(value, inputRange, outputRange, offset),
    interpolateInternal(value, inputRange, outputRange, offset + 1)
  );
}

export const Extrapolate = {
  EXTEND: 'extend',
  CLAMP: 'clamp',
  IDENTITY: 'identity',
};

function checkNonDecreasing(name, arr) {
  for (let i = 1; i < arr.length; ++i) {
    // We can't validate animated nodes in JS.
    if (arr[i] instanceof AnimatedNode || arr[i - 1] instanceof AnimatedNode)
      continue;
    invariant(
      arr[i] >= arr[i - 1],
      '%s must be monotonically non-decreasing. (%s)',
      name,
      arr
    );
  }
}

function checkMinElements(name, arr) {
  invariant(
    arr.length >= 2,
    '%s must have at least 2 elements. (%s)',
    name,
    arr
  );
}

function checkValidNumbers(name, arr) {
  for (let i = 0; i < arr.length; i++) {
    // We can't validate animated nodes in JS.
    if (arr[i] instanceof AnimatedNode || typeof arr[i] !== 'number') continue;
    invariant(
      Number.isFinite(arr[i]),
      '%s cannot include %s. (%s)',
      name,
      arr[i],
      arr
    );
  }
}

function convertToRadians(outputRange) {
  for (const [i, value] of outputRange.entries()) {
    if (typeof value === 'string' && value.endsWith('deg')) {
      outputRange[i] = parseFloat(value) * (Math.PI / 180);
    } else if (typeof value === 'string' && value.endsWith('rad')) {
      outputRange[i] = parseFloat(value);
    }
  }
}

export default function interpolate(value, config) {
  const {
    inputRange,
    outputRange,
    extrapolate = Extrapolate.EXTEND,
    extrapolateLeft,
    extrapolateRight,
  } = config;

  checkMinElements('inputRange', inputRange);
  checkValidNumbers('inputRange', inputRange);
  checkMinElements('outputRange', outputRange);
  checkValidNumbers('outputRange', outputRange);
  checkNonDecreasing('inputRange', inputRange);
  invariant(
    inputRange.length === outputRange.length,
    'inputRange and outputRange must be the same length.'
  );

  convertToRadians(outputRange);
  const left = extrapolateLeft || extrapolate;
  const right = extrapolateRight || extrapolate;
  let output = interpolateInternal(value, inputRange, outputRange);

  if (left === Extrapolate.CLAMP) {
    output = cond(lessThan(value, inputRange[0]), outputRange[0], output);
  } else if (left === Extrapolate.IDENTITY) {
    output = cond(lessThan(value, inputRange[0]), value, output);
  }

  if (right === Extrapolate.CLAMP) {
    output = cond(
      greaterThan(value, inputRange[inputRange.length - 1]),
      outputRange[outputRange.length - 1],
      output
    );
  } else if (right === Extrapolate.IDENTITY) {
    output = cond(
      greaterThan(value, inputRange[inputRange.length - 1]),
      value,
      output
    );
  }

  return output;
}

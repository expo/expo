import { AbortSignal } from 'abort-controller';
import fetch from 'node-fetch';

import makeInterruptible from '../makeInterruptible';

it(`caller calls the generator function`, async () => {
  let hasBeenCalled = false;
  const [caller] = makeInterruptible(function*() {
    hasBeenCalled = true;
  });
  await caller();
  expect(hasBeenCalled).toBe(true);
});

it(`hasBeenCalled returns true if caller has been called`, async () => {
  const [caller, hasBeenCalled] = makeInterruptible(function*() {});
  caller();
  expect(hasBeenCalled()).toBe(true);
});

it(`hasBeenCalled returns false if caller has not been called`, async () => {
  const [, hasBeenCalled] = makeInterruptible(function*() {});
  expect(hasBeenCalled()).toBe(false);
});

it(`awaits the result of the generator func`, async () => {
  let hasFinished = false;
  const [caller] = makeInterruptible(function*() {
    yield new Promise(resolve => setTimeout(resolve, 100));
    hasFinished = true;
  });
  await caller();
  expect(hasFinished).toBe(true);
});

it(`returns the result of a synchronous generator func`, async () => {
  const expectedResultValue = 42;
  const [caller] = makeInterruptible(function*() {
    return expectedResultValue;
  });
  expect(await caller()).toBe(expectedResultValue);
});

it(`interrupts the call if interrupt is called`, async () => {
  let hasStarted = false;
  let hasFinished = false;
  const [caller, , interrupt] = makeInterruptible(function*() {
    hasStarted = true;
    yield new Promise(resolve => setTimeout(resolve, 200));
    hasFinished = true;
  });
  // We start the call
  caller();
  // and interrupt
  interrupt();
  // Wait for caller call to finish (it won't, but without
  // this delay the test wouldn't make sense)
  await new Promise(resolve => setTimeout(resolve, 500));
  expect(hasStarted).toBe(true);
  expect(hasFinished).toBe(false);
});

it(`interrupts the call automatically if another call occurs`, async () => {
  const startTimes: Date[] = [];
  const finishTimes: Date[] = [];
  const [caller] = makeInterruptible(function*() {
    startTimes.push(new Date());
    yield new Promise(resolve => setTimeout(resolve, 100));
    finishTimes.push(new Date());
  });
  // We start the call
  caller();
  await new Promise(resolve => setTimeout(resolve, 50));
  // and another one
  caller();
  // Wait for calls to finish
  await new Promise(resolve => setTimeout(resolve, 500));
  expect(startTimes.length).toBe(2); // Two callers start
  expect(finishTimes.length).toBe(1); // but only one finishes
});

it(`allows fetch interruption`, async () => {
  const [caller, , interrupt] = makeInterruptible(function*(signal: AbortSignal) {
    yield fetch('https://expo.io/', {
      signal,
    });
  });
  let error: Error | null = null;
  try {
    setTimeout(interrupt, 5);
    await caller();
  } catch (e) {
    error = e;
  }
  expect(error).not.toBeNull();
});

import generateRetries from '../generateRetries';
import makeInterruptible from '../makeInterruptible';

it(`calls the function immediately`, async () => {
  let hasCalled = false;
  const retriesIterator = generateRetries(async () => {
    hasCalled = true;
  });
  retriesIterator.next();
  expect(hasCalled).toBe(true);
});

it(`doesn't call the function second time if retry is not called`, async () => {
  let callsCount = 0;
  const retriesIterator = generateRetries(async () => {
    callsCount += 1;
  });
  let result = await retriesIterator.next();
  while (!result.done) {
    result = await retriesIterator.next();
  }
  expect(callsCount).toBe(1);
});

it(`does call the function second time if retry is called`, async () => {
  let callsCount = 0;
  const retriesIterator = generateRetries(
    async retry => {
      if (callsCount < 1) {
        retry();
      }
      callsCount += 1;
    },
    { initialDelay: 0 }
  );
  let result = await retriesIterator.next();
  while (!result.done) {
    result = await retriesIterator.next();
  }
  expect(callsCount).toBe(2);
});

it(`increases the delay on each retry`, async () => {
  const callTimes: Date[] = [];
  const exponentialFactor = 2;
  const retriesIterator = generateRetries(
    async retry => {
      callTimes.push(new Date());
      if (callTimes.length < 4) {
        retry();
      }
    },
    { initialDelay: 50, exponentialFactor }
  );
  while (!(await retriesIterator.next()).done) {
    // do nothing, we don't care about yielded values
    // we just want to exhaust the generator
  }
  for (let i = 0; i < callTimes.length - 2; i += 1) {
    const distanceBetweenThirdAndSecond = callTimes[i + 2].getTime() - callTimes[i + 1].getTime();
    const distanceBetweenSecondAndFirst = callTimes[i + 1].getTime() - callTimes[i].getTime();
    const calculatedDistanceFactor = distanceBetweenThirdAndSecond / distanceBetweenSecondAndFirst;
    // We're using this manual `toBeCloseTo` due to flakiness of scheduling
    expect(Math.abs(calculatedDistanceFactor - exponentialFactor)).toBeLessThan(0.15);
  }
});

it(`honors exponentialFactor option`, async () => {
  const callTimes: Date[] = [];
  const exponentialFactor = 1;
  const retriesIterator = generateRetries(
    async retry => {
      callTimes.push(new Date());
      if (callTimes.length < 4) {
        retry();
      }
    },
    { initialDelay: 100, exponentialFactor }
  );
  while (!(await retriesIterator.next()).done) {
    // do nothing
  }
  for (let i = 0; i < callTimes.length - 2; i += 1) {
    const distanceBetweenThirdAndSecond = callTimes[i + 2].getTime() - callTimes[i + 1].getTime();
    const distanceBetweenSecondAndFirst = callTimes[i + 1].getTime() - callTimes[i].getTime();
    const calculatedDistanceFactor = distanceBetweenThirdAndSecond / distanceBetweenSecondAndFirst;
    // We're using this manual `toBeCloseTo` due to flakiness of scheduling
    expect(Math.abs(calculatedDistanceFactor - exponentialFactor)).toBeLessThan(0.15);
  }
});

it(`handles asynchronous functions`, async () => {
  const callTimes: Date[] = [];
  const exponentialFactor = 1;
  const innerDelay = 50;
  const retriesIterator = generateRetries(
    async retry => {
      callTimes.push(new Date());
      await new Promise(resolve => setTimeout(resolve, innerDelay));
      if (callTimes.length < 4) {
        retry();
      }
    },
    { initialDelay: 50, exponentialFactor }
  );
  while (!(await retriesIterator.next()).done) {
    // do nothing
  }
  for (let i = 0; i < callTimes.length - 2; i += 1) {
    const distanceBetweenThirdAndSecond =
      callTimes[i + 2].getTime() - callTimes[i + 1].getTime() - innerDelay;
    const distanceBetweenSecondAndFirst =
      callTimes[i + 1].getTime() - callTimes[i].getTime() - innerDelay;
    const calculatedDistanceFactor = distanceBetweenThirdAndSecond / distanceBetweenSecondAndFirst;
    // We're using this manual `toBeCloseTo` due to flakiness of scheduling
    expect(Math.abs(calculatedDistanceFactor - exponentialFactor)).toBeLessThan(0.15);
  }
});

it(`returns what retried function returns`, async () => {
  let callsCount = 0;
  const exponentialFactor = 1;
  const innerDelay = 50;
  const retriesIterator = generateRetries(
    async retry => {
      callsCount += 1;
      await new Promise(resolve => setTimeout(resolve, innerDelay));
      if (callsCount < 3) {
        retry();
      }
      return new Date();
    },
    { initialDelay: 50, exponentialFactor }
  );
  let result = await retriesIterator.next();
  while (!result.done) {
    result = await retriesIterator.next(result.value);
  }
  expect(result.value).toBeInstanceOf(Date);
});

it(`is interruptible by makeInterruptible`, async () => {
  const retryingFunctionCallTimes: Date[] = [];
  const [caller, , abort] = makeInterruptible(async function*() {
    const retryingIterator = generateRetries(
      async retry => {
        retryingFunctionCallTimes.push(new Date());
        retry();
      },
      {
        initialDelay: 50,
        exponentialFactor: 1,
      }
    );
    let result = (yield retryingIterator.next()) as IteratorResult<void, void>;
    while (!result.done) {
      // We specifically want to yield the result here
      // to the calling function so that call to this generator
      // may be interrupted between retries.
      result = (yield retryingIterator.next()) as IteratorResult<void, void>;
    }
  });
  caller();
  await new Promise(resolve => setTimeout(resolve, 200));
  abort();
  await new Promise(resolve => setTimeout(resolve, 200));
  expect(retryingFunctionCallTimes.length).toBe(4);
});

import { computeNextBackoffInterval } from '../backoff';

it('computes exponential backoff', () => {
  expect(computeNextBackoffInterval(1, 0, { multiplier: 2, randomizationFactor: 0 })).toBe(1);
  expect(computeNextBackoffInterval(1, 1, { multiplier: 2, randomizationFactor: 0 })).toBe(2);
  expect(computeNextBackoffInterval(1, 2, { multiplier: 2, randomizationFactor: 0 })).toBe(4);
});

it('applies random jitter', () => {
  for (let i = 0; i < 10; i++) {
    const backoff = computeNextBackoffInterval(1, 2, { multiplier: 2, randomizationFactor: 0.5 });
    expect(backoff).toBeGreaterThanOrEqual(2);
    expect(backoff).toBeLessThanOrEqual(6);
  }
});

it('supports constant backoff with a multiplier of one', () => {
  expect(computeNextBackoffInterval(1, 0, { multiplier: 1, randomizationFactor: 0 })).toBe(1);
  expect(computeNextBackoffInterval(1, 1, { multiplier: 1, randomizationFactor: 0 })).toBe(1);
  expect(computeNextBackoffInterval(1, 2, { multiplier: 1, randomizationFactor: 0 })).toBe(1);
});

it('honors a minimum backoff interval', () => {
  const minBackoff = 2;
  expect(computeNextBackoffInterval(1, 0, { minBackoff })).toBe(minBackoff);
});

it('honors a maximum backoff interval', () => {
  const maxBackoff = 30;
  expect(computeNextBackoffInterval(1, 10, { maxBackoff })).toBe(maxBackoff);
});

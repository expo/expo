export function getWindow(
  count: number,
  first: number,
  last: number,
  overscanCount: number,
  minCapacity = 0
) {
  if (count === 0) return { start: 0, capacity: 0 };
  first = Math.max(0, Math.min(first, count - 1));
  last = Math.max(first, Math.min(last, count - 1));
  const start = Math.max(0, first - overscanCount);
  const end = Math.min(count, last + 1 + overscanCount);
  // Never shrink the pool: a stable capacity keeps `index % capacity` slot assignments stable.
  // Grow it with headroom, because every growth re-renders the whole pool.
  const needed = end - start;
  let capacity = minCapacity;
  if (needed > capacity) capacity = capacity === 0 ? needed : needed + overscanCount;
  capacity = Math.min(count, capacity);
  return { start: Math.min(start, count - capacity), capacity };
}

export function getSlotIndices(start: number, capacity: number): number[] {
  if (capacity === 0) return [];
  return Array.from(
    { length: capacity },
    (_, slot) => start + ((slot - (start % capacity) + capacity) % capacity)
  );
}

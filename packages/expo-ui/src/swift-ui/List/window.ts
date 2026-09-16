export function getWindow(count: number, first: number, last: number, overscanCount: number) {
  if (count === 0) return { start: 0, capacity: 0 };
  first = Math.max(0, Math.min(first, count - 1));
  last = Math.max(first, Math.min(last, count - 1));
  const start = Math.max(0, first - overscanCount);
  const end = Math.min(count, last + 1 + overscanCount);
  return { start, capacity: end - start };
}

export function getSlotIndices(start: number, capacity: number): number[] {
  if (capacity === 0) return [];
  return Array.from(
    { length: capacity },
    (_, slot) => start + ((slot - (start % capacity) + capacity) % capacity)
  );
}

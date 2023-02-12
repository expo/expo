// TODO(TS) remove if not necessary after rewrite
export const isnan = (v: unknown) => Number.isNaN(v);

// TODO(TS) remove if not necessary after rewrite
export const isValidNumber = (v: unknown) =>
  typeof v === 'number' && !Number.isNaN(v);

export const TEST_MIN_IF_NOT_NAN = (value: number, limit: number): boolean =>
  !isnan(limit) &&
  ((limit < 0 && value <= limit) || (limit >= 0 && value >= limit));
export const VEC_LEN_SQ = ({ x = 0, y = 0 } = {}) => x * x + y * y;
export const TEST_MAX_IF_NOT_NAN = (value: number, max: number) =>
  !isnan(max) && ((max < 0 && value < max) || (max >= 0 && value > max));

export function fireAfterInterval(
  method: () => void,
  interval?: number | boolean
) {
  if (!interval) {
    method();
    return null;
  }
  return setTimeout(() => method(), interval);
}

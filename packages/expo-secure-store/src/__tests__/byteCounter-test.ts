import { byteCountOverLimit, VALUE_BYTES_LIMIT } from '../byteCounter';

describe('byteCountOverLimit', () => {
  const cases = [
    ['an empty string', '', false],
    ['a simple string', 'hello', false],
    ['a string at limit', 'a'.repeat(2048), false],
    ['a string just over the limit', 'a'.repeat(2049), true],
    ['a string with multi-byte characters', '☃'.repeat(682), false], // Each snowman (☃) is 3 bytes
    ['a string just over with multi-byte characters', '☃'.repeat(683), true], // 683 snowmen (2049 bytes)
  ] as const;

  test.each(cases)('should return %p for input nr %#', (_, input, expected) => {
    expect(byteCountOverLimit(input, VALUE_BYTES_LIMIT)).toBe(expected);
  });
});

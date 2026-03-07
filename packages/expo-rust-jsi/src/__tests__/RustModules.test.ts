/**
 * Integration test for Rust modules exposed via JSI.
 *
 * Run this on a device/simulator where the native modules are loaded.
 * These tests verify that the Rust functions are callable from JS and
 * return correct values.
 */
import { RustMath, RustString } from '..';

describe('RustMath module', () => {
  // Constants
  test('PI constant is defined', () => {
    expect(RustMath.PI).toBeCloseTo(Math.PI, 10);
  });

  test('E constant is defined', () => {
    expect(RustMath.E).toBeCloseTo(Math.E, 10);
  });

  test('TAU constant is defined', () => {
    expect(RustMath.TAU).toBeCloseTo(2 * Math.PI, 10);
  });

  // Arithmetic
  test('add returns correct sum', () => {
    expect(RustMath.add(2, 3)).toBe(5);
    expect(RustMath.add(-1, 1)).toBe(0);
    expect(RustMath.add(0.1, 0.2)).toBeCloseTo(0.3);
  });

  test('subtract returns correct difference', () => {
    expect(RustMath.subtract(5, 3)).toBe(2);
    expect(RustMath.subtract(3, 5)).toBe(-2);
  });

  test('multiply returns correct product', () => {
    expect(RustMath.multiply(4, 5)).toBe(20);
    expect(RustMath.multiply(-2, 3)).toBe(-6);
  });

  test('divide returns correct quotient', () => {
    expect(RustMath.divide(10, 2)).toBe(5);
    expect(RustMath.divide(7, 2)).toBe(3.5);
  });

  test('divide by zero throws an error', () => {
    expect(() => RustMath.divide(1, 0)).toThrow();
  });

  // Math functions
  test('sqrt returns correct value', () => {
    expect(RustMath.sqrt(16)).toBe(4);
    expect(RustMath.sqrt(2)).toBeCloseTo(Math.SQRT2);
  });

  test('pow returns correct value', () => {
    expect(RustMath.pow(2, 10)).toBe(1024);
    expect(RustMath.pow(3, 0)).toBe(1);
  });

  test('abs returns absolute value', () => {
    expect(RustMath.abs(-5)).toBe(5);
    expect(RustMath.abs(5)).toBe(5);
  });

  test('sin and cos return correct values', () => {
    expect(RustMath.sin(0)).toBe(0);
    expect(RustMath.cos(0)).toBe(1);
    expect(RustMath.sin(RustMath.PI / 2)).toBeCloseTo(1);
  });

  test('fibonacci returns correct values', () => {
    expect(RustMath.fibonacci(0)).toBe(0);
    expect(RustMath.fibonacci(1)).toBe(1);
    expect(RustMath.fibonacci(10)).toBe(55);
    expect(RustMath.fibonacci(20)).toBe(6765);
  });

  test('clamp constrains values', () => {
    expect(RustMath.clamp(5, 0, 10)).toBe(5);
    expect(RustMath.clamp(-5, 0, 10)).toBe(0);
    expect(RustMath.clamp(15, 0, 10)).toBe(10);
  });
});

describe('RustString module', () => {
  test('to_upper_case converts to uppercase', () => {
    expect(RustString.to_upper_case('hello')).toBe('HELLO');
    expect(RustString.to_upper_case('')).toBe('');
  });

  test('to_lower_case converts to lowercase', () => {
    expect(RustString.to_lower_case('HELLO')).toBe('hello');
  });

  test('reverse reverses a string', () => {
    expect(RustString.reverse('hello')).toBe('olleh');
    expect(RustString.reverse('')).toBe('');
    expect(RustString.reverse('a')).toBe('a');
  });

  test('length returns string length', () => {
    expect(RustString.length('hello')).toBe(5);
    expect(RustString.length('')).toBe(0);
  });

  test('contains checks for substring', () => {
    expect(RustString.contains('hello world', 'world')).toBe(true);
    expect(RustString.contains('hello world', 'xyz')).toBe(false);
  });

  test('repeat repeats a string', () => {
    expect(RustString.repeat('ab', 3)).toBe('ababab');
    expect(RustString.repeat('x', 0)).toBe('');
  });

  test('simple_hash returns consistent hex string', () => {
    const hash1 = RustString.simple_hash('hello');
    const hash2 = RustString.simple_hash('hello');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{16}$/);

    // Different input should produce different hash
    const hash3 = RustString.simple_hash('world');
    expect(hash3).not.toBe(hash1);
  });
});

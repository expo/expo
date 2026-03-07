import { requireNativeModule } from 'expo-modules-core';

/**
 * RustMath — a math module implemented in Rust, exposed directly via JSI.
 *
 * Usage:
 * ```ts
 * import { RustMath } from 'expo-rust-jsi';
 * console.log(RustMath.add(2, 3)); // 5
 * ```
 */
interface RustMathModule {
  // Constants
  readonly PI: number;
  readonly E: number;
  readonly TAU: number;

  // Functions (names match Rust snake_case identifiers)
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
  multiply(a: number, b: number): number;
  divide(a: number, b: number): number;
  sqrt(x: number): number;
  pow(base: number, exp: number): number;
  abs(x: number): number;
  sin(x: number): number;
  cos(x: number): number;
  fibonacci(n: number): number;
  clamp(value: number, min: number, max: number): number;
}

export const RustMath = requireNativeModule<RustMathModule>('RustMath');

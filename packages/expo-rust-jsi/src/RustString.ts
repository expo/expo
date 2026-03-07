import { requireNativeModule } from 'expo-modules-core';

/**
 * RustString — a string utilities module implemented in Rust, exposed via JSI.
 *
 * Usage:
 * ```ts
 * import { RustString } from 'expo-rust-jsi';
 * console.log(RustString.to_upper_case('hello')); // 'HELLO'
 * ```
 */
interface RustStringModule {
  // Function names match Rust snake_case identifiers
  to_upper_case(s: string): string;
  to_lower_case(s: string): string;
  reverse(s: string): string;
  length(s: string): number;
  contains(haystack: string, needle: string): boolean;
  repeat(s: string, n: number): string;
  simple_hash(s: string): string;

  // Record-based function (accepts a typed JS object)
  format_text(opts: {
    text: string;
    uppercase?: boolean;
    repeat_count?: number;
    separator?: string;
  }): string;
}

export const RustString = requireNativeModule<RustStringModule>('RustString');

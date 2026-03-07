// Example: A math module written in Rust, exposed directly to JS via JSI.
//
// From JavaScript:
//   import { requireNativeModule } from 'expo-modules-core';
//   const RustMath = requireNativeModule('RustMath');
//
//   console.log(RustMath.PI);              // 3.141592653589793
//   console.log(RustMath.add(2, 3));       // 5
//   console.log(RustMath.multiply(4, 5));  // 20
//   console.log(RustMath.sqrt(16));        // 4
//   console.log(RustMath.fibonacci(10));   // 55

use crate::prelude::*;

pub struct MathModule;

#[expo_module("RustMath")]
impl MathModule {
    #[constant]
    const PI: f64 = std::f64::consts::PI;

    #[constant]
    const E: f64 = std::f64::consts::E;

    #[constant]
    const TAU: f64 = std::f64::consts::TAU;

    fn add(a: f64, b: f64) -> f64 {
        a + b
    }

    fn subtract(a: f64, b: f64) -> f64 {
        a - b
    }

    fn multiply(a: f64, b: f64) -> f64 {
        a * b
    }

    fn divide(a: f64, b: f64) -> Result<f64, ExpoError> {
        if b == 0.0 {
            Err(ExpoError::new("ERR_DIVIDE_BY_ZERO", "Cannot divide by zero"))
        } else {
            Ok(a / b)
        }
    }

    fn sqrt(x: f64) -> f64 {
        x.sqrt()
    }

    fn pow(base: f64, exp: f64) -> f64 {
        base.powf(exp)
    }

    fn abs(x: f64) -> f64 {
        x.abs()
    }

    fn sin(x: f64) -> f64 {
        x.sin()
    }

    fn cos(x: f64) -> f64 {
        x.cos()
    }

    fn fibonacci(n: i32) -> f64 {
        fn fib(n: i32) -> i64 {
            if n <= 1 {
                return n as i64;
            }
            let mut a: i64 = 0;
            let mut b: i64 = 1;
            for _ in 2..=n {
                let tmp = a + b;
                a = b;
                b = tmp;
            }
            b
        }
        fib(n) as f64
    }

    fn clamp(value: f64, min: f64, max: f64) -> f64 {
        value.max(min).min(max)
    }

    fn sum5(a: f64, b: f64, c: f64, d: f64, e: f64) -> f64 {
        a + b + c + d + e
    }

    #[async_fn]
    fn factorial(n: f64) -> f64 {
        let n = n as u64;
        (1..=n).product::<u64>() as f64
    }

    #[async_fn]
    fn is_prime(n: f64) -> bool {
        let n = n as u64;
        if n < 2 { return false; }
        if n < 4 { return true; }
        if n % 2 == 0 || n % 3 == 0 { return false; }
        let mut i = 5u64;
        while i * i <= n {
            if n % i == 0 || n % (i + 2) == 0 { return false; }
            i += 6;
        }
        true
    }
}

pub struct StringModule;

#[expo_module("RustString")]
impl StringModule {
    fn to_upper_case(s: String) -> String {
        s.to_uppercase()
    }

    fn to_lower_case(s: String) -> String {
        s.to_lowercase()
    }

    fn reverse(s: String) -> String {
        s.chars().rev().collect()
    }

    fn length(s: String) -> f64 {
        s.len() as f64
    }

    fn contains(haystack: String, needle: String) -> bool {
        haystack.contains(&needle)
    }

    fn repeat(s: String, n: i32) -> String {
        s.repeat(n.max(0) as usize)
    }

    fn simple_hash(s: String) -> String {
        // Simple FNV-1a hash for demonstration
        let mut hash: u64 = 0xcbf29ce484222325;
        for byte in s.bytes() {
            hash ^= byte as u64;
            hash = hash.wrapping_mul(0x100000001b3);
        }
        format!("{:016x}", hash)
    }
}

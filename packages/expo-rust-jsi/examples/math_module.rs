//! Example: A math module written in Rust, exposed directly to JS via JSI.
//!
//! From JavaScript:
//! ```js
//! import { requireNativeModule } from 'expo-modules-core';
//! const RustMath = requireNativeModule('RustMath');
//!
//! console.log(RustMath.PI);              // 3.141592653589793
//! console.log(RustMath.add(2, 3));       // 5
//! console.log(RustMath.multiply(4, 5));  // 20
//! console.log(RustMath.sqrt(16));        // 4
//! console.log(RustMath.fibonacci(10));   // 55
//! ```

use crate::prelude::*;

pub struct MathModule;

impl ExpoModule for MathModule {
    fn definition() -> ModuleDefinition {
        ModuleBuilder::new("RustMath")
            // Constants
            .constant("PI", std::f64::consts::PI)
            .constant("E", std::f64::consts::E)
            .constant("TAU", std::f64::consts::TAU)
            // Sync functions with typed parameters
            .sync_fn_2::<f64, f64, f64, _>("add", |a, b| a + b)
            .sync_fn_2::<f64, f64, f64, _>("subtract", |a, b| a - b)
            .sync_fn_2::<f64, f64, f64, _>("multiply", |a, b| a * b)
            .sync_fn_2::<f64, f64, f64, _>("divide", |a, b| {
                if b == 0.0 {
                    f64::NAN
                } else {
                    a / b
                }
            })
            .sync_fn_1::<f64, f64, _>("sqrt", |x| x.sqrt())
            .sync_fn_2::<f64, f64, f64, _>("pow", |base, exp| base.powf(exp))
            .sync_fn_1::<f64, f64, _>("abs", |x| x.abs())
            .sync_fn_1::<f64, f64, _>("sin", |x| x.sin())
            .sync_fn_1::<f64, f64, _>("cos", |x| x.cos())
            // Fibonacci - showcasing Rust's performance for compute-heavy tasks
            .sync_fn_1::<i32, f64, _>("fibonacci", |n| {
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
            })
            // Clamp
            .sync_fn_3::<f64, f64, f64, f64, _>("clamp", |value, min, max| {
                value.max(min).min(max)
            })
            .build()
    }
}

pub struct StringModule;

impl ExpoModule for StringModule {
    fn definition() -> ModuleDefinition {
        ModuleBuilder::new("RustString")
            .sync_fn_1::<String, String, _>("toUpperCase", |s| s.to_uppercase())
            .sync_fn_1::<String, String, _>("toLowerCase", |s| s.to_lowercase())
            .sync_fn_1::<String, String, _>("reverse", |s| {
                s.chars().rev().collect()
            })
            .sync_fn_1::<String, f64, _>("length", |s| s.len() as f64)
            .sync_fn_2::<String, String, bool, _>("contains", |haystack, needle| {
                haystack.contains(&needle)
            })
            .sync_fn_2::<String, i32, String, _>("repeat", |s, n| {
                s.repeat(n.max(0) as usize)
            })
            // SHA-256 hash (simplified - real impl would use a crypto crate)
            .sync_fn_1::<String, String, _>("simpleHash", |s| {
                // Simple FNV-1a hash for demonstration
                let mut hash: u64 = 0xcbf29ce484222325;
                for byte in s.bytes() {
                    hash ^= byte as u64;
                    hash = hash.wrapping_mul(0x100000001b3);
                }
                format!("{:016x}", hash)
            })
            .build()
    }
}

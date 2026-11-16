// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

/// Umbrella suite for the ExpoModulesCore benchmarks; the other files in this directory extend it.
///
/// The benchmarks are the `Benchmarks` test spec of the pod, separate from the unit tests. Build them in
/// the Release configuration, so the numbers reflect optimized code. Each case prints one `[benchmark]`
/// line with the median and minimum ns/op.
///
/// The suite is serialized so only one benchmark runs at a time: the `JavaScriptActor` executor runs
/// jobs synchronously on the calling thread, so cases running in parallel would disturb each other's
/// measurements.
@Suite(.serialized)
struct Benchmarks {}

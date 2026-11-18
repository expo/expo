// Copyright 2026-present 650 Industries. All rights reserved.

#include "HermesRuntime.h"

#include <hermes/hermes.h>

namespace expo {

jsi::Runtime *createHermesRuntime() {
  // The config React Native uses for its bridgeless runtime (`HermesInstance::createJSRuntime`), so
  // code runs on a standalone runtime as it does in an app. Most importantly, promise jobs go to the
  // native microtask queue, which the host drains with `drainMicrotasks` after each task. React Native's
  // 3 GB max heap is the Hermes default, so it isn't set here. Sample profiling is left out: nothing
  // samples a standalone runtime, and it may cost about 1% in benchmarks.
  auto gcConfig = ::hermes::vm::GCConfig::Builder()
                      .withName("ExpoStandalone")
                      .build();
  auto runtimeConfig = ::hermes::vm::RuntimeConfig::Builder()
                           .withGCConfig(gcConfig)
                           .withMicrotaskQueue(true)
                           .build();

  std::unique_ptr<facebook::hermes::HermesRuntime> runtimePtr = facebook::hermes::makeHermesRuntime(runtimeConfig);
  return runtimePtr.release();
}

} // namespace expo

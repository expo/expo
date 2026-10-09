// Copyright 2026-present 650 Industries. All rights reserved.

/// Whether the tests run on Windows, where the standalone runtime is the one react-native-windows
/// builds on top of `hermes.dll`. A few tests are known to hang or crash with it and are disabled there.
let isWindows: Bool = {
  #if os(Windows)
  return true
  #else
  return false
  #endif
}()

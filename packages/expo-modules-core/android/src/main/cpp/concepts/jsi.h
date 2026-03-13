// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <concepts>
#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

template<typename T>
concept TriviallyConvertibleToJSI = std::is_constructible_v<jsi::Value, T>;

template<typename T>
concept ConvertibleToJSI =
  std::is_constructible_v<jsi::Value, jsi::Runtime &, T> &&
  !std::is_constructible_v<jsi::Value, T>;

} // namespace expo

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <ReactABI34_0_0/core/RawProps.h>
#include <ReactABI34_0_0/graphics/Color.h>
#include <ReactABI34_0_0/graphics/Geometry.h>
#include <ReactABI34_0_0/graphics/conversions.h>

namespace facebook {
namespace ReactABI34_0_0 {

template <typename T>
void fromRawValue(const RawValue &rawValue, T &result) {
  result = (T)rawValue;
}

template <typename T>
void fromRawValue(const RawValue &rawValue, std::vector<T> &result) {
  if (rawValue.hasType<std::vector<RawValue>>()) {
    auto items = (std::vector<RawValue>)rawValue;
    auto length = items.size();
    result.clear();
    result.reserve(length);
    for (int i = 0; i < length; i++) {
      T itemResult;
      fromRawValue(items.at(i), itemResult);
      result.push_back(itemResult);
    }
    return;
  }

  // The case where `value` is not an array.
  result.clear();
  result.reserve(1);
  T itemResult;
  fromRawValue(rawValue, itemResult);
  result.push_back(itemResult);
}

template <typename T>
T convertRawProp(
    const RawProps &rawProps,
    const std::string &name,
    const T &sourceValue,
    const T &defaultValue = T()) {
  const auto rawValue = rawProps.at(name);

  if (!rawValue) {
    return sourceValue;
  }

  // Special case: `null` always means `the prop was removed, use default
  // value`.
  if (!rawValue->hasValue()) {
    return defaultValue;
  }

  T result;
  fromRawValue(*rawValue, result);
  return result;
}

template <typename T>
static folly::Optional<T> convertRawProp(
    const RawProps &rawProps,
    const std::string &name,
    const folly::Optional<T> &sourceValue,
    const folly::Optional<T> &defaultValue = {}) {
  const auto rawValue = rawProps.at(name);

  if (!rawValue) {
    return sourceValue;
  }

  // Special case: `null` always means `the prop was removed, use default
  // value`.
  if (!rawValue->hasValue()) {
    return defaultValue;
  }

  T result;
  fromRawValue(*rawValue, result);
  return folly::Optional<T>{result};
}

} // namespace ReactABI34_0_0
} // namespace facebook

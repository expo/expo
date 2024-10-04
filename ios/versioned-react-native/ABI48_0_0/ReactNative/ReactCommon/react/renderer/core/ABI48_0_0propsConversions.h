/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <folly/Likely.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/PropsParserContext.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/RawProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/RawPropsKey.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Color.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Geometry.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/conversions.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/**
 * Use this only when a prop update has definitely been sent from JS;
 * essentially, cases where rawValue is virtually guaranteed to not be a
 * nullptr.
 */
template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    T &result,
    T defaultValue) {
  if (!rawValue.hasValue()) {
    result = std::move(defaultValue);
    return;
  }

  fromRawValue(context, rawValue, result);
}

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    T &result) {
  result = (T)rawValue;
}

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    std::optional<T> &result) {
  T resultValue;
  fromRawValue(context, rawValue, resultValue);
  result = std::optional<T>{std::move(resultValue)};
}

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    std::vector<T> &result) {
  if (rawValue.hasType<std::vector<RawValue>>()) {
    auto items = (std::vector<RawValue>)rawValue;
    auto length = items.size();
    result.clear();
    result.reserve(length);
    for (size_t i = 0; i < length; i++) {
      T itemResult;
      fromRawValue(context, items.at(i), itemResult);
      result.push_back(itemResult);
    }
    return;
  }

  // The case where `value` is not an array.
  result.clear();
  result.reserve(1);
  T itemResult;
  fromRawValue(context, rawValue, itemResult);
  result.push_back(itemResult);
}

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    std::vector<std::vector<T>> &result) {
  if (rawValue.hasType<std::vector<std::vector<RawValue>>>()) {
    auto items = (std::vector<std::vector<RawValue>>)rawValue;
    auto length = items.size();
    result.clear();
    result.reserve(length);
    for (int i = 0; i < length; i++) {
      T itemResult;
      fromRawValue(context, items.at(i), itemResult);
      result.push_back(itemResult);
    }
    return;
  }

  // The case where `value` is not an array.
  result.clear();
  result.reserve(1);
  T itemResult;
  fromRawValue(context, rawValue, itemResult);
  result.push_back(itemResult);
}

template <typename T, typename U = T>
T convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *name,
    T const &sourceValue,
    U const &defaultValue,
    char const *namePrefix = nullptr,
    char const *nameSuffix = nullptr) {
  const auto *rawValue = rawProps.at(name, namePrefix, nameSuffix);
  if (LIKELY(rawValue == nullptr)) {
    return sourceValue;
  }

  // Special case: `null` always means "the prop was removed, use default
  // value".
  if (UNLIKELY(!rawValue->hasValue())) {
    return defaultValue;
  }

  try {
    T result;
    fromRawValue(context, *rawValue, result);
    return result;
  } catch (const std::exception &e) {
    // In case of errors, log the error and fall back to the default
    RawPropsKey key{namePrefix, name, nameSuffix};
    // TODO: report this using ErrorUtils so it's more visible to the user
    LOG(ERROR) << "Error while converting prop '"
               << static_cast<std::string>(key) << "': " << e.what();
    return defaultValue;
  }
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

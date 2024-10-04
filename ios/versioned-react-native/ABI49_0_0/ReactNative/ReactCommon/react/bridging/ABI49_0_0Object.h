/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/bridging/ABI49_0_0AString.h>
#include <ABI49_0_0React/bridging/ABI49_0_0Base.h>

#include <ABI49_0_0butter/ABI49_0_0map.h>
#include <map>
#include <unordered_map>

namespace ABI49_0_0facebook::ABI49_0_0React {

template <>
struct Bridging<jsi::WeakObject> {
  static jsi::WeakObject fromJs(jsi::Runtime &rt, const jsi::Object &value) {
    return jsi::WeakObject(rt, value);
  }

  static jsi::Value toJs(jsi::Runtime &rt, jsi::WeakObject &value) {
    return value.lock(rt);
  }
};

template <typename T>
struct Bridging<
    std::shared_ptr<T>,
    std::enable_if_t<std::is_base_of_v<jsi::HostObject, T>>> {
  static std::shared_ptr<T> fromJs(jsi::Runtime &rt, const jsi::Object &value) {
    return value.asHostObject<T>(rt);
  }

  static jsi::Object toJs(jsi::Runtime &rt, std::shared_ptr<T> value) {
    return jsi::Object::createFromHostObject(rt, std::move(value));
  }
};

namespace map_detail {

template <typename T>
struct Bridging {
  static T fromJs(
      jsi::Runtime &rt,
      const jsi::Object &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    T result;
    auto propertyNames = value.getPropertyNames(rt);
    auto length = propertyNames.length(rt);

    for (size_t i = 0; i < length; i++) {
      auto propertyName = propertyNames.getValueAtIndex(rt, i);

      result.emplace(
          bridging::fromJs<std::string>(rt, propertyName, jsInvoker),
          bridging::fromJs<typename T::mapped_type>(
              rt, value.getProperty(rt, propertyName.asString(rt)), jsInvoker));
    }

    return result;
  }

  static jsi::Object toJs(
      jsi::Runtime &rt,
      const T &map,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    auto resultObject = jsi::Object(rt);

    for (const auto &[key, value] : map) {
      resultObject.setProperty(
          rt,
          jsi::PropNameID::forUtf8(rt, key),
          bridging::toJs(rt, value, jsInvoker));
    }

    return resultObject;
  }
};

} // namespace map_detail

#ifdef BUTTER_USE_FOLLY_CONTAINERS
template <typename... Args>
struct Bridging<butter::map<std::string, Args...>>
    : map_detail::Bridging<butter::map<std::string, Args...>> {};
#endif

template <typename... Args>
struct Bridging<std::map<std::string, Args...>>
    : map_detail::Bridging<std::map<std::string, Args...>> {};

template <typename... Args>
struct Bridging<std::unordered_map<std::string, Args...>>
    : map_detail::Bridging<std::unordered_map<std::string, Args...>> {};

} // namespace ABI49_0_0facebook::ABI49_0_0React

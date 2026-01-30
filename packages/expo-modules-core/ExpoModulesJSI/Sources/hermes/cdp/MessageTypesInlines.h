/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_MESSAGETYPESINLINES_H
#define HERMES_CDP_MESSAGETYPESINLINES_H

#include <memory>
#include <optional>
#include <type_traits>

#include <hermes/Parser/JSONParser.h>
#include <hermes/cdp/JSONValueInterfaces.h>
#include <hermes/cdp/MessageInterfaces.h>

namespace facebook {
namespace hermes {
namespace cdp {
namespace message {

template <typename T>
using optional = std::optional<T>;

template <typename>
struct is_vector : std::false_type {};

template <typename T>
struct is_vector<std::vector<T>> : std::true_type {};

/// valueFromJson

/// Convert JSONValue to a Serializable type.
template <typename T>
typename std::
    enable_if<std::is_base_of<Serializable, T>::value, std::unique_ptr<T>>::type
    valueFromJson(const JSONValue *v) {
  auto res = llvh::dyn_cast_or_null<JSONObject>(v);
  if (!res) {
    return nullptr;
  }
  return T::tryMake(res);
}

/// Convert JSONValue to a bool.
template <typename T>
typename std::enable_if<std::is_same<T, bool>::value, std::unique_ptr<T>>::type
valueFromJson(const JSONValue *v) {
  auto res = llvh::dyn_cast_or_null<JSONBoolean>(v);
  if (!res) {
    return nullptr;
  }
  return std::make_unique<T>(res->getValue());
}

/// Convert JSONValue to a long long.
template <typename T>
typename std::enable_if<std::is_same<T, long long>::value, std::unique_ptr<T>>::
    type
    valueFromJson(const JSONValue *v) {
  auto res = llvh::dyn_cast_or_null<JSONNumber>(v);
  if (!res) {
    return nullptr;
  }
  return std::make_unique<T>(res->getValue());
}

/// Convert JSONValue to a double.
template <typename T>
typename std::enable_if<std::is_same<T, double>::value, std::unique_ptr<T>>::
    type
    valueFromJson(const JSONValue *v) {
  auto res = llvh::dyn_cast_or_null<JSONNumber>(v);
  if (!res) {
    return nullptr;
  }
  return std::make_unique<T>(res->getValue());
}

/// Convert JSONValue to a string.
template <typename T>
typename std::
    enable_if<std::is_same<T, std::string>::value, std::unique_ptr<T>>::type
    valueFromJson(const JSONValue *v) {
  auto res = llvh::dyn_cast_or_null<JSONString>(v);
  if (!res) {
    return nullptr;
  }
  return std::make_unique<T>(res->c_str());
}

/// Convert JSONValue to a vector<T>.
template <typename T>
typename std::enable_if<is_vector<T>::value, std::unique_ptr<T>>::type
valueFromJson(const JSONValue *items) {
  auto *arr = llvh::dyn_cast<JSONArray>(items);
  std::unique_ptr<T> result = std::make_unique<T>();
  result->reserve(arr->size());
  for (const auto &item : *arr) {
    auto itemResult = valueFromJson<typename T::value_type>(item);
    if (!itemResult) {
      return nullptr;
    }
    result->push_back(std::move(*itemResult));
  }
  return result;
}

/// Convert JSONValue to a JSONObject.
template <typename T>
typename std::
    enable_if<std::is_same<T, JSONObject *>::value, std::unique_ptr<T>>::type
    valueFromJson(JSONValue *v) {
  auto *res = llvh::dyn_cast_or_null<JSONObject>(v);
  if (!res) {
    return nullptr;
  }
  return std::make_unique<T>(res);
}

/// Pass through JSONValues.
template <typename T>
typename std::
    enable_if<std::is_same<T, JSONValue *>::value, std::unique_ptr<T>>::type
    valueFromJson(JSONValue *v) {
  return std::make_unique<T>(v);
}

/// assign(lhs, obj, key) is a wrapper for:
///
///   lhs = obj[key]
///
/// It mainly exists so that we can choose the right version of valueFromJson
/// based on the type of lhs.

template <typename T, typename U>
bool assign(T &lhs, const JSONObject *obj, const U &key) {
  JSONValue *v = obj->get(key);
  if (v == nullptr) {
    return false;
  }
  auto convertResult = valueFromJson<T>(v);
  if (convertResult) {
    lhs = std::move(*convertResult);
    return true;
  }
  return false;
}

template <typename T, typename U>
bool assign(optional<T> &lhs, const JSONObject *obj, const U &key) {
  JSONValue *v = obj->get(key);
  if (v != nullptr) {
    auto convertResult = valueFromJson<T>(v);
    if (convertResult) {
      lhs = std::move(*convertResult);
      return true;
    }
    return false;
  } else {
    lhs.reset();
    return true;
  }
}

template <typename T, typename U>
bool assign(std::unique_ptr<T> &lhs, const JSONObject *obj, const U &key) {
  JSONValue *v = obj->get(key);
  if (v != nullptr) {
    auto convertResult = valueFromJson<T>(v);
    if (convertResult) {
      lhs = std::move(convertResult);
      return true;
    }
    return false;
  } else {
    lhs.reset();
    return true;
  }
}

template <typename T, typename U, typename D>
bool assign(
    std::unique_ptr<T, std::function<void(D *)>> &lhs,
    const JSONObject *obj,
    const U &key) {
  JSONValue *v = obj->get(key);
  if (v != nullptr) {
    auto convertResult = valueFromJson<T>(v);
    if (convertResult) {
      lhs = std::move(convertResult);
      return true;
    }
    return false;
  } else {
    lhs.reset();
    return true;
  }
}

/// valueToJson

inline JSONValue *valueToJson(const Serializable &value, JSONFactory &factory) {
  return value.toJsonVal(factory);
}

// Convert a bool to JSONValue.
inline JSONValue *valueToJson(bool b, JSONFactory &factory) {
  return factory.getBoolean(b);
}

// Convert a long long to JSONValue.
inline JSONValue *valueToJson(long long num, JSONFactory &factory) {
  return factory.getNumber(num);
}

// Convert a double to JSONValue.
inline JSONValue *valueToJson(double num, JSONFactory &factory) {
  return factory.getNumber(num);
}

// Convert a string to JSONValue.
inline JSONValue *valueToJson(const std::string &str, JSONFactory &factory) {
  return factory.getString(str);
}

// Convert a vector<T> to JSONValue.
template <typename T>
JSONValue *valueToJson(const std::vector<T> &items, JSONFactory &factory) {
  llvh::SmallVector<JSONValue *, 5> storage;
  for (const auto &item : items) {
    storage.push_back(valueToJson(item, factory));
  }
  return factory.newArray(storage.size(), storage.begin(), storage.end());
}

// Cast a JSONObject to JSONValue.
inline JSONValue *valueToJson(JSONObject *obj, JSONFactory &factory) {
  return llvh::cast<JSONValue>(obj);
}

// Pass through JSONValues.
inline JSONValue *valueToJson(JSONValue *v, JSONFactory &factory) {
  return v;
}

/// put(obj, key, value) is meant to be a wrapper for:
///   obj[key] = valueToJson(value);
/// However, JSONObjects are immutable, so we represent a 'put' operation as
/// pushing a new element onto a vector of JSONFactory::Props.

using Properties = llvh::SmallVectorImpl<JSONFactory::Prop>;

template <typename V>
void put(
    Properties &props,
    const std::string &key,
    const V &value,
    JSONFactory &factory) {
  JSONString *jsStr = factory.getString(key);
  JSONValue *jsVal = valueToJson(value, factory);
  props.push_back({jsStr, jsVal});
}

template <typename V>
void put(
    Properties &props,
    const std::string &key,
    const optional<V> &optValue,
    JSONFactory &factory) {
  if (optValue.has_value()) {
    JSONString *jsStr = factory.getString(key);
    JSONValue *jsVal = valueToJson(optValue.value(), factory);
    props.push_back({jsStr, jsVal});
  }
}

template <typename V>
void put(
    Properties &props,
    const std::string &key,
    const std::unique_ptr<V> &ptr,
    JSONFactory &factory) {
  if (ptr.get()) {
    JSONString *jsStr = factory.getString(key);
    JSONValue *jsVal = valueToJson(*ptr, factory);
    props.push_back({jsStr, jsVal});
  }
}

template <typename V, typename D>
void put(
    Properties &props,
    const std::string &key,
    const std::unique_ptr<V, std::function<void(D *)>> &ptr,
    JSONFactory &factory) {
  if (ptr.get()) {
    JSONString *jsStr = factory.getString(key);
    JSONValue *jsVal = valueToJson(*ptr, factory);
    props.push_back({jsStr, jsVal});
  }
}

template <typename T>
void deleter(T *p) {
  delete p;
}

} // namespace message
} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_MESSAGETYPESINLINES_H

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <climits>
#include <memory>
#include <string>
#include <unordered_set>
#include <vector>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

#ifndef NDEBUG
#define ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE 1
#endif

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE

class DebugStringConvertible;

using SharedDebugStringConvertible =
    std::shared_ptr<const DebugStringConvertible>;
using SharedDebugStringConvertibleList =
    std::vector<SharedDebugStringConvertible>;

struct DebugStringConvertibleOptions {
  bool format{true};
  int depth{0};
  int maximumDepth{INT_MAX};
};

/*
 * Abstract class describes conformance to DebugStringConvertible concept
 * and implements basic recursive debug string assembly algorithm.
 * Use this as a base class for providing a debugging textual representation
 * of your class.
 *
 * The `DebugStringConvertible` *class* is obsolete. Whenever possible prefer
 * implementing standalone functions that conform to the informal
 * `DebugStringConvertible`-like interface instead of extending this class.
 */
class DebugStringConvertible {
 public:
  virtual ~DebugStringConvertible() = default;

  // Returns a name of the object.
  // Default implementation returns "Node".
  virtual std::string getDebugName() const;

  // Returns a value associate with the object.
  // Default implementation returns an empty string.
  virtual std::string getDebugValue() const;

  // Returns a list of `DebugStringConvertible` objects which can be considered
  // as *children* of the object.
  // Default implementation returns an empty list.
  virtual SharedDebugStringConvertibleList getDebugChildren() const;

  // Returns a list of `DebugStringConvertible` objects which can be considered
  // as *properties* of the object.
  // Default implementation returns an empty list.
  virtual SharedDebugStringConvertibleList getDebugProps() const;

  // Returns a string which represents the object in a human-readable way.
  // Default implementation returns a description of the subtree
  // rooted at this node, represented in XML-like format.
  virtual std::string getDebugDescription(
      DebugStringConvertibleOptions options = {}) const;

  // Do same as `getDebugDescription` but return only *children* and
  // *properties* parts (which are used in `getDebugDescription`).
  virtual std::string getDebugPropsDescription(
      DebugStringConvertibleOptions options = {}) const;
  virtual std::string getDebugChildrenDescription(
      DebugStringConvertibleOptions options = {}) const;
};

#else

class DebugStringConvertible {};

#endif

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE

/*
 * Set of particular-format-opinionated functions that convert base types to
 * `std::string`; practically incapsulate `folly:to<>` and `folly::format`.
 */
std::string toString(std::string const &value);
std::string toString(int const &value);
std::string toString(bool const &value);
std::string toString(float const &value);
std::string toString(double const &value);
std::string toString(void const *value);

/*
 * *Informal* `DebugStringConvertible` interface.
 *
 * The interface consts of several functions which are designed to be composable
 * and reusable relying on C++ overloading mechanism. Implement appropriate
 * versions of those functions for your custom type to enable conformance to the
 * interface:
 *
 * - `getDebugName`: Returns a name of the object. Default implementation
 * returns "Node".
 *
 * - `getDebugValue`: Returns a value associate with the object. Default
 * implementation returns an empty string.
 *
 * - `getDebugChildren`: Returns a list of `DebugStringConvertible`-compatible
 * objects which can be considered as *children* of the object. Default
 * implementation returns an empty list.
 *
 * - `getDebugProps`: Returns a list of `DebugStringConvertible` objects which
 * can be considered as *properties* of the object. Default implementation
 * returns an empty list.
 *
 * - `getDebugDescription`: Returns a string which represents the object in a
 * human-readable way. Default implementation returns a description of the
 * subtree rooted at this node, represented in XML-like format using functions
 * above to form the tree.
 */

/*
 * Universal implementation of `getDebugDescription`-family functions for all
 * types.
 */
template <typename T>
std::string getDebugName(T const &object) {
  return "Node";
}

template <typename T>
std::string getDebugValue(T const &object) {
  return "";
}

template <typename T>
std::vector<T> getDebugChildren(
    T const &object,
    DebugStringConvertibleOptions options) {
  return {};
}

template <typename T>
std::vector<T> getDebugProps(
    T const &object,
    DebugStringConvertibleOptions options) {
  return {};
}

template <typename T>
std::string getDebugPropsDescription(
    T const &object,
    DebugStringConvertibleOptions options) {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  std::string propsString = "";

  options.depth++;

  for (auto prop : getDebugProps(object, options)) {
    auto name = getDebugName(prop);
    auto value = getDebugValue(prop);
    auto children = getDebugPropsDescription(prop, options);
    auto valueAndChildren =
        value + (children.empty() ? "" : "(" + children + ")");
    propsString +=
        " " + name + (valueAndChildren.empty() ? "" : "=" + valueAndChildren);
  }

  if (!propsString.empty()) {
    // Removing leading space character.
    propsString.erase(propsString.begin());
  }

  return propsString;
}

template <typename T>
std::string getDebugChildrenDescription(
    T const &object,
    DebugStringConvertibleOptions options) {
  if (options.depth >= options.maximumDepth) {
    return "";
  }

  auto trailing = options.format ? std::string{"\n"} : std::string{""};
  auto childrenString = std::string{""};
  options.depth++;

  for (auto child : getDebugChildren(object, options)) {
    childrenString += getDebugDescription(child, options) + trailing;
  }

  if (!childrenString.empty() && !trailing.empty()) {
    // Removing trailing fragment.
    childrenString.erase(childrenString.end() - 1);
  }

  return childrenString;
}

template <typename T>
std::string getDebugDescription(
    T const &object,
    DebugStringConvertibleOptions options) {
  auto nameString = getDebugName(object);
  auto valueString = getDebugValue(object);

  // Convention:
  // If `name` and `value` are empty, `description` is also empty.
  if (nameString.empty() && valueString.empty()) {
    return "";
  }

  // Convention:
  // If `name` is empty and `value` isn't empty, `description` equals `value`.
  if (nameString.empty()) {
    return valueString;
  }

  auto childrenString = getDebugChildrenDescription(object, options);
  auto propsString = getDebugPropsDescription(object, options);

  auto leading =
      options.format ? std::string(options.depth * 2, ' ') : std::string{""};
  auto trailing = options.format ? std::string{"\n"} : std::string{""};

  return leading + "<" + nameString +
      (valueString.empty() ? "" : "=" + valueString) +
      (propsString.empty() ? "" : " " + propsString) +
      (childrenString.empty() ? "/>"
                              : ">" + trailing + childrenString + trailing +
               leading + "</" + nameString + ">");
}

/*
 * Functions of `getDebugDescription`-family for primitive types.
 */
// `int`
inline std::string getDebugDescription(
    int number,
    DebugStringConvertibleOptions options) {
  return toString(number);
}

// `float`
inline std::string getDebugDescription(
    float number,
    DebugStringConvertibleOptions options) {
  return toString(number);
}

// `double`
inline std::string getDebugDescription(
    double number,
    DebugStringConvertibleOptions options) {
  return toString(number);
}

// `bool`
inline std::string getDebugDescription(
    bool boolean,
    DebugStringConvertibleOptions options) {
  return toString(boolean);
}

// `void *`
inline std::string getDebugDescription(
    void *pointer,
    DebugStringConvertibleOptions options) {
  return toString(pointer);
}

// `std::string`
inline std::string getDebugDescription(
    std::string const &string,
    DebugStringConvertibleOptions options) {
  return string;
}

// `std::vector<T>`
template <typename T, typename... Ts>
std::string getDebugName(std::vector<T, Ts...> const &vector) {
  return "List";
}

template <typename T, typename... Ts>
std::vector<T, Ts...> getDebugChildren(
    std::vector<T, Ts...> const &vector,
    DebugStringConvertibleOptions options) {
  return vector;
}

// `std::unordered_set<T>`
template <typename T, typename... Ts>
std::string getDebugName(std::unordered_set<T, Ts...> const &set) {
  return "Set";
}

template <typename T, typename... Ts>
std::vector<T> getDebugChildren(
    std::unordered_set<T, Ts...> const &set,
    DebugStringConvertibleOptions options) {
  auto vector = std::vector<T>{};
  vector.insert(vector.end(), set.begin(), set.end());
  return vector;
}

// `std::shared_ptr<T>`
template <typename T>
inline std::string getDebugDescription(
    std::shared_ptr<T> const &pointer,
    DebugStringConvertibleOptions options) {
  return getDebugDescription((void *)pointer.get(), options) + "(shared)";
}

// `std::weak_ptr<T>`
template <typename T>
inline std::string getDebugDescription(
    std::weak_ptr<T> const &pointer,
    DebugStringConvertibleOptions options) {
  return getDebugDescription((void *)pointer.lock().get(), options) + "(weak)";
}

// `std::unique_ptr<T>`
template <typename T>
inline std::string getDebugDescription(
    std::unique_ptr<T const> const &pointer,
    DebugStringConvertibleOptions options) {
  return getDebugDescription((void *)pointer.get(), options) + "(unique)";
}

/*
 * Trivial container for `name`  and `value` pair that supports
 * static `DebugStringConvertible` informal interface.
 */
struct DebugStringConvertibleObject {
  std::string name;
  std::string value;
};

inline std::string getDebugName(DebugStringConvertibleObject const &object) {
  return object.name;
}

inline std::string getDebugValue(DebugStringConvertibleObject const &object) {
  return object.value;
}

#endif

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook

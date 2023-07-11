#pragma once

#include <jsi/jsi.h>
#include <sstream>
#include <string>
#include <tuple>
#include <utility>

using namespace facebook;

namespace reanimated {
namespace jsi_utils {

// `get` functions take a pointer to `jsi::Value` and
// call an appropriate method to cast to the native type
template <typename T>
inline T get(jsi::Runtime &rt, const jsi::Value *value);

template <>
inline double get<double>(jsi::Runtime &rt, const jsi::Value *value) {
  return value->asNumber();
}

template <>
inline int get<int>(jsi::Runtime &rt, const jsi::Value *value) {
  return value->asNumber();
}

template <>
inline bool get<bool>(jsi::Runtime &rt, const jsi::Value *value) {
  if (!value->isBool()) {
    throw jsi::JSINativeException("Expected a boolean");
  }
  return value->getBool();
}

template <>
inline jsi::Object get<jsi::Object>(jsi::Runtime &rt, const jsi::Value *value) {
  return value->asObject(rt);
}

template <>
inline jsi::Value const &get<jsi::Value const &>(
    jsi::Runtime &rt,
    const jsi::Value *value) {
  return *value;
}

// `convertArgs` functions take a variadic template parameter of target (C++)
// argument types `Targs` and a `jsi::Value` array `args`, and converts `args`
// to a tuple of typed C++ arguments to be passed to the native implementation.
// This is accomplished by dispatching (at compile time) to the correct
// implementation based on the first type of `Targs`, using SFINAE to select the
// correct specialization, and concatenating with the result of recursion on the
// rest of `Targs`

// BEGIN implementations for `convertArgs` specializations.
// specialization for empty `Targs` - returns an empty tuple
template <typename... Args>
inline std::enable_if_t<(sizeof...(Args) == 0), std::tuple<>> convertArgs(
    jsi::Runtime &rt,
    const jsi::Value *args) {
  return std::make_tuple();
}

// calls `get<First>` on the first argument to retrieve the native type,
// then calls recursively on the rest of `args`
// and returns the concatenation of results
template <typename T, typename... Rest>
inline std::tuple<T, Rest...> convertArgs(
    jsi::Runtime &rt,
    const jsi::Value *args) {
  auto arg = std::tuple<T>(get<T>(rt, args));
  auto rest = convertArgs<Rest...>(rt, std::next(args));
  return std::tuple_cat(std::move(arg), std::move(rest));
}
// END implementations for `convertArgs` specializations.

// returns a tuple with the result of casting `args` to appropriate
// native C++ types needed to call `function`
template <typename Ret, typename... Args>
std::tuple<Args...> getArgsForFunction(
    std::function<Ret(Args...)> function,
    jsi::Runtime &rt,
    const jsi::Value *args,
    const size_t count) {
  assert(sizeof...(Args) == count);
  return convertArgs<Args...>(rt, args);
}

// returns a tuple with the result of casting `args` to appropriate
// native C++ types needed to call `function`,
// passing `rt` as the first argument
template <typename Ret, typename... Args>
std::tuple<jsi::Runtime &, Args...> getArgsForFunction(
    std::function<Ret(jsi::Runtime &, Args...)> function,
    jsi::Runtime &rt,
    const jsi::Value *args,
    const size_t count) {
  assert(sizeof...(Args) == count);
  return std::tuple_cat(std::tie(rt), convertArgs<Args...>(rt, args));
}

// calls `function` with `args`
template <typename Ret, typename... Args>
inline jsi::Value apply(
    std::function<Ret(Args...)> function,
    std::tuple<Args...> args) {
  return std::apply(function, std::move(args));
}

// calls void-returning `function` with `args`,
// and returns `undefined`
template <typename... Args>
inline jsi::Value apply(
    std::function<void(Args...)> function,
    std::tuple<Args...> args) {
  std::apply(function, std::move(args));
  return jsi::Value::undefined();
}

// returns a function with JSI calling convention
// from a native function `function`
template <typename Fun>
jsi::HostFunctionType createHostFunction(Fun function) {
  return [function](
             jsi::Runtime &rt,
             const jsi::Value &thisValue,
             const jsi::Value *args,
             const size_t count) {
    auto argz = getArgsForFunction(function, rt, args, count);
    return apply(function, std::move(argz));
  };
}

// used to determine if `function<Ret(Args...)>`
// takes `Runtime &` as its first argument
template <typename... Args>
struct takes_runtime {
  static constexpr size_t value = 0;
};

// specialization for `function<Ret(Runtime &, Rest...)`
template <typename... Rest>
struct takes_runtime<jsi::Runtime &, Rest...> {
  static constexpr size_t value = 1;
};

// creates a JSI compatible function from `function`
// and installs it as a global function named `name`
// in the `rt` JS runtime
template <typename Ret, typename... Args>
void installJsiFunction(
    jsi::Runtime &rt,
    std::string_view name,
    std::function<Ret(Args...)> function) {
  auto clb = createHostFunction(function);
  auto argsCount = sizeof...(Args) - takes_runtime<Args...>::value;
  jsi::Value jsiFunction = jsi::Function::createFromHostFunction(
      rt, jsi::PropNameID::forAscii(rt, name.data()), argsCount, clb);
  rt.global().setProperty(rt, name.data(), jsiFunction);
}

// this should take care of passing types convertible to `function`
template <typename Fun>
void installJsiFunction(jsi::Runtime &rt, std::string_view name, Fun function) {
  installJsiFunction(rt, name, std::function(std::forward<Fun>(function)));
}

jsi::Array convertStringToArray(
    jsi::Runtime &rt,
    const std::string &value,
    const unsigned int expectedSize);

} // namespace jsi_utils
} // namespace reanimated

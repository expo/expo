#pragma once

#include <jsi/jsi.h>

#include "convert_from_jsi.h"

namespace jsi = facebook::jsi;

namespace expo {

namespace details {

template<typename T>
T convert_arg(
  jsi::Runtime &rt,
  const jsi::Value *args,
  std::size_t index
) {
  return convert_from_jsi<T>::convert(rt, args[index]);
}

template<typename... Args, std::size_t... Is>
std::tuple<Args...> convert_args_impl(
  jsi::Runtime &rt,
  const jsi::Value *args,
  std::index_sequence<Is...>
) {
  return std::tuple<Args...>{
    convert_arg<Args>(rt, args, Is)...
  };
}

} // namespace details

/**
 * Convert raw JSI arguments to a tuple of C++ values according to the specified types.
 * The number of provided arguments must be at least the number of expected arguments.
 */
template<typename... Args>
std::tuple<Args...> convert_args(
  jsi::Runtime &rt,
  const jsi::Value *args,
  std::size_t count
) {
  constexpr std::size_t expectedArgs = sizeof...(Args);
  if (count < expectedArgs) {
    throw jsi::JSError(
      rt,
      "Expected at least " + std::to_string(expectedArgs) +
      " argument(s), got " + std::to_string(count)
    );
  }

  return details::convert_args_impl<Args...>(rt, args, std::index_sequence_for<Args...>{});
}

} // namespace expo

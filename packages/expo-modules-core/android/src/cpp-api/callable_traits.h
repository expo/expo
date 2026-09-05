// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <tuple>
#include <type_traits>

namespace expo {

template<typename T>
struct callable_traits;

template<typename Ret, typename... Args>
struct callable_traits<Ret(*)(Args...)> {
  using return_type = Ret;
  using args_tuple = std::tuple<Args...>;

  static constexpr std::size_t arity = sizeof...(Args);

  template<std::size_t I>
  using arg_type = std::tuple_element_t<I, args_tuple>;
};

// member-function pointers
template<typename Ret, typename C, typename... Args>
struct callable_traits<Ret(C::*)(Args...)> {
  using return_type = Ret;
  using args_tuple = std::tuple<Args...>;

  static constexpr std::size_t arity = sizeof...(Args);

  template<std::size_t I>
  using arg_type = std::tuple_element_t<I, args_tuple>;
};

// const member-function pointers
template<typename Ret, typename C, typename... Args>
struct callable_traits<Ret(C::*)(Args...) const> {
  using return_type = Ret;
  using args_tuple = std::tuple<Args...>;

  static constexpr std::size_t arity = sizeof...(Args);

  template<std::size_t I>
  using arg_type = std::tuple_element_t<I, args_tuple>;
};

// noexcept function pointer
template<typename Ret, typename... Args>
struct callable_traits<Ret(*)(Args...) noexcept>
  : callable_traits<Ret(*)(Args...)> {
};

// noexcept member-function pointers
template<typename Ret, typename C, typename... Args>
struct callable_traits<Ret(C::*)(Args...) noexcept>
  : callable_traits<Ret(C::*)(Args...)> {
};

// noexcept const member-function pointers
template<typename Ret, typename C, typename... Args>
struct callable_traits<Ret(C::*)(Args...) const noexcept>
  : callable_traits<Ret(C::*)(Args...) const> {
};

// functors and lambdas (with ::operator())
template<typename T> requires requires { &T::operator(); }
struct callable_traits<T>
  : callable_traits<decltype(&T::operator())> {
};

} // namespace expo

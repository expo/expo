/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

// included by Future.h, do not include directly.

namespace folly {

template <class>
class Promise;

template <class T>
class SemiFuture;

template <typename T>
struct isSemiFuture : std::false_type {
  using Inner = lift_unit_t<T>;
};

template <typename T>
struct isSemiFuture<SemiFuture<T>> : std::true_type {
  typedef T Inner;
};

template <typename T>
struct isFuture : std::false_type {
  using Inner = lift_unit_t<T>;
};

template <typename T>
struct isFuture<Future<T>> : std::true_type {
  typedef T Inner;
};

template <typename T>
struct isFutureOrSemiFuture : std::false_type {
  using Inner = lift_unit_t<T>;
  using Return = Inner;
};

template <typename T>
struct isFutureOrSemiFuture<Try<T>> : std::false_type {
  using Inner = lift_unit_t<T>;
  using Return = Inner;
};

template <typename T>
struct isFutureOrSemiFuture<Future<T>> : std::true_type {
  typedef T Inner;
  using Return = Future<Inner>;
};

template <typename T>
struct isFutureOrSemiFuture<Future<Try<T>>> : std::true_type {
  typedef T Inner;
  using Return = Future<Inner>;
};

template <typename T>
struct isFutureOrSemiFuture<SemiFuture<T>> : std::true_type {
  typedef T Inner;
  using Return = SemiFuture<Inner>;
};

template <typename T>
struct isFutureOrSemiFuture<SemiFuture<Try<T>>> : std::true_type {
  typedef T Inner;
  using Return = SemiFuture<Inner>;
};

namespace futures {
namespace detail {

template <class>
class Core;

template <typename...>
struct ArgType;

template <typename Arg, typename... Args>
struct ArgType<Arg, Args...> {
  typedef Arg FirstArg;
  typedef ArgType<Args...> Tail;
};

template <>
struct ArgType<> {
  typedef void FirstArg;
};

template <bool isTry_, typename F, typename... Args>
struct argResult {
  using Function = F;
  using ArgList = ArgType<Args...>;
  using Result = invoke_result_t<F, Args...>;
  using ArgsSize = index_constant<sizeof...(Args)>;
  static constexpr bool isTry() {
    return isTry_;
  }
};

template <typename T, typename F>
struct callableResult {
  typedef typename std::conditional<
      is_invocable_v<F>,
      detail::argResult<false, F>,
      typename std::conditional<
          is_invocable_v<F, T&&>,
          detail::argResult<false, F, T&&>,
          detail::argResult<true, F, Try<T>&&>>::type>::type Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
};

template <typename T, typename F>
struct executorCallableResult {
  typedef typename std::conditional<
      is_invocable_v<F, Executor::KeepAlive<>&&>,
      detail::argResult<false, F, Executor::KeepAlive<>&&>,
      typename std::conditional<
          is_invocable_v<F, Executor::KeepAlive<>&&, T&&>,
          detail::argResult<false, F, Executor::KeepAlive<>&&, T&&>,
          detail::argResult<true, F, Executor::KeepAlive<>&&, Try<T>&&>>::
          type>::type Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
};

template <
    typename T,
    typename F,
    typename = std::enable_if_t<is_invocable_v<F, Try<T>&&>>>
struct tryCallableResult {
  typedef detail::argResult<true, F, Try<T>&&> Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef typename ReturnsFuture::Inner value_type;
  typedef Future<value_type> Return;
};

template <
    typename T,
    typename F,
    typename = std::enable_if_t<is_invocable_v<F, Executor*, Try<T>&&>>>
struct tryExecutorCallableResult {
  typedef detail::argResult<true, F, Executor::KeepAlive<>&&, Try<T>&&> Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef typename ReturnsFuture::Inner value_type;
  typedef Future<value_type> Return;
};

template <typename T, typename F>
struct valueCallableResult {
  typedef detail::argResult<false, F, T&&> Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef typename ReturnsFuture::Inner value_type;
  typedef typename Arg::ArgList::FirstArg FirstArg;
  typedef Future<value_type> Return;
};

template <typename T, typename F>
struct valueExecutorCallableResult {
  typedef detail::argResult<false, F, Executor::KeepAlive<>&&, T&&> Arg;
  typedef isFutureOrSemiFuture<typename Arg::Result> ReturnsFuture;
  typedef typename ReturnsFuture::Inner value_type;
  typedef typename Arg::ArgList::Tail::FirstArg ValueArg;
  typedef Future<value_type> Return;
};

template <typename L>
struct Extract : Extract<decltype(&L::operator())> {};

template <typename Class, typename R, typename... Args>
struct Extract<R (Class::*)(Args...) const> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

template <typename Class, typename R, typename... Args>
struct Extract<R (Class::*)(Args...)> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

template <typename R, typename... Args>
struct Extract<R (*)(Args...)> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

template <typename R, typename... Args>
struct Extract<R (&)(Args...)> {
  typedef isFutureOrSemiFuture<R> ReturnsFuture;
  typedef Future<typename ReturnsFuture::Inner> Return;
  typedef typename ReturnsFuture::Inner RawReturn;
  typedef typename ArgType<Args...>::FirstArg FirstArg;
};

class DeferredExecutor;

template <class T, class F>
auto makeExecutorLambda(
    F&& func,
    typename std::enable_if<is_invocable_v<F>, int>::type = 0) {
  return
      [func = std::forward<F>(func)](Executor::KeepAlive<>&&, auto&&) mutable {
        return std::forward<F>(func)();
      };
}

template <class T, class F>
auto makeExecutorLambda(
    F&& func,
    typename std::enable_if<!is_invocable_v<F>, int>::type = 0) {
  using R = futures::detail::callableResult<T, F&&>;
  return [func = std::forward<F>(func)](
             Executor::KeepAlive<>&&,
             typename R::Arg::ArgList::FirstArg&& param) mutable {
    return std::forward<F>(func)(std::forward<decltype(param)>(param));
  };
}

} // namespace detail
} // namespace futures

class Timekeeper;

} // namespace folly

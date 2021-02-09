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

#include <functional>
#include <type_traits>

#include <boost/preprocessor/control/expr_iif.hpp>
#include <boost/preprocessor/facilities/is_empty_variadic.hpp>
#include <boost/preprocessor/list/for_each.hpp>
#include <boost/preprocessor/logical/not.hpp>
#include <boost/preprocessor/tuple/to_list.hpp>

#include <folly/Portability.h>
#include <folly/Preprocessor.h>
#include <folly/Traits.h>

/**
 *  include or backport:
 *  * std::invoke
 *  * std::invoke_result
 *  * std::invoke_result_t
 *  * std::is_invocable
 *  * std::is_invocable_v
 *  * std::is_invocable_r
 *  * std::is_invocable_r_v
 *  * std::is_nothrow_invocable
 *  * std::is_nothrow_invocable_v
 *  * std::is_nothrow_invocable_r
 *  * std::is_nothrow_invocable_r_v
 */

#if __cpp_lib_invoke >= 201411 || _MSC_VER

namespace folly {

/* using override */ using std::invoke;
}

#else

namespace folly {

//  mimic: std::invoke, C++17
template <typename F, typename... Args>
FOLLY_ERASE constexpr auto invoke(F&& f, Args&&... args) noexcept(
    noexcept(static_cast<F&&>(f)(static_cast<Args&&>(args)...)))
    -> decltype(static_cast<F&&>(f)(static_cast<Args&&>(args)...)) {
  return static_cast<F&&>(f)(static_cast<Args&&>(args)...);
}
template <typename M, typename C, typename... Args>
FOLLY_ERASE constexpr auto invoke(M(C::*d), Args&&... args)
    -> decltype(std::mem_fn(d)(static_cast<Args&&>(args)...)) {
  return std::mem_fn(d)(static_cast<Args&&>(args)...);
}

} // namespace folly

#endif

// Only available in >= MSVC 2017 15.3 in C++17
#if __cpp_lib_is_invocable >= 201703 || \
    (_MSC_VER >= 1911 && _MSVC_LANG > 201402)

namespace folly {

/* using override */ using std::invoke_result;
/* using override */ using std::invoke_result_t;
/* using override */ using std::is_invocable;
/* using override */ using std::is_invocable_r;
/* using override */ using std::is_invocable_r_v;
/* using override */ using std::is_invocable_v;
/* using override */ using std::is_nothrow_invocable;
/* using override */ using std::is_nothrow_invocable_r;
/* using override */ using std::is_nothrow_invocable_r_v;
/* using override */ using std::is_nothrow_invocable_v;

} // namespace folly

#else

namespace folly {

namespace invoke_detail {

template <typename F, typename... Args>
using invoke_result_ =
    decltype(invoke(std::declval<F>(), std::declval<Args>()...));

template <typename F, typename... Args>
struct invoke_nothrow_
    : bool_constant<noexcept(
          invoke(std::declval<F>(), std::declval<Args>()...))> {};

//  from: http://en.cppreference.com/w/cpp/types/result_of, CC-BY-SA

template <typename Void, typename F, typename... Args>
struct invoke_result {};

template <typename F, typename... Args>
struct invoke_result<void_t<invoke_result_<F, Args...>>, F, Args...> {
  using type = invoke_result_<F, Args...>;
};

template <typename Void, typename F, typename... Args>
struct is_invocable : std::false_type {};

template <typename F, typename... Args>
struct is_invocable<void_t<invoke_result_<F, Args...>>, F, Args...>
    : std::true_type {};

template <typename Void, typename R, typename F, typename... Args>
struct is_invocable_r : std::false_type {};

template <typename R, typename F, typename... Args>
struct is_invocable_r<void_t<invoke_result_<F, Args...>>, R, F, Args...>
    : std::is_convertible<invoke_result_<F, Args...>, R> {};

template <typename Void, typename F, typename... Args>
struct is_nothrow_invocable : std::false_type {};

template <typename F, typename... Args>
struct is_nothrow_invocable<void_t<invoke_result_<F, Args...>>, F, Args...>
    : invoke_nothrow_<F, Args...> {};

template <typename Void, typename R, typename F, typename... Args>
struct is_nothrow_invocable_r : std::false_type {};

template <typename R, typename F, typename... Args>
struct is_nothrow_invocable_r<void_t<invoke_result_<F, Args...>>, R, F, Args...>
    : StrictConjunction<
          std::is_convertible<invoke_result_<F, Args...>, R>,
          invoke_nothrow_<F, Args...>> {};

} // namespace invoke_detail

//  mimic: std::invoke_result, C++17
template <typename F, typename... Args>
struct invoke_result : invoke_detail::invoke_result<void, F, Args...> {};

//  mimic: std::invoke_result_t, C++17
template <typename F, typename... Args>
using invoke_result_t = typename invoke_result<F, Args...>::type;

//  mimic: std::is_invocable, C++17
template <typename F, typename... Args>
struct is_invocable : invoke_detail::is_invocable<void, F, Args...> {};

//  mimic: std::is_invocable_v, C++17
template <typename F, typename... Args>
FOLLY_INLINE_VARIABLE constexpr bool is_invocable_v =
    is_invocable<F, Args...>::value;

//  mimic: std::is_invocable_r, C++17
template <typename R, typename F, typename... Args>
struct is_invocable_r : invoke_detail::is_invocable_r<void, R, F, Args...> {};

//  mimic: std::is_invocable_r_v, C++17
template <typename R, typename F, typename... Args>
FOLLY_INLINE_VARIABLE constexpr bool is_invocable_r_v =
    is_invocable_r<R, F, Args...>::value;

//  mimic: std::is_nothrow_invocable, C++17
template <typename F, typename... Args>
struct is_nothrow_invocable
    : invoke_detail::is_nothrow_invocable<void, F, Args...> {};

//  mimic: std::is_nothrow_invocable_v, C++17
template <typename F, typename... Args>
FOLLY_INLINE_VARIABLE constexpr bool is_nothrow_invocable_v =
    is_nothrow_invocable<F, Args...>::value;

//  mimic: std::is_nothrow_invocable_r, C++17
template <typename R, typename F, typename... Args>
struct is_nothrow_invocable_r
    : invoke_detail::is_nothrow_invocable_r<void, R, F, Args...> {};

//  mimic: std::is_nothrow_invocable_r_v, C++17
template <typename R, typename F, typename... Args>
FOLLY_INLINE_VARIABLE constexpr bool is_nothrow_invocable_r_v =
    is_nothrow_invocable_r<R, F, Args...>::value;

} // namespace folly

#endif

namespace folly {

namespace detail {

struct invoke_private_overload;

template <bool, typename Invoke>
struct invoke_traits_base_ {};
template <typename Invoke>
struct invoke_traits_base_<false, Invoke> {};
template <typename Invoke>
struct invoke_traits_base_<true, Invoke> {
  FOLLY_INLINE_VARIABLE static constexpr Invoke invoke{};
};
template <typename Invoke>
using invoke_traits_base =
    invoke_traits_base_<is_constexpr_default_constructible_v<Invoke>, Invoke>;

} // namespace detail

//  invoke_traits
//
//  A traits container struct with the following member types, type aliases, and
//  variables:
//
//  * invoke_result
//  * invoke_result_t
//  * is_invocable
//  * is_invocable_v
//  * is_invocable_r
//  * is_invocable_r_v
//  * is_nothrow_invocable
//  * is_nothrow_invocable_v
//  * is_nothrow_invocable_r
//  * is_nothrow_invocable_r_v
//
//  These members have behavior matching the behavior of C++17's corresponding
//  invocation traits types, type aliases, and variables, but using invoke_type
//  as the invocable argument passed to the usual nivocation traits.
//
//  The traits container struct also has a member type alias:
//
//  * invoke_type
//
//  And an invocable variable as a default-constructed instance of invoke_type,
//  if the latter is constexpr default-constructible:
//
//  * invoke
template <typename Invoke>
struct invoke_traits : detail::invoke_traits_base<Invoke> {
 public:
  using invoke_type = Invoke;

  //  If invoke_type is constexpr default-constructible:
  //
  //    inline static constexpr invoke_type invoke{};

  template <typename... Args>
  struct invoke_result : folly::invoke_result<Invoke, Args...> {};
  template <typename... Args>
  using invoke_result_t = folly::invoke_result_t<Invoke, Args...>;
  template <typename... Args>
  struct is_invocable : folly::is_invocable<Invoke, Args...> {};
  template <typename... Args>
  FOLLY_INLINE_VARIABLE static constexpr bool is_invocable_v =
      is_invocable<Args...>::value;
  template <typename R, typename... Args>
  struct is_invocable_r : folly::is_invocable_r<R, Invoke, Args...> {};
  template <typename R, typename... Args>
  FOLLY_INLINE_VARIABLE static constexpr bool is_invocable_r_v =
      is_invocable_r<R, Args...>::value;
  template <typename... Args>
  struct is_nothrow_invocable : folly::is_nothrow_invocable<Invoke, Args...> {};
  template <typename... Args>
  FOLLY_INLINE_VARIABLE static constexpr bool is_nothrow_invocable_v =
      is_nothrow_invocable<Args...>::value;
  template <typename R, typename... Args>
  struct is_nothrow_invocable_r
      : folly::is_nothrow_invocable_r<R, Invoke, Args...> {};
  template <typename R, typename... Args>
  FOLLY_INLINE_VARIABLE static constexpr bool is_nothrow_invocable_r_v =
      is_nothrow_invocable_r<R, Args...>::value;
};

} // namespace folly

#define FOLLY_DETAIL_CREATE_FREE_INVOKE_TRAITS_USING_1(_, funcname, ns) \
  using ns::funcname;

#define FOLLY_DETAIL_CREATE_FREE_INVOKE_TRAITS_USING(_, funcname, ...) \
  BOOST_PP_EXPR_IIF(                                                   \
      BOOST_PP_NOT(BOOST_PP_IS_EMPTY(__VA_ARGS__)),                    \
      BOOST_PP_LIST_FOR_EACH(                                          \
          FOLLY_DETAIL_CREATE_FREE_INVOKE_TRAITS_USING_1,              \
          funcname,                                                    \
          BOOST_PP_TUPLE_TO_LIST((__VA_ARGS__))))

/***
 *  FOLLY_CREATE_FREE_INVOKER
 *
 *  Used to create an invoker type bound to a specific free-invocable name.
 *
 *  Example:
 *
 *    FOLLY_CREATE_FREE_INVOKER(foo_invoker, foo);
 *
 *  The type `foo_invoker` is generated in the current namespace and may be used
 *  as follows:
 *
 *    namespace Deep {
 *    struct CanFoo {};
 *    int foo(CanFoo const&, Bar&) { return 1; }
 *    int foo(CanFoo&&, Car&&) noexcept { return 2; }
 *    }
 *
 *    using traits = folly::invoke_traits<foo_invoker>;
 *
 *    traits::invoke(Deep::CanFoo{}, Car{}) // 2
 *
 *    traits::invoke_result<Deep::CanFoo, Bar&> // has member
 *    traits::invoke_result_t<Deep::CanFoo, Bar&> // int
 *    traits::invoke_result<Deep::CanFoo, Bar&&> // empty
 *    traits::invoke_result_t<Deep::CanFoo, Bar&&> // error
 *
 *    traits::is_invocable_v<CanFoo, Bar&> // true
 *    traits::is_invocable_v<CanFoo, Bar&&> // false
 *
 *    traits::is_invocable_r_v<int, CanFoo, Bar&> // true
 *    traits::is_invocable_r_v<char*, CanFoo, Bar&> // false
 *
 *    traits::is_nothrow_invocable_v<CanFoo, Bar&> // false
 *    traits::is_nothrow_invocable_v<CanFoo, Car&&> // true
 *
 *    traits::is_nothrow_invocable_v<int, CanFoo, Bar&> // false
 *    traits::is_nothrow_invocable_v<char*, CanFoo, Bar&> // false
 *    traits::is_nothrow_invocable_v<int, CanFoo, Car&&> // true
 *    traits::is_nothrow_invocable_v<char*, CanFoo, Car&&> // false
 *
 *  When a name has one or more primary definition in a fixed set of namespaces
 *  and alternate definitions in the namespaces of its arguments, the primary
 *  definitions may automatically be found as follows:
 *
 *    FOLLY_CREATE_FREE_INVOKER(swap_invoker, swap, std);
 *
 *  In this case, `swap_invoke_traits::invoke(int&, int&)` will use the primary
 *  definition found in `namespace std` relative to the current namespace, which
 *  may be equivalent to `namespace ::std`. In contrast:
 *
 *    namespace Deep {
 *    struct HasData {};
 *    void swap(HasData&, HasData&) { throw 7; }
 *    }
 *
 *    using traits = invoke_traits<swap_invoker>;
 *
 *    HasData a, b;
 *    traits::invoke(a, b); // throw 7
 */
#define FOLLY_CREATE_FREE_INVOKER(classname, funcname, ...)                \
  namespace classname##__folly_detail_invoke_ns {                          \
    FOLLY_MAYBE_UNUSED void funcname(                                      \
        ::folly::detail::invoke_private_overload&);                        \
    FOLLY_DETAIL_CREATE_FREE_INVOKE_TRAITS_USING(_, funcname, __VA_ARGS__) \
    struct __folly_detail_invoke_obj {                                     \
      template <typename... Args>                                          \
      FOLLY_ERASE_HACK_GCC constexpr auto operator()(Args&&... args) const \
          noexcept(noexcept(funcname(static_cast<Args&&>(args)...)))       \
              -> decltype(funcname(static_cast<Args&&>(args)...)) {        \
        return funcname(static_cast<Args&&>(args)...);                     \
      }                                                                    \
    };                                                                     \
  }                                                                        \
  struct classname                                                         \
      : classname##__folly_detail_invoke_ns::__folly_detail_invoke_obj {}

/***
 *  FOLLY_CREATE_MEMBER_INVOKER
 *
 *  Used to create an invoker type bound to a specific member-invocable name.
 *
 *  Example:
 *
 *    FOLLY_CREATE_MEMBER_INVOKER(foo_invoker, foo);
 *
 *  The type `foo_invoker` is generated in the current namespace and may be used
 *  as follows:
 *
 *    struct CanFoo {
 *      int foo(Bar&) { return 1; }
 *      int foo(Car&&) noexcept { return 2; }
 *    };
 *
 *    using traits = folly::invoke_traits<foo_invoker>;
 *
 *    traits::invoke(CanFoo{}, Car{}) // 2
 *
 *    traits::invoke_result<CanFoo, Bar&> // has member
 *    traits::invoke_result_t<CanFoo, Bar&> // int
 *    traits::invoke_result<CanFoo, Bar&&> // empty
 *    traits::invoke_result_t<CanFoo, Bar&&> // error
 *
 *    traits::is_invocable_v<CanFoo, Bar&> // true
 *    traits::is_invocable_v<CanFoo, Bar&&> // false
 *
 *    traits::is_invocable_r_v<int, CanFoo, Bar&> // true
 *    traits::is_invocable_r_v<char*, CanFoo, Bar&> // false
 *
 *    traits::is_nothrow_invocable_v<CanFoo, Bar&> // false
 *    traits::is_nothrow_invocable_v<CanFoo, Car&&> // true
 *
 *    traits::is_nothrow_invocable_v<int, CanFoo, Bar&> // false
 *    traits::is_nothrow_invocable_v<char*, CanFoo, Bar&> // false
 *    traits::is_nothrow_invocable_v<int, CanFoo, Car&&> // true
 *    traits::is_nothrow_invocable_v<char*, CanFoo, Car&&> // false
 */
#define FOLLY_CREATE_MEMBER_INVOKER(classname, membername)                 \
  struct classname {                                                       \
    template <typename O, typename... Args>                                \
    FOLLY_ERASE_HACK_GCC constexpr auto operator()(O&& o, Args&&... args)  \
        const noexcept(noexcept(                                           \
            static_cast<O&&>(o).membername(static_cast<Args&&>(args)...))) \
            -> decltype(static_cast<O&&>(o).membername(                    \
                static_cast<Args&&>(args)...)) {                           \
      return static_cast<O&&>(o).membername(static_cast<Args&&>(args)...); \
    }                                                                      \
  }

/***
 *  FOLLY_CREATE_STATIC_MEMBER_INVOKER
 *
 *  Used to create an invoker type template bound to a specific static-member-
 *  invocable name.
 *
 *  Example:
 *
 *    FOLLY_CREATE_STATIC_MEMBER_INVOKER(foo_invoker, foo);
 *
 *  The type template `foo_invoker` is generated in the current namespace and
 *  may be used as follows:
 *
 *    struct CanFoo {
 *      static int foo(Bar&) { return 1; }
 *      static int foo(Car&&) noexcept { return 2; }
 *    };
 *
 *    using traits = folly::invoke_traits<foo_invoker<CanFoo>>;
 *
 *    traits::invoke(Car{}) // 2
 *
 *    traits::invoke_result<Bar&> // has member
 *    traits::invoke_result_t<Bar&> // int
 *    traits::invoke_result<Bar&&> // empty
 *    traits::invoke_result_t<Bar&&> // error
 *
 *    traits::is_invocable_v<Bar&> // true
 *    traits::is_invocable_v<Bar&&> // false
 *
 *    traits::is_invocable_r_v<int, Bar&> // true
 *    traits::is_invocable_r_v<char*, Bar&> // false
 *
 *    traits::is_nothrow_invocable_v<Bar&> // false
 *    traits::is_nothrow_invocable_v<Car&&> // true
 *
 *    traits::is_nothrow_invocable_v<int, Bar&> // false
 *    traits::is_nothrow_invocable_v<char*, Bar&> // false
 *    traits::is_nothrow_invocable_v<int, Car&&> // true
 *    traits::is_nothrow_invocable_v<char*, Car&&> // false
 */
#define FOLLY_CREATE_STATIC_MEMBER_INVOKER(classname, membername)       \
  template <typename T>                                                 \
  struct classname {                                                    \
    template <typename... Args>                                         \
    FOLLY_ERASE constexpr auto operator()(Args&&... args) const         \
        noexcept(noexcept(T::membername(static_cast<Args&&>(args)...))) \
            -> decltype(T::membername(static_cast<Args&&>(args)...)) {  \
      return T::membername(static_cast<Args&&>(args)...);               \
    }                                                                   \
  }

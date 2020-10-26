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

#include <cstdint>
#include <limits>
#include <type_traits>
#include <utility>

#include <folly/CPortability.h>
#include <folly/Portability.h>
#include <folly/Traits.h>

namespace folly {

/**
 *  copy
 *
 *  Usable when you have a function with two overloads:
 *
 *      class MyData;
 *      void something(MyData&&);
 *      void something(const MyData&);
 *
 *  Where the purpose is to make copies and moves explicit without having to
 *  spell out the full type names - in this case, for copies, to invoke copy
 *  constructors.
 *
 *  When the caller wants to pass a copy of an lvalue, the caller may:
 *
 *      void foo() {
 *        MyData data;
 *        something(folly::copy(data)); // explicit copy
 *        something(std::move(data)); // explicit move
 *        something(data); // const& - neither move nor copy
 *      }
 *
 *  Note: If passed an rvalue, invokes the move-ctor, not the copy-ctor. This
 *  can be used to to force a move, where just using std::move would not:
 *
 *      folly::copy(std::move(data)); // force-move, not just a cast to &&
 *
 *  Note: The following text appears in the standard:
 *
 *  > In several places in this Clause the operation //DECAY_COPY(x)// is used.
 *  > All such uses mean call the function `decay_copy(x)` and use the result,
 *  > where `decay_copy` is defined as follows:
 *  >
 *  >   template <class T> decay_t<T> decay_copy(T&& v)
 *  >     { return std::forward<T>(v); }
 *  >
 *  > http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2014/n4296.pdf
 *  >   30.2.6 `decay_copy` [thread.decaycopy].
 *
 *  We mimic it, with a `noexcept` specifier for good measure.
 */

template <typename T>
constexpr typename std::decay<T>::type copy(T&& value) noexcept(
    noexcept(typename std::decay<T>::type(std::forward<T>(value)))) {
  return std::forward<T>(value);
}

/**
 * A simple helper for getting a constant reference to an object.
 *
 * Example:
 *
 *   std::vector<int> v{1,2,3};
 *   // The following two lines are equivalent:
 *   auto a = const_cast<const std::vector<int>&>(v).begin();
 *   auto b = folly::as_const(v).begin();
 *
 * Like C++17's std::as_const. See http://wg21.link/p0007
 */
#if __cpp_lib_as_const || _LIBCPP_STD_VER > 14 || _MSC_VER

/* using override */ using std::as_const;

#else

template <class T>
constexpr T const& as_const(T& t) noexcept {
  return t;
}

template <class T>
void as_const(T const&&) = delete;

#endif

//  mimic: forward_like, p0847r0
template <typename Src, typename Dst>
constexpr like_t<Src, Dst>&& forward_like(Dst&& dst) noexcept {
  return static_cast<like_t<Src, Dst>&&>(std::forward<Dst>(dst));
}

/**
 *  Backports from C++17 of:
 *    std::in_place_t
 *    std::in_place_type_t
 *    std::in_place_index_t
 *    std::in_place
 *    std::in_place_type
 *    std::in_place_index
 */

struct in_place_tag {};
template <class>
struct in_place_type_tag {};
template <std::size_t>
struct in_place_index_tag {};

using in_place_t = in_place_tag (&)(in_place_tag);
template <class T>
using in_place_type_t = in_place_type_tag<T> (&)(in_place_type_tag<T>);
template <std::size_t I>
using in_place_index_t = in_place_index_tag<I> (&)(in_place_index_tag<I>);

inline in_place_tag in_place(in_place_tag = {}) {
  return {};
}
template <class T>
inline in_place_type_tag<T> in_place_type(in_place_type_tag<T> = {}) {
  return {};
}
template <std::size_t I>
inline in_place_index_tag<I> in_place_index(in_place_index_tag<I> = {}) {
  return {};
}

/**
 * Initializer lists are a powerful compile time syntax introduced in C++11
 * but due to their often conflicting syntax they are not used by APIs for
 * construction.
 *
 * Further standard conforming compilers *strongly* favor an
 * std::initializer_list overload for construction if one exists.  The
 * following is a simple tag used to disambiguate construction with
 * initializer lists and regular uniform initialization.
 *
 * For example consider the following case
 *
 *  class Something {
 *  public:
 *    explicit Something(int);
 *    Something(std::intiializer_list<int>);
 *
 *    operator int();
 *  };
 *
 *  ...
 *  Something something{1}; // SURPRISE!!
 *
 * The last call to instantiate the Something object will go to the
 * initializer_list overload.  Which may be surprising to users.
 *
 * If however this tag was used to disambiguate such construction it would be
 * easy for users to see which construction overload their code was referring
 * to.  For example
 *
 *  class Something {
 *  public:
 *    explicit Something(int);
 *    Something(folly::initlist_construct_t, std::initializer_list<int>);
 *
 *    operator int();
 *  };
 *
 *  ...
 *  Something something_one{1}; // not the initializer_list overload
 *  Something something_two{folly::initlist_construct, {1}}; // correct
 */
struct initlist_construct_t {};
constexpr initlist_construct_t initlist_construct{};

//  sorted_unique_t, sorted_unique
//
//  A generic tag type and value to indicate that some constructor or method
//  accepts a container in which the values are sorted and unique.
//
//  Example:
//
//    void takes_numbers(folly::sorted_unique_t, std::vector<int> alist) {
//      assert(std::is_sorted(alist.begin(), alist.end()));
//      assert(std::unique(alist.begin(), alist.end()) == alist.end());
//      for (i : alist) {
//        // some behavior which safe only when alist is sorted and unique
//      }
//    }
//    void takes_numbers(std::vector<int> alist) {
//      std::sort(alist.begin(), alist.end());
//      alist.erase(std::unique(alist.begin(), alist.end()), alist.end());
//      takes_numbers(folly::sorted_unique, alist);
//    }
//
//  mimic: std::sorted_unique_t, std::sorted_unique, p0429r6
struct sorted_unique_t {};
constexpr sorted_unique_t sorted_unique;

//  sorted_equivalent_t, sorted_equivalent
//
//  A generic tag type and value to indicate that some constructor or method
//  accepts a container in which the values are sorted but not necessarily
//  unique.
//
//  Example:
//
//    void takes_numbers(folly::sorted_equivalent_t, std::vector<int> alist) {
//      assert(std::is_sorted(alist.begin(), alist.end()));
//      for (i : alist) {
//        // some behavior which safe only when alist is sorted
//      }
//    }
//    void takes_numbers(std::vector<int> alist) {
//      std::sort(alist.begin(), alist.end());
//      takes_numbers(folly::sorted_equivalent, alist);
//    }
//
//  mimic: std::sorted_equivalent_t, std::sorted_equivalent, p0429r6
struct sorted_equivalent_t {};
constexpr sorted_equivalent_t sorted_equivalent;

template <typename T>
struct transparent : T {
  using is_transparent = void;
  using T::T;
};

/**
 * A simple function object that passes its argument through unchanged.
 *
 * Example:
 *
 *   int i = 42;
 *   int &j = Identity()(i);
 *   assert(&i == &j);
 *
 * Warning: passing a prvalue through Identity turns it into an xvalue,
 * which can effect whether lifetime extension occurs or not. For instance:
 *
 *   auto&& x = std::make_unique<int>(42);
 *   cout << *x ; // OK, x refers to a valid unique_ptr.
 *
 *   auto&& y = Identity()(std::make_unique<int>(42));
 *   cout << *y ; // ERROR: y did not lifetime-extend the unique_ptr. It
 *                // is no longer valid
 */
struct Identity {
  template <class T>
  constexpr T&& operator()(T&& x) const noexcept {
    return static_cast<T&&>(x);
  }
};

namespace moveonly_ { // Protection from unintended ADL.

/**
 * Disallow copy but not move in derived types. This is essentially
 * boost::noncopyable (the implementation is almost identical) but it
 * doesn't delete move constructor and move assignment.
 */
class MoveOnly {
 protected:
  constexpr MoveOnly() = default;
  ~MoveOnly() = default;

  MoveOnly(MoveOnly&&) = default;
  MoveOnly& operator=(MoveOnly&&) = default;
  MoveOnly(const MoveOnly&) = delete;
  MoveOnly& operator=(const MoveOnly&) = delete;
};

} // namespace moveonly_

using MoveOnly = moveonly_::MoveOnly;

template <typename T>
constexpr auto to_signed(T const& t) -> typename std::make_signed<T>::type {
  using S = typename std::make_signed<T>::type;
  // note: static_cast<S>(t) would be more straightforward, but it would also be
  // implementation-defined behavior and that is typically to be avoided; the
  // following code optimized into the same thing, though
  constexpr auto m = static_cast<T>(std::numeric_limits<S>::max());
  return m < t ? -static_cast<S>(~t) + S{-1} : static_cast<S>(t);
}

template <typename T>
constexpr auto to_unsigned(T const& t) -> typename std::make_unsigned<T>::type {
  using U = typename std::make_unsigned<T>::type;
  return static_cast<U>(t);
}

template <typename Src>
class to_narrow_convertible {
 public:
  static_assert(std::is_integral<Src>::value, "not an integer");

  explicit constexpr to_narrow_convertible(Src const& value) noexcept
      : value_(value) {}
#if __cplusplus >= 201703L
  explicit to_narrow_convertible(to_narrow_convertible const&) = default;
  explicit to_narrow_convertible(to_narrow_convertible&&) = default;
#else
  to_narrow_convertible(to_narrow_convertible const&) = default;
  to_narrow_convertible(to_narrow_convertible&&) = default;
#endif
  to_narrow_convertible& operator=(to_narrow_convertible const&) = default;
  to_narrow_convertible& operator=(to_narrow_convertible&&) = default;

  template <
      typename Dst,
      std::enable_if_t<
          std::is_integral<Dst>::value &&
              std::is_signed<Dst>::value == std::is_signed<Src>::value,
          int> = 0>
  /* implicit */ constexpr operator Dst() const noexcept {
    FOLLY_PUSH_WARNING
    FOLLY_MSVC_DISABLE_WARNING(4244) // lossy conversion: arguments
    FOLLY_MSVC_DISABLE_WARNING(4267) // lossy conversion: variables
    FOLLY_GNU_DISABLE_WARNING("-Wconversion")
    return value_;
    FOLLY_POP_WARNING
  }

 private:
  Src value_;
};

//  to_narrow
//
//  A utility for performing explicit possibly-narrowing integral conversion
//  without specifying the destination type. Does not permit changing signs.
//  Sometimes preferable to static_cast<Dst>(src) to document the intended
//  semantics of the cast.
//
//  Models explicit conversion with an elided destination type. Sits in between
//  a stricter explicit conversion with a named destination type and a more
//  lenient implicit conversion. Implemented with implicit conversion in order
//  to take advantage of the undefined-behavior sanitizer's inspection of all
//  implicit conversions - it checks for truncation, with suppressions in place
//  for warnings which guard against narrowing implicit conversions.
template <typename Src>
constexpr auto to_narrow(Src const& src) -> to_narrow_convertible<Src> {
  return to_narrow_convertible<Src>{src};
}

template <class E>
constexpr std::underlying_type_t<E> to_underlying(E e) noexcept {
  static_assert(std::is_enum<E>::value, "not an enum type");
  return static_cast<std::underlying_type_t<E>>(e);
}

} // namespace folly

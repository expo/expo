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

#include <atomic>
#include <type_traits>

#include <folly/Traits.h>

namespace folly {

namespace detail {

template <typename T>
struct atomic_ref_base {
  static_assert(sizeof(T) == sizeof(std::atomic<T>), "size mismatch");
  static_assert(alignof(T) == alignof(std::atomic<T>), "alignment mismatch");
  static_assert(is_trivially_copyable_v<T>, "value not trivially-copyable");

  explicit atomic_ref_base(T& ref) : ref_(ref) {}
  atomic_ref_base(atomic_ref_base const&) = default;

  void store(T desired, std::memory_order order = std::memory_order_seq_cst)
      const noexcept {
    return atomic().store(desired, order);
  }

  T load(std::memory_order order = std::memory_order_seq_cst) const noexcept {
    return atomic().load(order);
  }

  std::atomic<T>& atomic() const noexcept {
    return reinterpret_cast<std::atomic<T>&>(ref_); // ub dragons be here
  }

  T& ref_;
};

template <typename T>
struct atomic_ref_integral_base : atomic_ref_base<T> {
  using atomic_ref_base<T>::atomic_ref_base;
  using atomic_ref_base<T>::atomic;

  T fetch_add(T arg, std::memory_order order = std::memory_order_seq_cst) const
      noexcept {
    return atomic().fetch_add(arg, order);
  }

  T fetch_sub(T arg, std::memory_order order = std::memory_order_seq_cst) const
      noexcept {
    return atomic().fetch_sub(arg, order);
  }
};

template <typename T>
using atomic_ref_select = conditional_t<
    std::is_integral<T>::value,
    atomic_ref_integral_base<T>,
    atomic_ref_base<T>>;

} // namespace detail

//  atomic_ref
//
//  A very partial backport of std::atomic_ref from C++20, limited for now to
//  the common operations on counters for now. May become a complete backport
//  in the future.
//
//  Relies on the assumption that `T&` is reinterpretable as `std::atomic<T>&`.
//  And that the required alignment for that reinterpretation is `alignof(T)`.
//  When that is not the case, *kaboom*.
//
//  mimic: std::atomic_ref, C++20
template <typename T>
class atomic_ref : public detail::atomic_ref_select<T> {
 private:
  using base = detail::atomic_ref_select<T>;

 public:
  using base::base;
};

struct make_atomic_ref_t {
  template <
      typename T,
      std::enable_if_t<
          is_trivially_copyable_v<T> && sizeof(T) == sizeof(std::atomic<T>) &&
              alignof(T) == alignof(std::atomic<T>),
          int> = 0>
  atomic_ref<T> operator()(T& ref) const {
    return atomic_ref<T>{ref};
  }
};

FOLLY_INLINE_VARIABLE constexpr make_atomic_ref_t make_atomic_ref;

} // namespace folly

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

#include <cstddef>
#include <type_traits>
#include <utility>

#include <folly/Utility.h>
#include <folly/lang/Align.h>

namespace folly {

template <typename T, std::size_t Align>
class aligned {
  static_assert(!(Align & (Align - 1)), "alignment not a power of two");
  static_assert(alignof(T) <= Align, "alignment too small");

 public:
  using alignment = index_constant<Align>;
  using value_type = T;

  aligned() = default;
  aligned(aligned const&) = default;
  aligned(aligned&&) = default;
  template <
      typename S = T,
      std::enable_if_t<std::is_copy_constructible<S>::value, int> = 0>
  aligned(T const& value) noexcept(std::is_nothrow_copy_constructible<T>::value)
      : value_(value) {}
  template <
      typename S = T,
      std::enable_if_t<std::is_move_constructible<S>::value, int> = 0>
  aligned(T&& value) noexcept(std::is_nothrow_move_constructible<T>::value)
      : value_(static_cast<T&&>(value)) {}
  template <
      typename... A,
      std::enable_if_t<std::is_constructible<T, A...>::value, int> = 0>
  explicit aligned(in_place_t, A&&... a) noexcept(
      std::is_nothrow_constructible<T, A...>::value)
      : value_(static_cast<A&&>(a)...) {}

  aligned& operator=(aligned const&) = default;
  aligned& operator=(aligned&&) = default;
  template <
      typename S = T,
      std::enable_if_t<std::is_copy_assignable<S>::value, int> = 0>
  aligned& operator=(T const& value) noexcept(
      std::is_nothrow_copy_assignable<T>::value) {
    value_ = value;
    return *this;
  }
  template <
      typename S = T,
      std::enable_if_t<std::is_move_assignable<S>::value, int> = 0>
  aligned& operator=(T&& value) noexcept(
      std::is_nothrow_move_assignable<T>::value) {
    value_ = std::move(value);
    return *this;
  }

  T* get() noexcept {
    return &value_;
  }
  T const* get() const noexcept {
    return &value_;
  }
  T* operator->() noexcept {
    return &value_;
  }
  T const* operator->() const noexcept {
    return &value_;
  }
  T& operator*() noexcept {
    return value_;
  }
  T const& operator*() const noexcept {
    return value_;
  }

 private:
  alignas(Align) T value_;
};

template <typename T>
using cacheline_aligned = aligned<
    T,
    (cacheline_align_v < alignof(T) ? alignof(T) : cacheline_align_v)>;

} // namespace folly

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

#include <folly/Portability.h>
#include <folly/Traits.h>

#include <atomic>
#include <cassert>
#include <cstdint>
#include <tuple>
#include <type_traits>

#ifdef _WIN32
#include <intrin.h>
#endif

namespace folly {

namespace detail {

constexpr std::memory_order atomic_compare_exchange_succ(
    bool cond,
    std::memory_order succ,
    std::memory_order fail) {
  constexpr auto const relaxed = std::memory_order_relaxed;
  constexpr auto const release = std::memory_order_release;
  constexpr auto const acq_rel = std::memory_order_acq_rel;

  assert(fail != release);
  assert(fail != acq_rel);

  //  Clang TSAN ignores the passed failure order and infers failure order from
  //  success order in atomic compare-exchange operations, which is broken for
  //  cases like success-release/failure-acquire, so return a success order with
  //  the failure order mixed in.
  auto const bump = succ == release ? acq_rel : succ;
  auto const high = fail < bump ? bump : fail;
  return !cond || fail == relaxed ? succ : high;
}

constexpr std::memory_order atomic_compare_exchange_succ(
    std::memory_order succ,
    std::memory_order fail) {
  constexpr auto const cond = kIsSanitizeThread && kIsClang;
  return atomic_compare_exchange_succ(cond, succ, fail);
}

} // namespace detail

template <typename T>
bool atomic_compare_exchange_weak_explicit(
    std::atomic<T>* obj,
    T* expected,
    T desired,
    std::memory_order succ,
    std::memory_order fail) {
  succ = detail::atomic_compare_exchange_succ(succ, fail);
  return std::atomic_compare_exchange_weak_explicit(
      obj, expected, desired, succ, fail);
}

template <typename T>
bool atomic_compare_exchange_strong_explicit(
    std::atomic<T>* obj,
    T* expected,
    T desired,
    std::memory_order succ,
    std::memory_order fail) {
  succ = detail::atomic_compare_exchange_succ(succ, fail);
  return std::atomic_compare_exchange_strong_explicit(
      obj, expected, desired, succ, fail);
}

namespace detail {

// TODO: Remove the non-default implementations when both gcc and clang
// can recognize single bit set/reset patterns and compile them down to locked
// bts and btr instructions.
//
// Currently, at the time of writing it seems like gcc7 and greater can make
// this optimization and clang cannot - https://gcc.godbolt.org/z/Q83rxX

template <typename Atomic>
bool atomic_fetch_set_default(
    Atomic& atomic,
    std::size_t bit,
    std::memory_order order) {
  using Integer = decltype(atomic.load());
  auto mask = Integer{0b1} << static_cast<Integer>(bit);
  return (atomic.fetch_or(mask, order) & mask);
}

template <typename Atomic>
bool atomic_fetch_reset_default(
    Atomic& atomic,
    std::size_t bit,
    std::memory_order order) {
  using Integer = decltype(atomic.load());
  auto mask = Integer{0b1} << static_cast<Integer>(bit);
  return (atomic.fetch_and(static_cast<Integer>(~mask), order) & mask);
}

/**
 * A simple trait to determine if the given type is an instantiation of
 * std::atomic
 */
template <typename T>
constexpr auto is_atomic = false;
template <typename Integer>
constexpr auto is_atomic<std::atomic<Integer>> = true;

#if FOLLY_X64

#if defined(_MSC_VER)

template <typename Integer>
inline bool atomic_fetch_set_x86(
    std::atomic<Integer>& atomic,
    std::size_t bit,
    std::memory_order order) {
  static_assert(alignof(std::atomic<Integer>) == alignof(Integer), "");
  static_assert(sizeof(std::atomic<Integer>) == sizeof(Integer), "");
  assert(atomic.is_lock_free());

  if /* constexpr */ (sizeof(Integer) == 4) {
    return _interlockedbittestandset(
        reinterpret_cast<volatile long*>(&atomic), static_cast<long>(bit));
  } else if /* constexpr */ (sizeof(Integer) == 8) {
    return _interlockedbittestandset64(
        reinterpret_cast<volatile long long*>(&atomic),
        static_cast<long long>(bit));
  } else {
    assert(sizeof(Integer) != 4 && sizeof(Integer) != 8);
    return atomic_fetch_set_default(atomic, bit, order);
  }
}

template <typename Atomic>
inline bool
atomic_fetch_set_x86(Atomic& atomic, std::size_t bit, std::memory_order order) {
  static_assert(!std::is_same<Atomic, std::atomic<std::uint32_t>>{}, "");
  static_assert(!std::is_same<Atomic, std::atomic<std::uint64_t>>{}, "");
  return atomic_fetch_set_default(atomic, bit, order);
}

template <typename Integer>
inline bool atomic_fetch_reset_x86(
    std::atomic<Integer>& atomic,
    std::size_t bit,
    std::memory_order order) {
  static_assert(alignof(std::atomic<Integer>) == alignof(Integer), "");
  static_assert(sizeof(std::atomic<Integer>) == sizeof(Integer), "");
  assert(atomic.is_lock_free());

  if /* constexpr */ (sizeof(Integer) == 4) {
    return _interlockedbittestandreset(
        reinterpret_cast<volatile long*>(&atomic), static_cast<long>(bit));
  } else if /* constexpr */ (sizeof(Integer) == 8) {
    return _interlockedbittestandreset64(
        reinterpret_cast<volatile long long*>(&atomic),
        static_cast<long long>(bit));
  } else {
    assert(sizeof(Integer) != 4 && sizeof(Integer) != 8);
    return atomic_fetch_reset_default(atomic, bit, order);
  }
}

template <typename Atomic>
inline bool
atomic_fetch_reset_x86(Atomic& atomic, std::size_t bit, std::memory_order mo) {
  static_assert(!std::is_same<Atomic, std::atomic<std::uint32_t>>{}, "");
  static_assert(!std::is_same<Atomic, std::atomic<std::uint64_t>>{}, "");
  return atomic_fetch_reset_default(atomic, bit, mo);
}

#else

template <typename Integer>
inline bool atomic_fetch_set_x86(
    std::atomic<Integer>& atomic,
    std::size_t bit,
    std::memory_order order) {
  auto previous = false;

  if /* constexpr */ (sizeof(Integer) == 2) {
    auto pointer = reinterpret_cast<std::uint16_t*>(&atomic);
    asm volatile("lock; btsw %1, (%2); setc %0"
                 : "=r"(previous)
                 : "ri"(static_cast<std::uint16_t>(bit)), "r"(pointer)
                 : "memory", "flags");
  } else if /* constexpr */ (sizeof(Integer) == 4) {
    auto pointer = reinterpret_cast<std::uint32_t*>(&atomic);
    asm volatile("lock; btsl %1, (%2); setc %0"
                 : "=r"(previous)
                 : "ri"(static_cast<std::uint32_t>(bit)), "r"(pointer)
                 : "memory", "flags");
  } else if /* constexpr */ (sizeof(Integer) == 8) {
    auto pointer = reinterpret_cast<std::uint64_t*>(&atomic);
    asm volatile("lock; btsq %1, (%2); setc %0"
                 : "=r"(previous)
                 : "ri"(static_cast<std::uint64_t>(bit)), "r"(pointer)
                 : "memory", "flags");
  } else {
    assert(sizeof(Integer) == 1);
    return atomic_fetch_set_default(atomic, bit, order);
  }

  return previous;
}

template <typename Atomic>
inline bool
atomic_fetch_set_x86(Atomic& atomic, std::size_t bit, std::memory_order order) {
  static_assert(!is_atomic<Atomic>, "");
  return atomic_fetch_set_default(atomic, bit, order);
}

template <typename Integer>
inline bool atomic_fetch_reset_x86(
    std::atomic<Integer>& atomic,
    std::size_t bit,
    std::memory_order order) {
  auto previous = false;

  if /* constexpr */ (sizeof(Integer) == 2) {
    auto pointer = reinterpret_cast<std::uint16_t*>(&atomic);
    asm volatile("lock; btrw %1, (%2); setc %0"
                 : "=r"(previous)
                 : "ri"(static_cast<std::uint16_t>(bit)), "r"(pointer)
                 : "memory", "flags");
  } else if /* constexpr */ (sizeof(Integer) == 4) {
    auto pointer = reinterpret_cast<std::uint32_t*>(&atomic);
    asm volatile("lock; btrl %1, (%2); setc %0"
                 : "=r"(previous)
                 : "ri"(static_cast<std::uint32_t>(bit)), "r"(pointer)
                 : "memory", "flags");
  } else if /* constexpr */ (sizeof(Integer) == 8) {
    auto pointer = reinterpret_cast<std::uint64_t*>(&atomic);
    asm volatile("lock; btrq %1, (%2); setc %0"
                 : "=r"(previous)
                 : "ri"(static_cast<std::uint64_t>(bit)), "r"(pointer)
                 : "memory", "flags");
  } else {
    assert(sizeof(Integer) == 1);
    return atomic_fetch_reset_default(atomic, bit, order);
  }

  return previous;
}

template <typename Atomic>
bool atomic_fetch_reset_x86(
    Atomic& atomic,
    std::size_t bit,
    std::memory_order order) {
  static_assert(!is_atomic<Atomic>, "");
  return atomic_fetch_reset_default(atomic, bit, order);
}

#endif

#else

template <typename Atomic>
bool atomic_fetch_set_x86(Atomic&, std::size_t, std::memory_order) noexcept {
  // This should never be called on non x86_64 platforms.
  std::terminate();
}
template <typename Atomic>
bool atomic_fetch_reset_x86(Atomic&, std::size_t, std::memory_order) noexcept {
  // This should never be called on non x86_64 platforms.
  std::terminate();
}

#endif

} // namespace detail

template <typename Atomic>
bool atomic_fetch_set(Atomic& atomic, std::size_t bit, std::memory_order mo) {
  using Integer = decltype(atomic.load());
  static_assert(std::is_unsigned<Integer>{}, "");
  static_assert(!std::is_const<Atomic>{}, "");
  assert(bit < (sizeof(Integer) * 8));

  // do the optimized thing on x86 builds.  Also, some versions of TSAN do not
  // properly instrument the inline assembly, so avoid it when TSAN is enabled
  if (folly::kIsArchAmd64 && !folly::kIsSanitizeThread) {
    return detail::atomic_fetch_set_x86(atomic, bit, mo);
  } else {
    // otherwise default to the default implementation using fetch_or()
    return detail::atomic_fetch_set_default(atomic, bit, mo);
  }
}

template <typename Atomic>
bool atomic_fetch_reset(Atomic& atomic, std::size_t bit, std::memory_order mo) {
  using Integer = decltype(atomic.load());
  static_assert(std::is_unsigned<Integer>{}, "");
  static_assert(!std::is_const<Atomic>{}, "");
  assert(bit < (sizeof(Integer) * 8));

  // do the optimized thing on x86 builds.  Also, some versions of TSAN do not
  // properly instrument the inline assembly, so avoid it when TSAN is enabled
  if (folly::kIsArchAmd64 && !folly::kIsSanitizeThread) {
    return detail::atomic_fetch_reset_x86(atomic, bit, mo);
  } else {
    // otherwise default to the default implementation using fetch_and()
    return detail::atomic_fetch_reset_default(atomic, bit, mo);
  }
}

} // namespace folly

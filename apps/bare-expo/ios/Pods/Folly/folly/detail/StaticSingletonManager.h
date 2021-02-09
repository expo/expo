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
#include <typeinfo>

#include <folly/CPortability.h>
#include <folly/Indestructible.h>
#include <folly/Likely.h>
#include <folly/detail/Singleton.h>
#include <folly/lang/TypeInfo.h>

namespace folly {
namespace detail {

// Does not support dynamic loading but works without rtti.
class StaticSingletonManagerSansRtti {
 public:
  template <typename T, typename Tag>
  FOLLY_EXPORT FOLLY_ALWAYS_INLINE static T& create() {
    static std::atomic<T*> cache{};
    auto const pointer = cache.load(std::memory_order_acquire);
    return FOLLY_LIKELY(!!pointer) ? *pointer : create_<T, Tag>(cache);
  }

 private:
  template <typename T, typename Tag>
  FOLLY_EXPORT FOLLY_NOINLINE static T& create_(std::atomic<T*>& cache) {
    static Indestructible<T> instance;
    cache.store(&*instance, std::memory_order_release);
    return *instance;
  }
};

// This internal-use-only class is used to create all leaked Meyers singletons.
// It guarantees that only one instance of every such singleton will ever be
// created, even when requested from different compilation units linked
// dynamically.
//
// Supports dynamic loading but requires rtti.
class StaticSingletonManagerWithRtti {
 public:
  template <typename T, typename Tag>
  FOLLY_EXPORT FOLLY_ALWAYS_INLINE static T& create() {
    // gcc and clang behave poorly if typeid is hidden behind a non-constexpr
    // function, but typeid is not constexpr under msvc
    static Arg arg{{nullptr}, FOLLY_TYPE_INFO_OF(tag_t<T, Tag>), make<T>};
    auto const v = arg.cache.load(std::memory_order_acquire);
    auto const p = FOLLY_LIKELY(!!v) ? v : create_<noexcept(T())>(arg);
    return *static_cast<T*>(p);
  }

 private:
  using Key = std::type_info;
  using Make = void*();
  using Cache = std::atomic<void*>;
  struct Arg {
    Cache cache; // should be first field
    Key const* key;
    Make& make;
  };

  template <typename T>
  static void* make() {
    return new T();
  }

  template <bool Noexcept>
  FOLLY_ERASE static void* create_(Arg& arg) noexcept(Noexcept) {
    return create_(arg);
  }
  FOLLY_NOINLINE static void* create_(Arg& arg);
};

using StaticSingletonManager = std::conditional_t<
    kHasRtti,
    StaticSingletonManagerWithRtti,
    StaticSingletonManagerSansRtti>;

template <typename T, typename Tag>
FOLLY_ERASE T& createGlobal() {
  return StaticSingletonManager::create<T, Tag>();
}

} // namespace detail
} // namespace folly

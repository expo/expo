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

#include <utility>

#include <folly/container/detail/F14Defaults.h>
#include <folly/memory/MemoryResource.h>

namespace folly {
template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>,
    typename Alloc = f14::DefaultAlloc<std::pair<Key const, Mapped>>>
class F14NodeMap;

template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>,
    typename Alloc = f14::DefaultAlloc<std::pair<Key const, Mapped>>>
class F14ValueMap;

template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>,
    typename Alloc = f14::DefaultAlloc<std::pair<Key const, Mapped>>>
class F14VectorMap;

template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>,
    typename Alloc = f14::DefaultAlloc<std::pair<Key const, Mapped>>>
class F14FastMap;

#if FOLLY_HAS_MEMORY_RESOURCE
namespace pmr {
template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>>
using F14NodeMap = folly::F14NodeMap<
    Key,
    Mapped,
    Hasher,
    KeyEqual,
    folly::detail::std_pmr::polymorphic_allocator<
        std::pair<Key const, Mapped>>>;

template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>>
using F14ValueMap = folly::F14ValueMap<
    Key,
    Mapped,
    Hasher,
    KeyEqual,
    folly::detail::std_pmr::polymorphic_allocator<
        std::pair<Key const, Mapped>>>;

template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>>
using F14VectorMap = folly::F14VectorMap<
    Key,
    Mapped,
    Hasher,
    KeyEqual,
    folly::detail::std_pmr::polymorphic_allocator<
        std::pair<Key const, Mapped>>>;

template <
    typename Key,
    typename Mapped,
    typename Hasher = f14::DefaultHasher<Key>,
    typename KeyEqual = f14::DefaultKeyEqual<Key>>
using F14FastMap = folly::F14FastMap<
    Key,
    Mapped,
    Hasher,
    KeyEqual,
    folly::detail::std_pmr::polymorphic_allocator<
        std::pair<Key const, Mapped>>>;
} // namespace pmr
#endif // FOLLY_HAS_MEMORY_RESOURCE

} // namespace folly

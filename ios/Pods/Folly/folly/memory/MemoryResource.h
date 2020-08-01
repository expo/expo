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

#if defined(__has_include) && __cplusplus >= 201703L

#if __has_include(<memory_resource>)

#define FOLLY_HAS_MEMORY_RESOURCE 1
#include <memory_resource> // @manual
namespace folly {
namespace detail {
namespace std_pmr = ::std::pmr;
} // namespace detail
} // namespace folly

// Ignore experimental/memory_resource for libc++ so that all programs
// don't need to explicitly link the c++experimental lib
#elif !defined(_LIBCPP_VERSION) && __has_include(<experimental/memory_resource>)

#define FOLLY_HAS_MEMORY_RESOURCE 1
#include <experimental/memory_resource> // @manual
namespace folly {
namespace detail {
namespace std_pmr = ::std::experimental::pmr;
} // namespace detail
} // namespace folly

#else

#define FOLLY_HAS_MEMORY_RESOURCE 0

#endif

#else // __has_include

#define FOLLY_HAS_MEMORY_RESOURCE 0

#endif // __has_include

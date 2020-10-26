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
#include <mutex>

namespace folly {

/**
 * Given a mutex, return a RAII lock type templated on the type of the mutex
 *
 *    auto lck = folly::make_unique_lock(mutex);
 *
 * After C++17, this function will no longer be useful because constructor
 * type deduction can be used for the same purpose, and is also shorter to
 * type.  Note that we prepend the function with "make_" for consistency with
 * standard library functions like "make_tuple", "make_pair", etc
 *
 *    auto lck = std::unique_lock{mutex};
 *
 * Till we have C++17 and constructor type deduction this function offers
 * the convenience of doing the same
 *
 * The tail of arguments after the mutex will be forwarded to the constructor
 * of std::unique_lock
 */
template <typename Mutex, typename... Args>
FOLLY_NODISCARD std::unique_lock<Mutex> make_unique_lock(
    Mutex& mutex,
    Args&&... args) {
  return std::unique_lock<Mutex>{mutex, std::forward<Args>(args)...};
}

} // namespace folly

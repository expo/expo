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

#include <cassert>
#include <limits>
#include <type_traits>

#include <folly/Likely.h>

namespace folly {
template <typename T, typename = std::enable_if_t<std::is_unsigned<T>::value>>
bool checked_add(T* result, T a, T b) {
  assert(result != nullptr);
  if (FOLLY_LIKELY(a < std::numeric_limits<T>::max() - b)) {
    *result = a + b;
    return true;
  } else {
    *result = {};
    return false;
  }
}
} // namespace folly

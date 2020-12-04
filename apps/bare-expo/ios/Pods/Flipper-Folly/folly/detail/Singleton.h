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

#include <type_traits>

#include <folly/Traits.h>

namespace folly {
namespace detail {

struct DefaultTag {};

template <typename T>
struct DefaultMake {
  struct Heap {
    std::unique_ptr<T> ptr{std::make_unique<T>()};
    /* implicit */ operator T&() {
      return *ptr;
    }
  };

  using is_returnable = StrictDisjunction<
      bool_constant<__cplusplus >= 201703ULL>,
      std::is_copy_constructible<T>,
      std::is_move_constructible<T>>;
  using type = std::conditional_t<is_returnable::value, T, Heap>;

  type operator()() const {
    return type();
  }
};

} // namespace detail
} // namespace folly

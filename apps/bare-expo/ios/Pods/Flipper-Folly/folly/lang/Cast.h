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

#include <memory>
#include <type_traits>

#include <folly/Portability.h>
#include <folly/Traits.h>
#include <folly/lang/SafeAssert.h>

namespace folly {

//  down_cast
//
//  Unchecked polymorphic down-cast using static_cast. Only works for pairs of
//  types where the cvref-unqualified source type is polymorphic and a base of
//  the target type. The target type, which is passed as an explicit template
//  param, must be cvref-unqualified. The return type is the target type with
//  the same cvref-qualifiers or cvptr-qualifiers as the source type.
//
//  Checked with an assertion in debug builds.
template <typename T, typename S>
FOLLY_ERASE like_t<S, T>* down_cast(S* ptr) noexcept {
  using Q = std::remove_cv_t<S>;
  static_assert(std::is_polymorphic<Q>::value, "not polymorphic");
  static_assert(std::is_base_of<Q, T>::value, "not down-castable");
  using R = like_t<S, T>;
  FOLLY_SAFE_DCHECK(dynamic_cast<R*>(ptr), "not a runtime down-cast");
  return static_cast<R*>(ptr);
}
template <typename T, typename S>
FOLLY_ERASE like_t<S&&, T> down_cast(S&& ref) noexcept {
  return static_cast<like_t<S&&, T>>(*down_cast<T>(std::addressof(ref)));
}

} // namespace folly

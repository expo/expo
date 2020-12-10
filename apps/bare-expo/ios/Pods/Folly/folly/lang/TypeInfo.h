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

#include <typeinfo>

#include <folly/Portability.h>

//  FOLLY_TYPE_INFO_OF
//
//  Returns &typeid(...) if RTTI is available, nullptr otherwise. In either
//  case, has type std::type_info const*.
#if FOLLY_HAS_RTTI
#define FOLLY_TYPE_INFO_OF(...) (&typeid(__VA_ARGS__))
#else
#define FOLLY_TYPE_INFO_OF(...) (static_cast<std::type_info const*>(nullptr))
#endif

namespace folly {

//  type_info_of
//
//  Returns &typeid(T) if RTTI is available, nullptr otherwise.
//
//  This overload works on the static type of the template parameter.
template <typename T>
FOLLY_ALWAYS_INLINE static std::type_info const* type_info_of() {
  return FOLLY_TYPE_INFO_OF(T);
}

//  type_info_of
//
//  Returns &typeid(t) if RTTI is available, nullptr otherwise.
//
//  This overload works on the dynamic type of the non-template parameter.
template <typename T>
FOLLY_ALWAYS_INLINE static std::type_info const* type_info_of(T const& t) {
  return FOLLY_TYPE_INFO_OF(t);
}

} // namespace folly

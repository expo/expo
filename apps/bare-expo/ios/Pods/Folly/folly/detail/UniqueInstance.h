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

#include <cstdint>
#include <typeinfo>

#include <folly/detail/StaticSingletonManager.h>

namespace folly {
namespace detail {

class UniqueInstance {
 public:
  template <typename... Key, typename... Mapped>
  FOLLY_EXPORT explicit UniqueInstance(
      char const* tmpl,
      tag_t<Key...>,
      tag_t<Mapped...>) noexcept {
    static Ptr const ptrs[] = {&typeid(Key)..., &typeid(Mapped)...};
    auto& global = createGlobal<Value, tag_t<Tag, Key...>>();
    enforce(tmpl, ptrs, sizeof...(Key), sizeof...(Mapped), global);
  }

  UniqueInstance(UniqueInstance const&) = delete;
  UniqueInstance(UniqueInstance&&) = delete;
  UniqueInstance& operator=(UniqueInstance const&) = delete;
  UniqueInstance& operator=(UniqueInstance&&) = delete;

 private:
  struct Tag {};

  using Ptr = std::type_info const*;
  struct PtrRange {
    Ptr const* b;
    Ptr const* e;
  };
  struct Value {
    char const* tmpl;
    Ptr const* ptrs;
    std::uint32_t key_size;
    std::uint32_t mapped_size;
  };

  //  Under Clang, this call signature shrinks the aligned and padded size of
  //  call-sites, as compared to a call signature taking Value or Value const&.
  static void enforce(
      char const* tmpl,
      Ptr const* ptrs,
      std::uint32_t key_size,
      std::uint32_t mapped_size,
      Value& global) noexcept;
};

} // namespace detail
} // namespace folly

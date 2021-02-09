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

#include <folly/detail/UniqueInstance.h>

#include <cstdlib>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

#include <folly/Demangle.h>
#include <folly/lang/Exception.h>

namespace folly {
namespace detail {

namespace {

using Ptr = std::type_info const*;
struct PtrRange {
  Ptr const* b;
  Ptr const* e;
};

template <typename Value>
PtrRange ptr_range_key(Value value) {
  auto const data = value.ptrs;
  return {data, data + value.key_size};
}

template <typename Value>
PtrRange ptr_range_mapped(Value value) {
  auto const data = value.ptrs + value.key_size;
  return {data, data + value.mapped_size};
}

bool equal(PtrRange lhs, PtrRange rhs) {
  auto const cmp = [](auto a, auto b) { return *a == *b; };
  return std::equal(lhs.b, lhs.e, rhs.b, rhs.e, cmp);
}

std::string join(PtrRange types) {
  std::ostringstream ret;
  for (auto t = types.b; t != types.e; ++t) {
    if (t != types.b) {
      ret << ", ";
    }
    ret << demangle((*t)->name());
  }
  return ret.str();
}

template <typename Value>
std::string render(Value value) {
  auto const key_s = join(ptr_range_key(value));
  auto const mapped_s = join(ptr_range_mapped(value));
  std::ostringstream ret;
  ret << value.tmpl << "<" << key_s << ", " << mapped_s << ">";
  return ret.str();
}

} // namespace

void UniqueInstance::enforce(
    char const* tmpl,
    Ptr const* ptrs,
    std::uint32_t key_size,
    std::uint32_t mapped_size,
    Value& global) noexcept {
  Value const local{tmpl, ptrs, key_size, mapped_size};

  if (!global.tmpl) {
    global = local;
    return;
  }
  if (!equal(ptr_range_key(global), ptr_range_key(local))) {
    throw_exception<std::logic_error>("mismatched unique instance");
  }
  if (std::strcmp(global.tmpl, local.tmpl) == 0 &&
      equal(ptr_range_mapped(global), ptr_range_mapped(local))) {
    return;
  }

  auto const key = ptr_range_key(local);

  std::ios_base::Init io_init;
  std::cerr << "Overloaded unique instance over <" << join(key) << ", ...> "
            << "with differing trailing arguments:\n"
            << "  " << render(global) << "\n"
            << "  " << render(local) << "\n";
  std::abort();
}

} // namespace detail
} // namespace folly

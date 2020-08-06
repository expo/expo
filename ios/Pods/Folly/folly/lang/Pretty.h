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

#include <cstddef>
#include <type_traits>

#include <folly/Portability.h>

namespace folly {

namespace detail {

template <std::size_t S>
struct pretty_carray {
  char data[S];
};

template <std::size_t S>
static constexpr pretty_carray<S> pretty_carray_from(char const (&in)[S]) {
  pretty_carray<S> out{};
  for (std::size_t i = 0; i < S; ++i) {
    out.data[i] = in[i];
  }
  return out;
}

struct pretty_info {
  std::size_t b;
  std::size_t e;
};

template <typename To, std::size_t S>
static constexpr To pretty_info_to(pretty_info info, char const (&name)[S]) {
  return To(name + info.b, info.e - info.b);
}

template <std::size_t S>
static constexpr std::size_t pretty_lfind(
    char const (&haystack)[S],
    char const needle) {
  for (std::size_t i = 0; i < S - 1; ++i) {
    if (haystack[i] == needle) {
      return i;
    }
  }
  return ~std::size_t(0);
}

template <std::size_t S>
static constexpr std::size_t pretty_rfind(
    char const (&haystack)[S],
    char const needle) {
  for (std::size_t i = S; i != 0; --i) {
    if (haystack[i - 1] == needle) {
      return i - 1;
    }
  }
  return ~std::size_t(0);
}

struct pretty_tag_msc {};
struct pretty_tag_gcc {};

using pretty_default_tag = std::conditional_t< //
    kMscVer && !kIsClang,
    pretty_tag_msc,
    pretty_tag_gcc>;

template <typename T>
static constexpr auto pretty_raw(pretty_tag_msc) {
#if defined(_MSC_VER)
  return pretty_carray_from(__FUNCSIG__);
#endif
}

template <typename T>
static constexpr auto pretty_raw(pretty_tag_gcc) {
#if defined(__GNUC__) || defined(__clang__)
  return pretty_carray_from(__PRETTY_FUNCTION__);
#endif
}

template <std::size_t S>
static constexpr pretty_info pretty_parse(
    pretty_tag_msc,
    char const (&name)[S]) {
  //  void __cdecl folly::detail::pretty_raw<{...}>(
  //      folly::detail::pretty_tag_msc)
  auto const la = pretty_lfind(name, '<');
  auto const rp = pretty_rfind(name, '>');
  return pretty_info{la + 1, rp};
}

template <std::size_t S>
static constexpr pretty_info pretty_parse(
    pretty_tag_gcc,
    char const (&name)[S]) {
  //  void folly::detail::pretty_raw(
  //      folly::detail::pretty_tag_gcc) [T = {...}]
  auto const eq = pretty_lfind(name, '=');
  auto const br = pretty_rfind(name, ']');
  return pretty_info{eq + 2, br};
}

template <typename T, typename Tag>
struct pretty_name_zarray {
  static constexpr auto raw_() {
    constexpr auto const raw_ = pretty_raw<T>(Tag{});
    return raw_;
  }
  static constexpr auto raw = raw_(); // indirection b/c of gcc-5.3 ice, gh#1105
  static constexpr auto info = pretty_parse(Tag{}, raw.data);
  static constexpr auto size = info.e - info.b;
  static constexpr auto zarray_() {
    pretty_carray<size + 1> data{};
    for (std::size_t i = 0; i < size; ++i) {
      data.data[i] = raw.data[info.b + i];
    }
    data.data[size] = 0;
    return data;
  }
  static constexpr pretty_carray<size + 1> zarray = zarray_();
};

template <typename T, typename Tag>
constexpr pretty_carray<pretty_name_zarray<T, Tag>::size + 1>
    pretty_name_zarray<T, Tag>::zarray;

} // namespace detail

//  pretty_name
//
//  Returns a statically-allocated C string containing the pretty name of T.
//
//  The pretty name of a type varies by compiler, may include tokens which
//  would not be present in the type name as it is spelled in the source code
//  or as it would be symbolized, and may not include tokens which would be
//  present in the type name as it would be symbolized.
template <typename T>
constexpr char const* pretty_name() {
  return detail::pretty_name_zarray<T, detail::pretty_default_tag>::zarray.data;
}

} // namespace folly

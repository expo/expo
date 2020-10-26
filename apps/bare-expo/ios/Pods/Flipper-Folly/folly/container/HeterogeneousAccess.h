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

#include <functional>
#include <string>

#include <folly/Range.h>
#include <folly/Traits.h>
#include <folly/container/HeterogeneousAccess-fwd.h>
#include <folly/hash/Hash.h>

namespace folly {

// folly::HeterogeneousAccessEqualTo<T>, and
// folly::HeterogeneousAccessHash<T> are functors suitable as defaults
// for containers that support heterogeneous access.  When possible, they
// will be marked as transparent.  When no transparent implementation
// is available then they fall back to std::equal_to and std::hash
// respectively.  Since the fallbacks are not marked as transparent,
// heterogeneous lookup won't be available in that case.  A corresponding
// HeterogeneousAccessLess<T> could be easily added if desired.
//
// If T can be implicitly converted to a StringPiece or
// to a Range<T::value_type const*> that is hashable, then
// HeterogeneousAccess{EqualTo,Hash}<T> will be transparent without any
// additional work.  In practice this is true for T that can be convered to
// StringPiece or Range<IntegralType const*>.  This includes std::string,
// std::string_view (when available), std::array, folly::Range,
// std::vector, and folly::small_vector.
//
// Additional specializations of HeterogeneousAccess*<T> should go in
// the header that declares T.  Don't forget to typedef is_transparent to
// void and folly_is_avalanching to std::true_type in the specializations.

template <typename T, typename Enable>
struct HeterogeneousAccessEqualTo : std::equal_to<T> {};

template <typename T, typename Enable>
struct HeterogeneousAccessHash : std::hash<T> {
  using folly_is_avalanching = IsAvalanchingHasher<std::hash<T>, T>;
};

//////// strings

namespace detail {

template <typename T, typename Enable = void>
struct ValueTypeForTransparentConversionToRange {
  using type = char;
};

// We assume that folly::hasher<folly::Range<T const*>> won't be enabled
// when it would be lower quality than std::hash<U> for a U that is
// convertible to folly::Range<T const*>.
template <typename T>
struct ValueTypeForTransparentConversionToRange<
    T,
    void_t<decltype(
        std::declval<hasher<Range<typename T::value_type const*>>>()(
            std::declval<Range<typename T::value_type const*>>()))>> {
  using type = std::remove_const_t<typename T::value_type>;
};

template <typename T>
using TransparentlyConvertibleToRange = std::is_convertible<
    T,
    Range<typename ValueTypeForTransparentConversionToRange<T>::type const*>>;

template <typename T>
struct TransparentRangeEqualTo {
  using is_transparent = void;

  template <typename U1, typename U2>
  bool operator()(U1 const& lhs, U2 const& rhs) const {
    return Range<T const*>{lhs} == Range<T const*>{rhs};
  }

  // This overload is not required for functionality, but
  // guarantees that replacing std::equal_to<std::string> with
  // HeterogeneousAccessEqualTo<std::string> is truly zero overhead
  bool operator()(std::string const& lhs, std::string const& rhs) const {
    return lhs == rhs;
  }
};

template <typename T>
struct TransparentRangeHash {
  using is_transparent = void;
  using folly_is_avalanching = std::true_type;

 private:
  template <typename U>
  static std::size_t hashImpl(Range<U const*> piece) {
    return hasher<Range<U const*>>{}(piece);
  }

  static std::size_t hashImpl(StringPiece piece) {
#if defined(_GLIBCXX_STRING)
    return std::_Hash_impl::hash(piece.begin(), piece.size());
#elif defined(_LIBCPP_STRING)
    return std::__do_string_hash(piece.begin(), piece.end());
#else
    return hasher<StringPiece>{}(piece);
#endif
  }

 public:
  template <typename U>
  std::size_t operator()(U const& stringish) const {
    return hashImpl(Range<T const*>{stringish});
  }

  // Neither this overload nor the platform-conditional compilation
  // is required for functionality, but implementing it this
  // way guarantees that replacing std::hash<std::string> with
  // HeterogeneousAccessHash<std::string> is actually zero overhead
  // in the case that the underlying implementations make different
  // optimality tradeoffs (short versus long string performance, for
  // example).  If folly::hasher<StringPiece> dominated the performance
  // of std::hash<std::string> then we should consider using it all of
  // the time.
  std::size_t operator()(std::string const& str) const {
#if defined(_GLIBCXX_STRING) || defined(_LIBCPP_STRING)
    return std::hash<std::string>{}(str);
#else
    return hasher<StringPiece>{}(str);
#endif
  }
};

} // namespace detail

template <typename T>
struct HeterogeneousAccessEqualTo<
    T,
    std::enable_if_t<detail::TransparentlyConvertibleToRange<T>::value>>
    : detail::TransparentRangeEqualTo<
          typename detail::ValueTypeForTransparentConversionToRange<T>::type> {
};

template <typename T>
struct HeterogeneousAccessHash<
    T,
    std::enable_if_t<detail::TransparentlyConvertibleToRange<T>::value>>
    : detail::TransparentRangeHash<
          typename detail::ValueTypeForTransparentConversionToRange<T>::type> {
};

} // namespace folly

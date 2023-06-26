/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0butter/ABI49_0_0butter.h>

// `folly::small_vector` is broken on some versions of Android.
#if defined(BUTTER_USE_FOLLY_CONTAINERS) && !defined(ANDROID)

#include <folly/small_vector.h>

#else

#include <vector>

#endif

namespace ABI49_0_0facebook {
namespace butter {

#if defined(BUTTER_USE_FOLLY_CONTAINERS) && !defined(ANDROID)

template <typename T, std::size_t Size, typename... Ts>
using small_vector = folly::small_vector<T, Size, Ts...>;

#else

template <typename T, std::size_t Size, typename... Ts>
using small_vector = std::vector<T, Ts...>;

#endif

} // namespace butter
} // namespace ABI49_0_0facebook

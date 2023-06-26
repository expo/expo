/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0butter/ABI49_0_0butter.h>

#if (                                            \
    defined(BUTTER_FUNCTION_OVERRIDE_INCLUDE) && \
    defined(BUTTER_FUNCTION_OVERRIDE))

#include BUTTER_FUNCTION_OVERRIDE_INCLUDE

#elif defined(BUTTER_USE_FOLLY_CONTAINERS)

#include <folly/Function.h>

#else

#include <functional>

#endif

namespace ABI49_0_0facebook {
namespace butter {

#if (                                            \
    defined(BUTTER_FUNCTION_OVERRIDE_INCLUDE) && \
    defined(BUTTER_FUNCTION_OVERRIDE))

template <typename... Ts>
using function = BUTTER_FUNCTION_OVERRIDE<Ts...>;

#elif defined(BUTTER_USE_FOLLY_CONTAINERS)

template <typename... Ts>
using function = folly::Function<Ts...>;

#else

template <typename... Ts>
using function = std::function<Ts...>;

#endif

} // namespace butter
} // namespace ABI49_0_0facebook

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

folly::dynamic mergeDynamicProps(
    folly::dynamic const &source,
    folly::dynamic const &patch);

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

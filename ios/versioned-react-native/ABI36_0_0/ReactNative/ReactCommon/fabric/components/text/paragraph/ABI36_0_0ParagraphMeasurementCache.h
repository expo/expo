/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI36_0_0React/attributedstring/AttributedString.h>
#include <ABI36_0_0React/attributedstring/ParagraphAttributes.h>
#include <ABI36_0_0React/core/LayoutConstraints.h>
#include <ABI36_0_0React/utils/SimpleThreadSafeCache.h>

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

using ParagraphMeasurementCacheKey =
    std::tuple<AttributedString, ParagraphAttributes, LayoutConstraints>;
using ParagraphMeasurementCacheValue = Size;
using ParagraphMeasurementCache = SimpleThreadSafeCache<
    ParagraphMeasurementCacheKey,
    ParagraphMeasurementCacheValue,
    256>;

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook

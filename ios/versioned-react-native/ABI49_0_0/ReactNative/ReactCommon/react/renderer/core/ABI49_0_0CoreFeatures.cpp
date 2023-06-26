/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0CoreFeatures.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

bool CoreFeatures::enablePropIteratorSetter = false;
bool CoreFeatures::enableMapBuffer = false;
bool CoreFeatures::blockPaintForUseLayoutEffect = false;
bool CoreFeatures::useNativeState = false;
bool CoreFeatures::cacheNSTextStorage = false;
bool CoreFeatures::cacheLastTextMeasurement = false;
bool CoreFeatures::cancelImageDownloadsOnRecycle = false;

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook

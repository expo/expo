/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef ANDROID

#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBuffer.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

constexpr MapBuffer::Key PROPS_MAX = 1;
constexpr MapBuffer::Key PROPS_NATIVE_ID = 1;

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

#endif

/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0JSBundleType.h"

#include <folly/Bits.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;
static uint32_t constexpr HBCBundleMagicNumber = 0xffe7c3c3;

ScriptTag parseTypeFromHeader(const BundleHeader &header) {
  switch (folly::Endian::little(header.magic)) {
    case RAMBundleMagicNumber:
      return ScriptTag::RAMBundle;
    case HBCBundleMagicNumber:
      return ScriptTag::HBCBundle;
    default:
      return ScriptTag::String;
  }
}

const char *stringForScriptTag(const ScriptTag &tag) {
  switch (tag) {
    case ScriptTag::String:
      return "String";
    case ScriptTag::RAMBundle:
      return "RAM Bundle";
    case ScriptTag::HBCBundle:
      return "HBC Bundle";
  }
  return "";
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook

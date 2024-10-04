/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0JSBundleType.h"

#include <folly/Bits.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;

ScriptTag parseTypeFromHeader(const BundleHeader &header) {
  switch (folly::Endian::little(header.magic)) {
    case RAMBundleMagicNumber:
      return ScriptTag::RAMBundle;
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
  }
  return "";
}

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook

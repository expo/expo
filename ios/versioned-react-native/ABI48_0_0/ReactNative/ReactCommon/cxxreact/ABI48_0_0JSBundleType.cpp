/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0JSBundleType.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;
static uint32_t constexpr MetroHBCBundleMagicNumber = 0xFFE7C3C3;

// "Hermes" in ancient Greek encoded in UTF-16BE and truncated to 8 bytes.
static uint64_t constexpr HermesBCBundleMagicNumber = 0x1F1903C103BC1FC6;

ScriptTag parseTypeFromHeader(const BundleHeader &header) {
  switch (header.magic32.value) {
    case RAMBundleMagicNumber:
      return ScriptTag::RAMBundle;
    case MetroHBCBundleMagicNumber:
      return ScriptTag::MetroHBCBundle;
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
    case ScriptTag::MetroHBCBundle:
      return "Metro Hermes Bytecode Bundle";
  }
  return "";
}

bool isHermesBytecodeBundle(const BundleHeader &header) {
  return header.magic64 == HermesBCBundleMagicNumber;
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

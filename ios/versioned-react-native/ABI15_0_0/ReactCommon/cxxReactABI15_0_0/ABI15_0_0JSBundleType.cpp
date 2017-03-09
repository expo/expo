// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI15_0_0JSBundleType.h"
#include "ABI15_0_0oss-compat-util.h"

namespace facebook {
namespace ReactABI15_0_0 {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;
static uint64_t constexpr BCBundleMagicNumber  = 0xFF4865726D657300;

ScriptTag parseTypeFromHeader(const BundleHeader& header) {
  if (littleEndianToHost(header.RAMMagic) == RAMBundleMagicNumber) {
    return ScriptTag::RAMBundle;
  }

  if (littleEndianToHost(header.BCMagic) == BCBundleMagicNumber) {
    return ScriptTag::BCBundle;
  }

  return ScriptTag::String;
}

const char *stringForScriptTag(const ScriptTag& tag) {
  switch (tag) {
    case ScriptTag::String:
      return "String";
    case ScriptTag::RAMBundle:
      return "RAM Bundle";
    case ScriptTag::BCBundle:
      return "BC Bundle";
  }
  return "";
}

}  // namespace ReactABI15_0_0
}  // namespace facebook

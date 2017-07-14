// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI19_0_0JSBundleType.h"
#include "ABI19_0_0oss-compat-util.h"

namespace facebook {
namespace ReactABI19_0_0 {

static uint32_t constexpr RAMBundleMagicNumber = 0xFB0BD1E5;
static uint32_t constexpr BCBundleMagicNumber  = 0x6D657300;

ScriptTag parseTypeFromHeader(const BundleHeader& header) {

  switch (littleEndianToHost(header.magic)) {
  case RAMBundleMagicNumber:
    return ScriptTag::RAMBundle;
  case BCBundleMagicNumber:
    return ScriptTag::BCBundle;
  default:
    return ScriptTag::String;
  }
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

}  // namespace ReactABI19_0_0
}  // namespace facebook

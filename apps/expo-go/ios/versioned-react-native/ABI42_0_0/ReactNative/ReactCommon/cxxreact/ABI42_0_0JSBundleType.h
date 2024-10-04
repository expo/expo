/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Portability.h>
#include <cstdint>
#include <cstring>

#ifndef ABI42_0_0RN_EXPORT
#define ABI42_0_0RN_EXPORT __attribute__((visibility("default")))
#endif

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * ScriptTag
 *
 * Scripts given to the JS Executors to run could be in any of the following
 * formats. They are tagged so the executor knows how to run them.
 */
enum struct ScriptTag {
  String = 0,
  RAMBundle,
  BCBundle,
};

/**
 * BundleHeader
 *
 * RAM bundles and BC bundles begin with headers. For RAM bundles this is
 * 4 bytes, for BC bundles this is 12 bytes. This structure holds the first 12
 * bytes from a bundle in a way that gives access to that information.
 */
FOLLY_PACK_PUSH
struct FOLLY_PACK_ATTR BundleHeader {
  BundleHeader() {
    std::memset(this, 0, sizeof(BundleHeader));
  }

  uint32_t magic;
  uint32_t reserved_;
  uint32_t version;
};
FOLLY_PACK_POP

/**
 * parseTypeFromHeader
 *
 * Takes the first 8 bytes of a bundle, and returns a tag describing the
 * bundle's format.
 */
ABI42_0_0RN_EXPORT ScriptTag parseTypeFromHeader(const BundleHeader &header);

/**
 * stringForScriptTag
 *
 * Convert an `ScriptTag` enum into a string, useful for emitting in errors
 * and diagnostic messages.
 */
ABI42_0_0RN_EXPORT const char *stringForScriptTag(const ScriptTag &tag);

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook

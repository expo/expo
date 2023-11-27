/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkHeifDecoder_DEFINED
#define SkHeifDecoder_DEFINED

#include "include/codec/SkCodec.h"
#include "include/core/SkRefCnt.h"

class SkData;
class SkStream;

#include <memory>

// This codec depends on heif libraries that are only part of the Android framework.
// It will not work on other platforms currently.
//
// For historical reasons, this codec also decodes AVIF images.
// There is a newer, dedicated SkAvifDecoder which could be used instead.
namespace SkHeifDecoder {

/** Returns true if this data claims to be a HEIF (or AVIF) image. */
SK_API bool IsHeif(const void*, size_t);

/**
 *  Attempts to decode the given bytes as a HEIF (or AVIF).
 *
 *  If the bytes are not a HEIF (or AVIF), returns nullptr.
 *
 *  DecodeContext is treated as a SkCodec::SelectionPolicy*
 */
SK_API std::unique_ptr<SkCodec> Decode(std::unique_ptr<SkStream>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);
SK_API std::unique_ptr<SkCodec> Decode(sk_sp<SkData>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);

// Do not register this codec using "avif" as the key (even though it can handle that type).
// Doing so would cause internal codec sniffing to choose the wrong sampler.
inline SkCodecs::Decoder Decoder() {
    return { "heif", IsHeif, Decode };
}

}  // namespace SkHeifDecoder

#endif  // SkHeifDecoder_DEFINED

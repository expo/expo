/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#ifndef SkAvifDecoder_DEFINED
#define SkAvifDecoder_DEFINED

#include "include/codec/SkCodec.h"
#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class SkData;
class SkStream;

#include <memory>

namespace SkAvifDecoder {

/** Returns true if this data claims to be a AVIF image. */
SK_API bool IsAvif(const void*, size_t);

/**
 *  Attempts to decode the given bytes as a AVIF.
 *
 *  If the bytes are not a AVIF, returns nullptr.
 *
 *  DecodeContext is ignored
 */
SK_API std::unique_ptr<SkCodec> Decode(std::unique_ptr<SkStream>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);
SK_API std::unique_ptr<SkCodec> Decode(sk_sp<SkData>,
                                       SkCodec::Result*,
                                       SkCodecs::DecodeContext = nullptr);

inline SkCodecs::Decoder Decoder() {
    return { "avif", IsAvif, Decode };
}

}  // namespace SkAvifDecoder

#endif  // SkAvifDecoder_DEFINED
